import {getCurrentDatetime} from '../../utils/get-current-datetime.js'
import {pool} from '../pool.js'
import {getRedisClient} from '../../utils/redis.js'
import mysql2 from 'mysql2/promise'
import {fixNumber} from './constats.js'
import {prSendData} from '../../utils/pr-amqp.js'

export async function creditHandler(req, res) {
  const token = req.query.token
  const amount = Number(req.query.amount)
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
            and deleted = 0 for
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
          select g.uuid                      as uuid,
                 g.provider                  as provider,
                 g.aggregator                as aggregator,
                 g.site_section              as section,
                 g.name                      as name,
                 g.provider_uid              as providerUid,
                 ifnull(cg.active, g.active) as active
          from casino.games g
                   left join casino_games cg on g.uuid = cg.uuid
          where g.uuid = concat('as:', ?)
            and g.deleted = 0
            and aggregator = 'aspect'
      `, [uuid])

      if (!game || !game.active) {
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

      const [[transaction]] = await trx.query(`
          select *
          from casino_transactions
          where transaction_id = concat(?, ?)
      `, [transactionId, ':WIN'])

      if (transaction) {
        res.status(500).end()
        console.error('already passed this transaction key')
        await trx.rollback()
        return
      }

      const [[checkBet]] = await trx.query(`
          select *
          from casino_transactions
          where transaction_id = concat(?, ?)
      `, [transactionId, ':BET'])

      if (!checkBet) {
        const response = {
          error: 'Could Not Credit After Debit',
          errorCode: 1024,
        }
        res.status(200).json(response).end()
        console.error('Could Not Credit After Debit')
        await trx.rollback()
        return
      }

      const [{insertId}] = await trx.query(`
          insert into casino_transactions (amount, transaction_id, player_id, action, aggregator, provider, game_id,
                                           currency, session_id, section, bet_transaction_id, round_id)
          values (?, concat(?, ?), ?, ?, ?, ?, ?, ?, ?, ?, concat(?, ?), ?)
      `, [amount, transactionId, ':WIN', user.id, 'WIN', 'aspect',
        game.provider, game.uuid, user.currency, token, game.section, transactionId, ':BET', transactionId])

      const currencyRate = await client.get(`currency`).then(JSON.parse)

      await pool.query(`
          update casino.restrictions
          set ggr = ggr + (? / ?)
          where code = ?
      `, [amount, currencyRate[user.currency] || 1, game.providerUid])

      const [[balanceLimit]] = await trx.query(`
          select value
          from global.configurations
          where code = 'balance_limit'
            and prefix = ?
      `, [data.prefix])

      let drop = 0

      if (balanceLimit) {
        const [[limitDrop]] = await trx.query(`
            select greatest(0, ((balance - plus_bonus + ? * ?) - ?)) as amount
            from users
            where id = ?
        `, [amount, rate, Number(balanceLimit.value), user.id])

        drop = limitDrop.amount

        await trx.query(`
            update users
            set balance = balance + least(greatest(0, (? + plus_bonus - balance)), (? * ?))
            where id = ?
        `, [Number(balanceLimit.value), amount, rate, user.id])
      } else {
        await trx.query(`
            update users
            set balance = balance + (? * ?)
            where id = ?
        `, [amount, rate, user.id])
      }

      const [[updatedBalance]] = await trx.query(`
          select cast((balance / ${rate}) as float)                             as balance,
                 cast((greatest(0, (balance - plus_bonus)) / ${rate}) as float) as realBalance,
                 greatest(0, (balance - plus_bonus))                            as historyBalanceAfterDrop,
                 greatest(0, (balance - plus_bonus)) + ?                        as historyBalanceBeforeDrop,
                 least(balance, plus_bonus)                                     as plusBonus
          from users
          where id = ?
      `, [drop, user.id])

      console.error(JSON.stringify(updatedBalance))

      if (amount > 0) {
        const balanceHistory = {
          balanceBefore: user.realBalance,
          balanceAfter: updatedBalance.historyBalanceBeforeDrop,
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
          action: 'WIN',
        }

        await trx.query(`
            insert into balance_history (user_id, type, amount, balance, info)
            values (?, 10, ? * ?, ?, ?)
        `, [user.id, amount, rate, JSON.stringify(balanceHistory), JSON.stringify(historyInfo)])

        if (drop) {
          const balanceHistory = {
            balanceBefore: updatedBalance.historyBalanceBeforeDrop,
            balanceAfter: updatedBalance.historyBalanceAfterDrop,
            bonusBefore: updatedBalance.plusBonus,
            bonusAfter: updatedBalance.plusBonus,
          }

          historyInfo.action = 'DROP'

          await trx.query(`
              insert into balance_history (user_id, type, amount, balance, info)
              values (?, 11, ?, ?, ?)
          `, [user.id, -drop, JSON.stringify(balanceHistory), JSON.stringify(historyInfo)])
        }

        const [[ct]] = await trx.query(`
            select unix_timestamp(inserted_at)                                                    as updatedAt
                 , unix_timestamp(date(inserted_at) - interval (dayofmonth(inserted_at) - 1) day) as month
                 , amount                                                                         as amount
            from casino_transactions
            where id = ?
        `, [insertId])

        await prSendData(ct.month, {
          id: user.id,
          username: user.username,
          currency: user.currency,
          prefix: project.prefix,
          month: ct.month,
          createdAt: user.createdAt,
          active: user.active,
          deleted: user.deleted,
        }, {
          report: {
            update: {
              updatedAt: ct.updatedAt,
              finalBalance: updatedBalance.historyBalanceAfterDrop,
              finalBonus: updatedBalance.plusBonus,
              ggrCasino: -ct.amount,
              ggrTotal: -ct.amount,
              dropAmount: drop ? drop : 0,
              dropCount: drop ? 1 : 0,
            },
          },
        })

      }

      if (bonus && !bonus.value[game.section]) {
        updatedBalance.balance = updatedBalance.realBalance
      }

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
