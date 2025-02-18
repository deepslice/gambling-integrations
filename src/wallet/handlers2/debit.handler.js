import {getCurrentDatetime} from '../../utils/get-current-datetime.js'
import {getPool, pool} from '../pool.js'
import {getRedisClient} from '../../utils/redis.js'
import mysql2 from 'mysql2/promise'
import {fixNumber} from '../handlers/constats.js'
import {checkParentRecursive} from '../../utils/check-parent-recursive.js'
import {getBetLimit} from '../../utils/get-bet-limit.js'
import {balanceHistory} from '../../utils/balance-history.js'

export async function debitHandler(req, res, next) {
  try {
    const client = await getRedisClient()
    const token = req.query.token
    const uuid = req.query.gameId
    const amount = Number(req.query.amount)
    const transactionId = req.query.transactionKey

    const data = await client.get(`aspect-initial-token:${token}`).then(JSON.parse)

    const wageringId = data.wageringId

    if (!data) {
      const response = {
        error: 'Invalid Token',
        errorCode: 1002,
      }

      res.status(200).json(response).end()
      console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, 'D1', req.path, JSON.stringify(req.body), JSON.stringify(response))
      return
    }

    const prefix = data.prefix

    if (['tor', 'sky', 'sku', 'rich', 'mbt', 'mbu', 'abu', 'hbu', 'prd', 'pru', 'dlb', 'dlu', 'clb', 'clu', 'abyr', 'olv'].includes(prefix)) {
      next()
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
      console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, 'D2', req.path, JSON.stringify(req.body))
      return
    }

    const wPool = getPool(prefix, project.config)

    const [[game]] = await wPool.query(`
        select g.uuid                      as uuid
             , g.provider                  as provider
             , g.aggregator                as aggregator
             , g.site_section              as section
             , g.name                      as name
             , g.provider_uid              as providerUid
             , ifnull(cg.active, g.active) as active
             , deleted                     as deleted
        from casino.games g
                 left join casino_games cg on g.uuid = cg.uuid
        where g.uuid = concat('as:', ?)
          and aggregator = 'aspect'
    `, [uuid])

    /** @type {mysql2.Connection} */
    const trx = await mysql2.createConnection({
      ...project.config,
      decimalNumbers: true,
    })

    try {
      await trx.beginTransaction()

      const [[user]] = await trx.query(`
          select id                                      as id
               , balance                                 as balance
               , balance                                 as nativeBalance
               , real_balance                            as realBalance
               , json_extract(options, '$.transactions') as status
               , username                                as username
               , currency                                as currency
               , active                                  as active
               , deleted                                 as deleted
               , unix_timestamp(created_at)              as createdAt
          from users
          where id = ? for
          update
      `, [data.user.id])

      const [[transaction]] = await trx.query(`
          select id as id
          from casino_transactions
          where transaction_id = concat(?, ?)
      `, [transactionId, ':BET'])

      if (transaction) {
        await trx.rollback()
        res.status(500).end()
        console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, 'D3', req.path, JSON.stringify(req.body))
        return
      }

      if (amount < 0) {
        await trx.rollback()
        res.status(500).end()
        console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, 'D4', req.path, JSON.stringify(req.body))
        return
      }

      if (!game || !game.active || game.deleted) {
        const response = {
          error: 'Invalid Game ID',
          errorCode: 1008,
        }

        await trx.rollback()
        res.status(200).json(response).end()
        console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, 'D5', req.path, JSON.stringify(req.body), JSON.stringify(response))
        return
      }

      const parentActive = user && user.active && !user.deleted && await checkParentRecursive(user.parentId)

      if (!user || !parentActive) {
        const response = {
          error: 'Invalid Player',
          errorCode: 1,
        }

        await trx.rollback()
        res.status(200).json(response).end()
        console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, 'D6', req.path, JSON.stringify(req.body), JSON.stringify(response))
        return
      }

      if (user.status) {
        const status = user.status
        if (status.transactions || status.casino) {
          const response = {
            error: 'Insufficient Funds',
            errorCode: 1003,
          }

          await trx.rollback()
          res.status(200).json(response).end()
          console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, 'D7', req.path, JSON.stringify(req.body), JSON.stringify(response))
          return
        }
      }

      let rate = 1

      if (user.currency === 'TOM') {
        rate = await client.get(`exchange-rate:tom:to:usd:${project.prefix}`).then(Number)

        const [[userBalance]] = await trx.query(`
            select id          as id
                 , balance / ? as balance
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
          const response = {
            error: 'Invalid wagering Id',
            errorCode: 1008,
          }

          await trx.rollback()
          res.status(500).json(response).end()
          console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, 'D8', req.path, JSON.stringify(req.body), JSON.stringify(response))
          return
        }

        user.balance = wBalance.balance
      }

      if (user.balance < amount) {
        const response = {
          error: 'Insufficient Funds',
          errorCode: 1003,
        }

        await trx.rollback()
        res.status(200).json(response).end()
        console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, 'D9', req.path, JSON.stringify(req.body), JSON.stringify(response))
        return
      }

      const currencyRate = await client.get(`currency`).then(JSON.parse)

      const [[restrictions]] = await pool.query(`
          select ggr * ?                                   as ggr
               , if(max_ggr is not null, max_ggr - ggr, 1) as difference
          from casino.restrictions
          where code = ?
      `, [currencyRate[user.currency] || 1, game.providerUid])

      if (!restrictions || restrictions.ggr < amount || restrictions.difference <= 0) {
        const response = {
          error: 'Insufficient Funds',
          errorCode: 1003,
        }

        await trx.rollback()
        res.status(200).json(response).end()
        console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, 'D10', req.path, JSON.stringify(req.body), JSON.stringify(response))
        return
      }

      const [[limit]] = await pool.query(`
          select (bet_limit - ?) as betLimit
          from casino.limits
          where project_id = ?
      `, [amount, project.id])

      if (!limit || limit.betLimit < 0) {
        const response = {
          error: 'Insufficient Funds',
          errorCode: 1003,
        }

        await trx.rollback()
        res.status(200).json(response).end()
        console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, 'D11', req.path, JSON.stringify(req.body), JSON.stringify(response))
        return
      }

      const betLimit = await getBetLimit(pool, prefix, game, rate)

      if (betLimit < amount) {
        const response = {
          error: 'Insufficient Funds',
          errorCode: 1003,
        }

        await trx.rollback()
        res.status(200).json(response).end()
        console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, 'D12', req.path, JSON.stringify(req.body), JSON.stringify(response))
        return
      }

      const [{insertId: txId}] = await trx.query(`
          insert into casino_transactions (amount, transaction_id, player_id, action, aggregator, provider, game_id,
                                           currency, session_id, section, round_id, freespin_id)
          values (?, concat(?, ?), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [amount, transactionId, ':BET', user.id, 'BET', 'aspect',
        game.provider, game.uuid, user.currency, token, game.section, transactionId, wageringId ? wageringId : null])

      await trx.query(`
          insert into casino_rounds(bet_amount, win_amount, round_id, user_id, aggregator, provider, uuid,
                                    currency, additional_info)
          values (?, 0, concat('ca:', ?), ?, ?, ?, ?, ?, ?)
          on duplicate key update bet_amount = bet_amount + ?
      `, [amount, transactionId, user.id, 'caleta', game.provider, game.uuid, user.currency, wageringId ? JSON.stringify({wageringId}) : null, amount])

      await pool.query(`
          update casino.limits
          set bet_limit = bet_limit - ?
          where project_id = ?
      `, [amount, project.id])

      await pool.query(`
          update casino.restrictions
          set ggr = ggr - ? / ?
          where code = ?
      `, [amount, currencyRate[user.currency] || 1, game.providerUid])

      if (wageringId) {
        await trx.query(`
            update wagering_balance
            set balance = balance - ? * ?
            where id = ?
        `, [amount, rate, wageringId])

        const [[wageringFinal]] = await trx.query(`
            select balance / ? as balance
            from wagering_balance
            where id = ?
        `, [rate, wageringId])

        await trx.query(`
            insert into wagering_transactions (wagering_id, user_id, amount, balance_before, balance_after, reference)
            values (?, ?, ? * ?, ? * ?, ? * ?, concat('cas:', ?))
        `, [wageringId, user.id, amount, rate, user.balance, rate, wageringFinal.balance, rate, txId])

        user.balance = wageringFinal.balance
      } else {
        await trx.query(`
            update users
            set balance      = balance - ? * ?,
                real_balance = real_balance - ? * ?
            where id = ?
        `, [amount, rate, amount, rate, user.id])

        await balanceHistory(trx, user, -amount, rate, 10, {
          provider: game.provider,
          aggregator: game.aggregator,
          section: game.section,
          uuid: game.uuid,
          gameName: game.name,
          transactionId: txId,
          action: 'BET',
        }, 1)
      }


      // const [[pr]] = await trx.query(`
      //     select unix_timestamp(inserted_at)                                                    as updatedAt
      //          , unix_timestamp(date(inserted_at))                                              as date
      //          , unix_timestamp(date(inserted_at) - interval (dayofmonth(inserted_at) - 1) day) as month
      //          , amount                                                                         as amount
      //     from casino_transactions
      //     where id = ?
      // `, [insertId])
      // await prSendData(pr.month, {
      //   id: user.id,
      //   username: user.username,
      //   currency: user.currency,
      //   prefix: project.prefix,
      //   month: pr.month,
      //   date: pr.date,
      //   createdAt: user.createdAt,
      //   active: user.active,
      //   deleted: user.deleted,
      // }, {
      //   report: {
      //     update: {
      //       updatedAt: pr.updatedAt,
      //       finalBalance: updatedBalance.historyBalance,
      //       finalBonus: updatedBalance.plusBonus,
      //       ggrCasino: pr.amount,
      //       ggrTotal: pr.amount,
      //     },
      //   },
      // })
      //
      // await sfSendData(prefix, insertId, `aspect`, pr.amount, pr.month)

      const response = {
        success: true,
        balance: fixNumber(user.balance),
      }

      await trx.commit()
      res.status(200).json(response).end()
      console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, 'D13', req.path, JSON.stringify(req.body), JSON.stringify(response))
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

  res.status(500).json({message: 'Internal server error'}).end()
}
