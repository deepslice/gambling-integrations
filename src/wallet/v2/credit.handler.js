import {getCurrentDatetime} from '../../utils/get-current-datetime.js'
import {getPool, pool} from '../pool.js'
import {getRedisClient} from '../../utils/redis.js'
import mysql2 from 'mysql2/promise'
import {fixNumber} from '../handlers/constats.js'
import {convertCurrencyForUserV2} from '../../utils/convert-currency-for-user-v2.js'
import {handleWageringBalanceV2} from '../../utils/handle-wagering-balance-v2.js'
import {winLimitV2} from '../../utils/win-limits-v2.js'
import {balanceLimitV2} from '../../utils/balance-limit-v2.js'
import {updateUserBalanceV2} from '../../utils/update-user-balance-v2.js'

export async function creditHandler(req, res) {
  try {
    const client = await getRedisClient()
    const token = req.query.token
    const amount = Number(req.query.amount)
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
    const trx = await mysql2.createConnection({
      ...project.config,
      decimalNumbers: true,
    })

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
        console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Credit1#####', req.path, JSON.stringify(req.body), JSON.stringify(response))
        return
      }

      const [[transaction]] = await trx.query(`
          select id as id
          from casino_transactions
          where transaction_id = concat(?, ?)
      `, [transactionId, ':WIN'])

      if (transaction) {
        await trx.rollback()
        res.status(500).end()
        console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Credit2#####', req.path, JSON.stringify(req.body))
        return
      }

      if (!game) {
        const response = {
          error: 'Invalid Game ID',
          errorCode: 1008,
        }

        await trx.rollback()
        res.status(200).json(response).end()
        console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Credit3#####', req.path, JSON.stringify(req.body), JSON.stringify(response))
        return
      }

      if (amount < 0) {
        await trx.rollback()
        res.status(500).end()
        console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Credit4#####', req.path, JSON.stringify(req.body))
        return
      }

      const [[checkBet]] = await trx.query(`
          select id as id
          from casino_transactions
          where transaction_id = concat(?, ?)
      `, [transactionId, ':BET'])

      if (!checkBet) {
        const response = {
          error: 'Could Not Credit After Debit',
          errorCode: 1024,
        }

        await trx.rollback()
        res.status(200).json(response).end()
        console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Credit5#####', req.path, JSON.stringify(req.body), JSON.stringify(response))
        return
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
        console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Credit6#####', req.path, JSON.stringify(req.body), JSON.stringify(response))
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
        console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Credit7#####', req.path, JSON.stringify(req.body), JSON.stringify(response))
        return
      }

      const [{insertId: txId}] = await trx.query(`
          insert into casino_transactions (amount, transaction_id, player_id, action, aggregator, provider, game_id,
                                           currency, session_id, section, bet_transaction_id, round_id, freespin_id)
          values (?, concat(?, ?), ?, ?, ?, ?, ?, ?, ?, ?, concat(?, ?), ?, ?)
      `, [user.convertedAmount, transactionId, ':WIN', user.id, 'WIN', 'aspect',
        game.provider, game.uuid, user.nativeCurrency, token, game.section, transactionId, ':BET', transactionId, wageringBalanceId ? wageringBalanceId : null])

      if (convertCurrency) {
        await trx.query(`
            insert into casino_converted_transactions (id, amount, converted_amount, user_id, action, aggregator,
                                                       provider, uuid, currency, currency_to, rate)
            values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [txId, amount, user.convertedAmount, user.id, 'WIN', 'aspect', game.provider, game.uuid, convertCurrency, user.nativeCurrency, conversion.rate])

      }

      await trx.query(`
          update casino_rounds
          set status     = 1
            , win_amount = ifnull(win_amount, 0) + ?
          where round_id = ?
      `, [user.convertedAmount, transactionId])

      const currencyRate = await client.get(`currency`).then(JSON.parse)

      // await pool.query(`
      //     update casino.restrictions
      //     set ggr = ggr + ? / ?
      //     where code = ?
      // `, [amount, currencyRate[user.currency] || 1, game.providerUid])

      if (amount > 0) {
        await updateUserBalanceV2(trx, txId, prefix, transactionId, 'WIN', user, user.convertedAmount, game, conversion.rate, wageringBalanceId, 0)

        if (!wageringBalanceId) {
          const historyInfo = {
            provider: game.provider,
            aggregator: game.aggregator,
            section: game.section,
            uuid: game.uuid,
            gameName: game.name,
            transactionId: txId,
            action: 'WIN',
          }

          await winLimitV2(trx, user, user.convertedAmount, project, historyInfo, conversion.rate)
          await balanceLimitV2(trx, user, project, historyInfo, conversion.rate)
        }
      }

      const response = {
        success: true,
        balance: fixNumber(user.balance),
      }

      await trx.commit()
      res.status(200).json(response).end()
      console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Credit(ok)#####', req.path, JSON.stringify(req.body), JSON.stringify(response))
      return
    } catch (e) {
      console.error(getCurrentDatetime(), e)
      await trx.rollback()
    } finally {
      await trx.end()
    }
  } catch
    (e) {
    console.error(getCurrentDatetime(), e)
  }

  res.status(500).json({message: 'Internal server error'}).end()
}
