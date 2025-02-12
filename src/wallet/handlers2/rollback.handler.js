import {getCurrentDatetime} from '../../utils/get-current-datetime.js'
import {getPool, pool} from '../pool.js'
import {getRedisClient} from '../../utils/redis.js'
import mysql2 from 'mysql2/promise'
import {fixNumber} from '../handlers/constats.js'
import {balanceHistory} from '../../utils/balance-history.js'
import {wbSendData} from '../../utils/wb-send-data.js'

export async function rollbackHandler(req, res) {
  try {
    const client = await getRedisClient()
    const token = req.query.token
    const transactionId = req.query.transactionKey
    const uuid = req.query.gameId

    const data = await client.get(`aspect-initial-token:${token}`).then(JSON.parse)

    const prefix = data.prefix
    const wageringId = data.wageringId

    if (!data) {
      const response = {
        error: 'Invalid Token',
        errorCode: 1002,
      }

      res.status(200).json(response).end()
      console.error('data')
      return
    }

    await client.setEx(`aspect-initial-token:${token}`, 30 * 60 * 60, JSON.stringify(data))

    const [[project]] = await pool.query(`
        select id                                  as id
             , prefix                              as prefix
             , db_name                             as db
             , json_extract(configs, '$.currency') as currency
             , json_extract(configs, '$.database') as config
        from global.settings
        where prefix = ?
    `, [data.prefix])

    if (!project) {
      res.status(500).end()
      console.error('prefix error')
      return
    }

    const wPool = getPool(prefix, project.config)

    const [[game]] = await wPool.query(`
        select g.uuid         as uuid,
               g.provider     as provider,
               g.aggregator   as aggregator,
               g.site_section as section,
               g.name         as name,
               g.provider_uid as providerUid
        from casino.games g
                 left join casino_games cg on g.uuid = cg.uuid
        where g.uuid = concat('as:', ?)
          and aggregator = 'aspect'
    `, [uuid])

    /** @type {mysql2.Connection} */
    const trx = await mysql2.createConnection({...project.config, decimalNumbers: true})

    try {
      await trx.beginTransaction()

      const [[user]] = await trx.query(`
          select id                         as id,
                 balance                    as balance,
                 balance                    as nativeBalance,
                 real_balance               as realBalance,
                 username                   as username,
                 currency                   as currency,
                 active                     as active,
                 deleted                    as deleted,
                 unix_timestamp(created_at) as createdAt
          from users
          where id = ? for
          update
      `, [data.user.id])

      if (!user) {
        const response = {
          error: 'Invalid Player',
          errorCode: 1001,
        }

        res.status(200).json(response).end()
        console.error('user not found')
        await trx.rollback()
        return
      }

      if (!game) {
        res.status(200).json({
          error: 'Invalid Game ID',
          errorCode: 1008,
        }).end()

        console.error('game not found')
        await trx.rollback()
        return
      }

      const [[transaction]] = await trx.query(`
          select id     as id,
                 amount as amount,
                 action as action
          from casino_transactions
          where transaction_id = concat(?, ?)
      `, [transactionId, ':BET'])

      if (!transaction) {
        await trx.query(`
            insert into casino_transactions (amount, transaction_id, player_id, action, aggregator, provider, game_id,
                                             currency, session_id, section, round_id)
            values (?, concat(?, ?), ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [0, transactionId, ':BET', user.id, 'ROLLBACK', 'aspect',
          game.provider, game.uuid, user.currency, token, game.section, transactionId])

        await trx.query(`
            insert into casino_transactions (amount, transaction_id, player_id, action, aggregator, provider, game_id,
                                             currency, session_id, section, round_id)
            values (?, concat(?, ?), ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [0, transactionId, ':ROLLBACK', user.id, 'ROLLBACK', 'aspect',
          game.provider, game.uuid, user.currency, token, game.section, transactionId])

        const response = {
          success: true,
          balance: fixNumber(user.balance),
        }

        res.status(200).json(response).end()
        await trx.commit()
        return
      }

      let rate = 1

      if (user.currency === 'TOM') {
        rate = await client.get(`exchange-rate:tom:to:usd:${project.prefix}`).then(Number)

        const [[userBalance]] = await trx.query(`
            select id          as id,
                   balance / ? as balance
            from users
            where id = ?
        `, [rate, user.id])

        user.balance = userBalance.balance
        user.currency = 'USD'
      }

      if (wageringId) {
        const [[wBalance]] = await trx.query(`
            select id          as id
                 , balance / ? as balance
            from wagering_balance
            where id = ?
              and user_id = ?
              and status = 1
              and free_spin = 0
              and (expires_at > now() or expires_at is null)
        `, [rate, wageringId, user.id])

        if (!wBalance) {
          await trx.rollback()
          res.status(200).json({
            error: 'Invalid wagering Id',
            errorCode: 1008,
          }).end()
          return
        }

        user.balance = wBalance.balance
      }

      switch (transaction.action) {
        case 'ROLLBACK':
          const response = {
            success: true,
            balance: user.balance,
          }

          res.status(200).json(response).end()
          await trx.rollback()
          return
        case 'WIN': {
          const response = {
            error: 'Could Not Rollback After Credit',
            errorCode: 1024,
          }

          res.status(200).json(response).end()
          await trx.rollback()
          return
        }
        case 'BET': {
          const [{insert: tx_id}] = await trx.query(`
              insert into casino_transactions (amount, transaction_id, player_id, action, aggregator, provider, game_id,
                                               currency, session_id, section, round_id, freespin_id)
              values (?, concat(?, ?), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [0, transactionId, ':rollback', user.id, 'ROLLBACK', 'aspect',
            game.provider, game.uuid, user.currency, token, game.section, transactionId, wageringId || null])

          await trx.query(`
              update casino_rounds
              set bet_amount = greatest(bet_amount - ?, 0),
                  status     = 1
              where round_id = ?
          `, [transaction.amount, transactionId])

          const currencyRate = await client.get(`currency`).then(JSON.parse)

          await pool.query(`
              update casino.restrictions
              set ggr = ggr + ? / ?
              where code = ?
          `, [transaction.amount, currencyRate[user.currency] || 1, game.providerUid])

          if (wageringId) {
            await trx.query(`
                update wagering_balance
                set balance = balance + ? * ?
                where id = ?
            `, [transaction.amount, rate, wageringId])

            const [[wageringFinal]] = await trx.query(`
                select balance / ? as balance
                from wagering_balance
                where id = ?
            `, [rate, wageringId])

            await trx.query(`
                insert into wagering_transactions (wagering_id, user_id, amount, balance_before, balance_after,
                                                   reference)
                values (?, ?, ? * ?, ? * ?, ? * ?, concat('cas:', ?))
#                 ToDo: transaction.id to tx_id?
            `, [wageringId, user.id, transaction.amount, rate, user.balance, rate, wageringFinal.balance, rate, transaction.id])

            await wbSendData(project.prefix, user.id, transactionId, wageringId)

            user.balance = wageringFinal.balance
          } else {
            await trx.query(`
                update users
                set balance = balance + ? * ?
                where id = ?
            `, [transaction.amount, rate, user.id])

            await balanceHistory(trx, user, transaction.amount, rate, 10, {
              provider: game.provider,
              aggregator: game.aggregator,
              section: game.section,
              uuid: game.uuid,
              gameName: game.name,
              transactionId: transaction.id,
              action: 'ROLLBACK',
            }, 1)
          }

          await trx.query(`
              update casino_transactions
              set action = 'ROLLBACK'
              where id = ?
          `, [transaction.id])

          break
        }
      }
      // const [[pr]] = await trx.query(`
      //     select unix_timestamp(inserted_at)                                                    as updatedAt
      //          , unix_timestamp(date(inserted_at))                                              as date
      //          , unix_timestamp(date(inserted_at) - interval (dayofmonth(inserted_at) - 1) day) as month
      //          , amount                                                                         as amount
      //     from casino_transactions
      //     where id = ?
      // `, [transaction.id])
      //
      // await prSendData(pr.month, {
      //   id: user.id,
      //   username: user.username,
      //   currency: user.currency,
      //   prefix: project.prefix,
      //   month: pr.month,
      //   createdAt: user.createdAt,
      //   active: user.active,
      //   deleted: user.deleted,
      // }, {
      //   report: {
      //     update: {
      //       updatedAt: pr.updatedAt,
      //       finalBalance: updatedBalance.historyBalance,
      //       finalBonus: updatedBalance.plusBonus,
      //       ggrCasino: -pr.amount,
      //       ggrTotal: -pr.amount,
      //       dropAmount: 0,
      //       dropCount: 0,
      //     },
      //   },
      // })
      // await sfSendData(prefix, insertId, `aspect`, pr.amount, pr.month)

      console.log('rollback aspect amount, body, Date', transaction.amount, Date.now())

      const response = {
        success: true,
        balance: fixNumber(user.balance),
      }

      await trx.commit()
      res.status(200).json(response).end()
      return
    } catch (e) {
      console.error(getCurrentDatetime(), e)
      await trx.rollback()
    } finally {
      await trx.end()
    }
  } catch (e) {
    console.error(getCurrentDatetime(), e)
  }
  res.status(500).json({message: 'internal server error'}).end()
}
