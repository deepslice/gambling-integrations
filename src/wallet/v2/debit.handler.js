import {getCurrentDatetime} from '../../utils/get-current-datetime.js'
import {getPool, pool} from '../pool.js'
import {getRedisClient} from '../../utils/redis.js'
import mysql2 from 'mysql2/promise'
import {fixNumber} from '../handlers/constats.js'
import {checkParentRecursive} from '../../utils/check-parent-recursive.js'
import {getBetLimit} from '../../utils/get-bet-limit.js'
import {convertCurrencyForUserV2} from '../../utils/convert-currency-for-user-v2.js'
import {handleWageringBalanceV2} from '../../utils/handle-wagering-balance-v2.js'
import {updateUserBalanceV2} from '../../utils/update-user-balance-v2.js'

export async function debitHandler(req, res) {
  try {
    const client = await getRedisClient()

    const token = req.query.token
    const uuid = req.query.gameId
    const amount = Number(req.query.amount)
    const transactionId = req.query.transactionKey

    const {prefix, userInfo, wageringBalanceId, convertCurrency, project} = req

    const wPool = getPool(prefix, project.config)

    const [[game]] = await wPool.query(`
        select g.uuid                      as uuid
             , g.provider                  as provider
             , g.aggregator                as aggregator
             , g.site_section              as section
             , g.name                      as name
             , g.provider_uid              as providerUid
             , final_game_id               as finalGameId
             , ifnull(cg.active, g.active) as active
             , deleted                     as deleted
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
          select id                                      as id
               , balance                                 as balance
               , balance                                 as nativeBalance
               , real_balance                            as realBalance
               , json_extract(options, '$.transactions') as status
               , username                                as username
               , agent_id                                as parentId
               , currency                                as currency
               , currency                                as nativeCurrency
               , active                                  as active
               , deleted                                 as deleted
               , unix_timestamp(created_at)              as createdAt
          from users
          where id = ? for
          update
      `, [userInfo.id])

      const [[transaction]] = await trx.query(`
          select id as id
          from casino_transactions
          where transaction_id = concat(?, ?)
      `, [transactionId, ':BET'])

      if (transaction) {
        await trx.rollback()
        res.status(500).end()
        console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Debit1#####', req.path, JSON.stringify(req.body))
        return
      }

      if (amount < 0) {
        await trx.rollback()
        res.status(500).end()
        console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Debit2#####', req.path, JSON.stringify(req.body))
        return
      }

      if (!game || !game.active || game.deleted) {
        const response = {
          error: 'Invalid Game ID',
          errorCode: 1008,
        }

        await trx.rollback()
        res.status(200).json(response).end()
        console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Debit3#####', req.path, JSON.stringify(req.body), JSON.stringify(response))
        return
      }

      const parentActive = user && user.active && !user.deleted && await checkParentRecursive(user.parentId, trx)

      if (!user || !parentActive) {
        const response = {
          error: 'Invalid Player',
          errorCode: 1,
        }

        await trx.rollback()
        res.status(200).json(response).end()
        console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Debit4#####', req.path, JSON.stringify(req.body), JSON.stringify(response))
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
          console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Debit5#####', req.path, JSON.stringify(req.body), JSON.stringify(response))
          return
        }
      }

      user.convertedAmount = amount

      const conversion = await convertCurrencyForUserV2(convertCurrency, wPool, prefix, client, user, 1)

      if (!conversion.rate) {
        const response = {
          error: 'Global error.',
          errorCode: 1008,
        }

        await trx.rollback()
        res.status(200).json(response).end()
        console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Debit6#####', req.path, JSON.stringify(req.body), JSON.stringify(response))
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
        console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Debit7#####', req.path, JSON.stringify(req.body), JSON.stringify(response))
        return
      }

      if (user.balance < amount) {
        const response = {
          error: 'Insufficient Funds',
          errorCode: 1003,
        }

        await trx.rollback()
        res.status(200).json(response).end()
        console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Debit8#####', req.path, JSON.stringify(req.body), JSON.stringify(response))
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
        console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Debit9#####', req.path, JSON.stringify(req.body), JSON.stringify(response))
        return
      }

      const [[limit]] = await pool.query(`
          select bet_limit as betLimit
          from casino.limits
          where project_id = ?
      `, [project.id])

      if (!limit || limit.betLimit < 0) {
        const response = {
          error: 'Insufficient Funds',
          errorCode: 1003,
        }

        await trx.rollback()
        res.status(200).json(response).end()
        console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Debit10#####', req.path, JSON.stringify(req.body), JSON.stringify(response))
        return
      }

      const betLimit = await getBetLimit(pool, prefix, game)

      if (betLimit && betLimit < user.convertedAmount) {
        const response = {
          error: 'Insufficient Funds',
          errorCode: 1003,
        }

        await trx.rollback()
        res.status(200).json(response).end()
        console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Debit11#####', req.path, JSON.stringify(req.body), JSON.stringify(response))
        return
      }

      const [{insertId: txId}] = await trx.query(`
          insert into casino_transactions (amount, transaction_id, player_id, action, aggregator, provider, game_id,
                                           currency, session_id, section, round_id, freespin_id)
          values (?, concat(?, ?), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [user.convertedAmount, transactionId, ':BET', user.id, 'BET', 'aspect',
        game.provider, game.uuid, user.nativeCurrency, token, game.section, transactionId, wageringBalanceId ? wageringBalanceId : null])

      if (convertCurrency) {
        await trx.query(`
            insert into casino_converted_transactions (id, amount, converted_amount, user_id, action, aggregator,
                                                       provider, uuid, currency, currency_to, rate)
            values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [txId, -amount, -user.convertedAmount, user.id, 1, 'aspect', game.provider, game.uuid, convertCurrency, user.nativeCurrency, conversion.rate])
      }

      await trx.query(`
          insert into casino_rounds(bet_amount, win_amount, round_id, user_id, aggregator, provider, uuid,
                                    currency, additional_info)
          values (?, 0, concat('ca:', ?), ?, ?, ?, ?, ?, ?)
          on duplicate key update bet_amount = bet_amount + ?
      `, [user.convertedAmount, transactionId, user.id, 'caleta', game.provider, game.uuid, user.nativeCurrency, wageringBalanceId ? JSON.stringify({wageringBalanceId}) : null, user.convertedAmount])

      await trx.query(`
          update casino.limits
          set bet_limit = bet_limit - ?
          where project_id = ?
      `, [user.convertedAmount, project.id])

      await pool.query(`
          update casino.restrictions
          set ggr = ggr - ? / ?
          where code = ?
      `, [amount, currencyRate[user.currency] || 1, game.providerUid])

      await updateUserBalanceV2(trx, txId, prefix, transactionId, 'BET', user, -user.convertedAmount, game, conversion.rate, wageringBalanceId, 1)

      const response = {
        success: true,
        balance: fixNumber(user.balance),
      }

      await trx.commit()
      res.status(200).json(response).end()
      console.log(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Debit(ok)#####', req.path, JSON.stringify(req.body), JSON.stringify(response))
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
