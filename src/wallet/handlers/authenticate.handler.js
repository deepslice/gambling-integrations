import {getRedisClient} from '../../utils/redis.js'
import {getPool, pool} from '../pool.js'
import {getCurrentDatetime} from '../../utils/get-current-datetime.js'
import {fixNumber} from './constats.js'
import mysql2 from 'mysql2/promise'

export async function authenticateHandler(req, res) {
  try {
    const token = req.query.token
    const uuid = req.query.gameId
    const operatorId = Number(req.query.operatorId)

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

    const wPool = getPool(project.prefix, project.config)

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
          and ifnull(cg.active, g.active) = 1
          and aggregator = 'aspect'
    `, [uuid])

    if (!game) {
      res.status(200).json({
        error: 'Invalid Game ID',
        errorCode: 1008,
      }).end()
      console.error('game not found')
      return
    }

    const [[config]] = await pool.query(`
        select cast(configs as json) as configs
        from casino.aspect_configs
        where prefix = ?
    `, [data.prefix])

    if (operatorId !== config.configs.operatorId) {
      res.status(500).end()
      console.error('authenticate operatorId')
      return
    }

    const [[bonus]] = await pool.query(`
        select cast(value as json) as value
        from global.configurations
        where code = 'plus_bonus'
          and prefix = ?
    `, [data.prefix])

    /** @type {mysql2.Connection} */
    const trx = await mysql2.createConnection(project.config)

    try {
      const [[user]] = await trx.query(`
          select id                                  as id,
                 username                            as userName,
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
        authenticated: true,
        username: user.userName,
        currency: user.currency,
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