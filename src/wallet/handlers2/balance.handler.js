import {getRedisClient} from '../../utils/redis.js'
import {getCurrentDatetime} from '../../utils/get-current-datetime.js'
import {getPool, pool} from '../pool.js'
import {fixNumber} from '../handlers/constats.js'

export async function getBalanceHandler(req, res) {
  try {
    const token = req.query.token
    const uuid = req.query.gameId
    const client = await getRedisClient()

    const data = await client.get(`aspect-initial-token:${token}`).then(JSON.parse)

    if (!data) {
      const response = {
        error: 'Invalid Token',
        errorCode: 1002,
      }

      res.status(200).json(response).end()
      console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, 'B1', req.path, JSON.stringify(req.body), JSON.stringify(response))
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
      console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, 'B2', req.path, JSON.stringify(req.body))
      return
    }

    const wPool = getPool(project.prefix, project.config)

    const [[user]] = await wPool.query(`
        select id           as id
             , balance      as balance
             , real_balance as realBalance
             , currency     as currency
        from users
        where id = ?
    `, [data.user.id])

    if (!user) {
      const response = {
        error: 'Invalid Player',
        errorCode: 1001,
      }

      res.status(200).json(response).end()
      console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, 'B3', req.path, JSON.stringify(req.body), JSON.stringify(response))
      return
    }

    const [[game]] = await pool.query(`
        select g.uuid                      as uuid
             , g.provider                  as provider
             , g.aggregator                as aggregator
             , g.site_section              as section
             , g.name                      as name
             , g.provider_uid              as providerUid
             , ifnull(cg.active, g.active) as active
        from casino.games g
                 left join casino_games cg on g.uuid = cg.uuid
        where g.uuid = concat('as:', ?)
          and g.deleted = 0
          and aggregator = 'aspect'
    `, [uuid])

    if (!game || !game.active) {
      const response = {
        error: 'Invalid Game ID',
        errorCode: 1008,
      }

      res.status(200).json(response).end()
      console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, 'B4', req.path, JSON.stringify(req.body), JSON.stringify(response))
      return
    }

    let rate = 1

    if (user.currency === 'TOM') {
      rate = await client.get(`exchange-rate:tom:to:usd:${project.prefix}`).then(Number)

      const [[userBalance]] = await wPool.query(`
          select id          as id
               , balance / ? as balance
          from users
          where id = ?
      `, [rate, user.id])

      user.balance = userBalance.balance
      user.currency = 'USD'
    }

    if (data.wageringId) {
      const [[wBalance]] = await wPool.query(`
          select id          as id
               , balance / ? as balance
          from wagering_balance
          where id = ?
            and user_id = ?
            and status = 1
            and free_spin = 0
            and (expires_at > now() or expires_at is null)
      `, [rate, data.wageringId, data.user.id])

      if (!wBalance) {
        const response = {
          error: 'Invalid Player',
          errorCode: 1001,
        }

        res.status(200).json(response).end()
        console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, 'B5', req.path, JSON.stringify(req.body), JSON.stringify(response))
        return
      }

      user.balance = wBalance.balance
    }

    const response = {
      success: true,
      balance: fixNumber(user.balance),
    }

    res.status(200).json(response).end()
    console.log(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, 'B6', req.path, JSON.stringify(req.body), JSON.stringify(response))
    return
  } catch (e) {
    console.error(getCurrentDatetime(), e)
  }

  res.status(500).json({message: 'Internal server error'}).end()
}
