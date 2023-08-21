import {getCurrentDatetime} from '../../utils/get-current-datetime.js'
import {pool} from '../pool.js'
import {getRedisClient} from '../../utils/redis.js'
import mysql2 from 'mysql2/promise'
import {fixNumber} from './constats.js'

export async function debitHandler(req, res) {
  const token = req.query.token
  const uuid = req.query.gameId
  const amount = Number(req.query.amount)
  const transactionId = req.query.transactionKey

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
          select id                                      as id,
                 balance                                 as balance,
                 greatest(0, (balance - plus_bonus))     as realBalance,
                 least(balance, plus_bonus)              as plusBonus,
                 currency                                as currency,
                 json_extract(options, '$.transactions') as status
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
          errorCode: 1,
        }
        res.status(200).json(response).end()
        console.error('user not found')
        await trx.rollback()
        return
      }

      if (user.status) {
        const status = user.status
        if (status.transactions || status.casino) {
          const response = {
            error: 'Insufficient Funds',
            errorCode: 1003,
          }
          res.status(200).json(response).end()
          console.error('status')
          await trx.rollback()
          return
        }
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
            and ifnull(cg.active, g.active) = 1
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

      if (amount < 0) {
        res.status(500).end()
        console.error('amount')
        await trx.rollback()
        return
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

      if (user.balance < amount) {
        const response = {
          error: 'Insufficient Funds',
          errorCode: 1003,
        }
        res.status(200).json(response).end()
        console.error('insufficient founds')
        await trx.rollback()
        return
      }

      const [[transaction]] = await trx.query(`
          select *
          from casino_transactions
          where transaction_id = concat(?, ?)
      `, [transactionId, ':BET'])

      if (transaction) {
        res.status(500).end()
        console.error('already passed this transaction key')
        await trx.rollback()
        return
      }

      const [[limit]] = await trx.query(`
          select (bet_limit - ?) as betLimit
          from casino.limits
          where project_id = ?
      `, [amount, project.id])

      if (!limit || limit.betLimit < 0) {
        const response = {
          error: 'Insufficient Funds',
          errorCode: 1003,
        }
        res.status(200).json(response).end()
        console.error('low limit')
        await trx.rollback()
        return
      }

      const currencyRate = await client.get(`currency`).then(JSON.parse)

      const [[restrictions]] = await trx.query(`
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
        res.status(200).json(response).end()
        console.error('low ggr')
        await trx.rollback()
        return
      }

      const [{insertId}] = await trx.query(`
          insert into casino_transactions (amount, transaction_id, player_id, action, aggregator, provider, game_id,
                                           currency, session_id, section, round_id)
          values (?, concat(?, ?), ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [amount, transactionId, ':BET', user.id, 'BET', 'aspect',
        game.provider, game.uuid, user.currency, token, game.section, transactionId])

      await trx.query(`
          update casino.limits
          set bet_limit = bet_limit - (?)
          where project_id = ?
      `, [amount, project.id])

      await trx.query(`
          update casino.restrictions
          set ggr = ggr - (? / ?)
          where code = ?
      `, [amount, currencyRate[user.currency] || 1, game.providerUid])

      await trx.query(`
          update users
          set balance = balance - (? * ?)
          where id = ?
      `, [amount, rate, user.id])

      const [[updatedBalance]] = await trx.query(`
          select cast((balance / ${rate}) as float)                             as balance,
                 cast((greatest(0, (balance - plus_bonus)) / ${rate}) as float) as realBalance,
                 greatest(0, (balance - plus_bonus))                            as historyBalance,
                 least(balance, plus_bonus)                                     as plusBonus
          from users
          where id = ?
      `, [user.id])

      console.error(JSON.stringify(updatedBalance))

      if (bonus && !bonus.value[game.section]) {
        updatedBalance.balance = updatedBalance.realBalance
      }

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
        transactionId: insertId,
        action: 'BET',
      }

      await trx.query(`
          insert into balance_history (user_id, type, amount, balance, info)
          values (?, 10, ? * ?, ?, ?)
      `, [user.id, -amount, rate, JSON.stringify(balanceHistory), JSON.stringify(historyInfo)])

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
