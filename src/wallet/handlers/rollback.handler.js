import {getCurrentDatetime} from '../../utils/get-current-datetime.js'
import {pool} from '../pool.js'
import {getRedisClient} from '../../utils/redis.js'
import mysql2 from 'mysql2/promise'
import {fixNumber} from './constats.js'
import {prSendData} from '../../utils/pr-amqp.js'

export async function rollbackHandler(req, res) {
  const token = req.query.token
  const transactionId = req.query.transactionKey
  const uuid = req.query.gameId

  const client = await getRedisClient()

  const data = await client.get(`aspect-initial-token:${token}`).then(JSON.parse)

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

  try {
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

    const [[bonus]] = await pool.query(`
        select cast(value as json) as value
        from global.configurations
        where code = 'plus_bonus'
          and prefix = ?
    `, [data.prefix])

    /** @type {mysql2.Connection} */
    const trx = await mysql2.createConnection({
      ...project.config,
      decimalNumbers: true,
    })

    try {
      await trx.beginTransaction()

      let rate = 1

      const [[user]] = await trx.query(`
          select id                                  as id,
                 balance                             as balance,
                 greatest(0, (balance - plus_bonus)) as realBalance,
                 least(balance, plus_bonus)          as plusBonus,
                 username                            as username,
                 currency                            as currency,
                 active                              as active,
                 deleted                             as deleted,
                 unix_timestamp(created_at)          as createdAt
          from users
          where id = ?
            and active = 1
            and deleted = 0
              for
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

      const [[game]] = await trx.query(`
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

      if (!game) {
        res.status(200).json({
          error: 'Invalid Game ID',
          errorCode: 1008,
        }).end()
        console.error('game not found')
        await trx.rollback()
        return
      }

      if (bonus && !bonus.value[game.section]) {
        user.balance = user.realBalance
      }

      if (user.currency === 'TOM') {
        rate = await client.get(`exchange-rate:tom:to:usd:${project.prefix}`).then(Number)

        const [[userBalance]] = await trx.query(`
            select id                                      as id,
                   balance / ?                             as balance,
                   greatest(0, (balance - plus_bonus)) / ? as realBalance
            from users
            where id = ?
        `, [rate, rate, user.id])

        if (bonus && !bonus.value[game.section]) {
          userBalance.balance = userBalance.realBalance
        }

        user.balance = userBalance.balance
        user.currency = 'USD'
      }

      const [[transaction]] = await trx.query(`
          select *
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

        const response = {
          success: true,
          balance: fixNumber(user.balance),
        }

        res.status(200).json(response).end()
        await trx.commit()
        return
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
          const currencyRate = await client.get(`currency`).then(JSON.parse)

          await pool.query(`
              update casino.restrictions
              set ggr = ggr + (? / ?)
              where code = ?
          `, [transaction.amount, currencyRate[user.currency] || 1, game.providerUid])

          await trx.query(`
              update users
              set balance = balance + ? * ?
              where id = ?
          `, [transaction.amount, rate, user.id])
          break
        }
      }

      await trx.query(`
          update casino_transactions
          set action = 'ROLLBACK'
          where id = ?
      `, [transaction.id])

      const [[updatedBalance]] = await trx.query(`
          select cast((balance / ${rate}) as float)                             as balance,
                 cast((greatest(0, (balance - plus_bonus)) / ${rate}) as float) as realBalance,
                 greatest(0, (balance - plus_bonus))                            as historyBalance,
                 least(balance, plus_bonus)                                     as plusBonus
          from users
          where id = ?
      `, [user.id])

      console.error(JSON.stringify(updatedBalance))

      const balanceHistory = {
        balanceBefore: user.realBalance,
        balanceAfter: updatedBalance.historyBalance,
        bonusBefore: user.plusBonus,
        bonusAfter: updatedBalance.plusBonus,
      }

      const historyInfo = {
        rate: rate,
        provider: game.provider,
        aggregator: game.aggregator,
        section: game.section,
        uuid: game.uuid,
        gameName: game.name,
        transactionId: transaction.id,
        action: 'ROLLBACK',
      }

      await trx.query(`
          insert into balance_history (user_id, type, amount, balance, info)
          values (?, 10, ? * ?, ?, ?)
      `, [user.id, transaction.action === 'BET' ? transaction.amount : -transaction.amount, rate, JSON.stringify(balanceHistory), JSON.stringify(historyInfo)])

      const [[pr]] = await trx.query(`
          select unix_timestamp(inserted_at)                                                    as updatedAt
               , unix_timestamp(date(inserted_at))                                              as date
               , unix_timestamp(date(inserted_at) - interval (dayofmonth(inserted_at) - 1) day) as month
               , amount                                                                         as amount
          from casino_transactions
          where id = ?
      `, [transaction.id])

      await prSendData(pr.month, {
        id: user.id,
        username: user.username,
        currency: user.currency,
        prefix: project.prefix,
        month: pr.month,
        createdAt: user.createdAt,
        active: user.active,
        deleted: user.deleted,
      }, {
        report: {
          update: {
            updatedAt: pr.updatedAt,
            finalBalance: updatedBalance.historyBalance,
            finalBonus: updatedBalance.plusBonus,
            ggrCasino: -pr.amount,
            ggrTotal: -pr.amount,
            dropAmount: 0,
            dropCount: 0,
          },
        },
      })

      if (bonus && !bonus.value[game.section]) {
        updatedBalance.balance = updatedBalance.realBalance
      }
      console.log('rollback aspect amount,body,Date', transaction.amount, Date.now())

      const response = {
        success: true,
        balance: fixNumber(updatedBalance.balance),
      }

      await trx.commit()
      res.status(200).json(response).end()
      return
    } catch (e) {
      await trx.rollback()
      console.error(getCurrentDatetime(), e)
    } finally {
      await trx.end()
    }
  } catch (e) {
    console.error(getCurrentDatetime(), e)
  }
  res.status(500).json({message: 'internal server error'}).end()
}
