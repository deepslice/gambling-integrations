import {getCurrentDatetime} from '../../utils/get-current-datetime.js'
import {pool} from '../pool.js'
import {getRedisClient} from '../../utils/redis.js'
import mysql2 from 'mysql2/promise'
import {fixNumber} from './constats.js'

export async function getBalanceHandler(req, res, next) {
  const token = req.query.token
  const uuid = req.query.gameId
  const client = await getRedisClient()

  const data = await client.get(`aspect-initial-token:${token}`).then(JSON.parse)

  if (!data) {
    res.status(200).json({
      error: 'Invalid Token',
      errorCode: 1002,
    }).end()
    console.error('data')
    return
  }

  if (['twin'].includes(data.prefix)) {
    next()
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
      decimalNumbers: true
    })

    try {
      const [[user]] = await trx.query(`
          select id                                  as id,
                 balance                             as balance,
                 greatest(0, (balance - plus_bonus)) as realBalance,
                 currency                            as currency
          from users
          where id = ?
      `, [data.user.id])

      if (!user) {
        res.status(200).json({
          error: 'Invalid Player',
          errorCode: 1001,
        }).end()
        console.error('user not found')
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

      let rate = 1

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

      const response = {
        success: true,
        balance: fixNumber(user.balance),
      }


      res.status(200).json(response).end()
      return
    } catch (e) {
      console.error(getCurrentDatetime(), e)
    } finally {
      await trx.end()
    }
  } catch (e) {
    console.error(getCurrentDatetime(), e)
  }
  res.status(500).json({message: 'internal server error'}).end()
}
