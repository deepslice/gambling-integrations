import {getCurrentDatetime} from '../../utils/get-current-datetime.js'
import {getPool, pool} from '../pool.js'
import {getRedisClient} from '../../utils/redis.js'
import mysql2 from 'mysql2/promise'
import {fixNumber} from '../handlers/constats.js'
import {convertCurrencyForUserV2} from '../../utils/convert-currency-for-user-v2.js'
import {handleWageringBalanceV2} from '../../utils/handle-wagering-balance-v2.js'
import {updateUserBalanceV2} from '../../utils/update-user-balance-v2.js'

export async function rollbackHandler(req, res) {
  try {
    const client = await getRedisClient()
    const token = req.query.token
    const transactionId = req.query.transactionKey
    const uuid = req.query.gameId

    const {prefix, userInfo, wageringBalanceId, convertCurrency, project} = req

    const wPool = getPool(prefix, project.config)

    const [[game]] = await wPool.query(`
        select g.uuid         as uuid
             , g.provider     as provider
             , g.aggregator   as aggregator
             , g.site_section as section
             , g.name         as name
             , g.provider_uid as providerUid
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
          select id                         as id
               , balance                    as balance
               , balance                    as nativeBalance
               , real_balance               as realBalance
               , username                   as username
               , currency                   as currency
               , currency                   as nativeCurrency
               , active                     as active
               , deleted                    as deleted
               , unix_timestamp(created_at) as createdAt
          from users
          where id = ? for
          update
      `, [userInfo.id])

      if (!user) {
        const response = {
          error: 'Invalid Player',
          errorCode: 1001,
        }

        await trx.rollback()
        res.status(200).json(response).end()
        console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Rollback1#####', req.path, JSON.stringify(req.body), JSON.stringify(response))
        return
      }

      if (!game) {
        const response = {
          error: 'Invalid Game ID',
          errorCode: 1008,
        }

        await trx.rollback()
        res.status(200).json(response).end()
        console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Rollback2#####', req.path, JSON.stringify(req.body), JSON.stringify(response))
        return
      }

      const conversion = await convertCurrencyForUserV2(convertCurrency, wPool, prefix, client, user, 1)

      if (!conversion.rate) {
        const response = {
          error: 'Global error.',
          errorCode: 1008,
        }

        await trx.rollback()
        res.status(200).json(response).end()
        console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Rollback3#####', req.path, JSON.stringify(req.body), JSON.stringify(response))
        return
      }

      const isWageringBalanceValid = await handleWageringBalanceV2(wPool, wageringBalanceId, user, conversion.rate)

      if (!isWageringBalanceValid) {
        const response = {
          error: 'Global error.',
          errorCode: 1008,
        }

        await trx.rollback()
        res.status(200).json(response).end()
        console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Rollback4#####', req.path, JSON.stringify(req.body), JSON.stringify(response))
        return
      }

      const [[transaction]] = await trx.query(`
          select id       as id
               , amount   as amount
               , action   as action
               , round_id as roundId
          from casino_transactions
          where transaction_id = concat(?, ?)
      `, [transactionId, ':BET'])

      if (!transaction) {
        await trx.query(`
            insert into casino_transactions (amount, transaction_id, player_id, action, aggregator, provider, game_id,
                                             currency, session_id, section, round_id, freespin_id)
            values (?, concat(?, ?), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [0, transactionId, ':BET', user.id, 'ROLLBACK', 'aspect',
          game.provider, game.uuid, user.nativeCurrency, token, game.section, transactionId, wageringBalanceId ? wageringBalanceId : null])

        await trx.query(`
            insert into casino_transactions (amount, transaction_id, player_id, action, aggregator, provider, game_id,
                                             currency, session_id, section, round_id, freespin_id)
            values (?, concat(?, ?), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [0, transactionId, ':ROLLBACK', user.id, 'ROLLBACK', 'aspect',
          game.provider, game.uuid, user.nativeCurrency, token, game.section, transactionId, wageringBalanceId ? wageringBalanceId : null])

        const response = {
          success: true,
          balance: fixNumber(user.balance),
        }

        await trx.commit()
        res.status(200).json(response).end()
        console.log(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Rollback5#####', req.path, JSON.stringify(req.body), JSON.stringify(response))
        return
      }

      switch (transaction.action) {
        case 'ROLLBACK':
          const response = {
            success: true,
            balance: user.balance,
          }

          await trx.rollback()
          res.status(200).json(response).end()
          console.log(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Rollback6#####', req.path, JSON.stringify(req.body), JSON.stringify(response))
          return
        case 'WIN': {
          const response = {
            error: 'Could Not Rollback After Credit',
            errorCode: 1024,
          }

          await trx.rollback()
          res.status(200).json(response).end()
          console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Rollback7#####', req.path, JSON.stringify(req.body), JSON.stringify(response))
          return
        }
        case 'BET': {
          const [{insertId: txId}] = await trx.query(`
              insert into casino_transactions (amount, transaction_id, player_id, action, aggregator, provider, game_id,
                                               currency, session_id, section, round_id, freespin_id)
              values (?, concat(?, ?), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [0, transactionId, ':rollback', user.id, 'ROLLBACK', 'aspect',
            game.provider, game.uuid, user.nativeCurrency, token, game.section, transactionId, wageringBalanceId ? wageringBalanceId : null])

          await trx.query(`
              update casino_rounds
              set bet_amount = greatest(bet_amount - ?, 0)
                , status     = 1
              where round_id = concat('ca:', ?)
          `, [transaction.amount, transactionId])

          await trx.query(`
              update casino_transactions
              set action = 'ROLLBACK'
              where id = ?
          `, [transaction.id])

          await trx.query(`
              update casino_converted_transactions
              set action = 3
              where id = ?
          `, [transaction.id])

          const currencyRate = await client.get(`currency`).then(JSON.parse)

          await pool.query(`
              update casino.restrictions
              set ggr = ggr + ? / ? / ?
              where code = ?
          `, [transaction.amount, conversion.rate, currencyRate[user.currency] || 1, game.providerUid])

          await updateUserBalanceV2(trx, txId, prefix, transaction.roundId, 'ROLLBACK', user, transaction.amount, game, conversion.rate, wageringBalanceId, 1)
          break
        }
      }

      const response = {
        success: true,
        balance: fixNumber(user.balance),
      }

      await trx.commit()
      res.status(200).json(response).end()
      console.log(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Rollback(ok)#####', req.path, JSON.stringify(req.body), JSON.stringify(response))
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

  res.status(500).json({message: 'Internal server error'}).end()
}
