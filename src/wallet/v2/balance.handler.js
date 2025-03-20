import {getRedisClient} from '../../utils/redis.js'
import {getCurrentDatetime} from '../../utils/get-current-datetime.js'
import {getPool} from '../pool.js'
import {fixNumber} from '../handlers/constats.js'
import {convertCurrencyForUserV2} from '../../utils/convert-currency-for-user-v2.js'
import {handleWageringBalanceV2} from '../../utils/handle-wagering-balance-v2.js'

export async function getBalanceHandler(req, res) {
  try {
    const client = await getRedisClient()

    const token = req.query.token
    const uuid = req.query.gameId

    const {prefix, userInfo, wageringBalanceId, convertCurrency, project} = req

    const wPool = getPool(project.prefix, project.config)

    const [[game]] = await wPool.query(`
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
      console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Balance2#####', req.path, JSON.stringify(req.body), JSON.stringify(response))
      return
    }

    const [[user]] = await wPool.query(`
        select id           as id
             , balance      as balance
             , real_balance as realBalance
             , currency     as currency
        from users
        where id = ?
    `, [userInfo.id])

    if (!user) {
      const response = {
        error: 'Invalid Player',
        errorCode: 1001,
      }

      res.status(200).json(response).end()
      console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Balance1#####', req.path, JSON.stringify(req.body), JSON.stringify(response))
      return
    }

    const conversion = await convertCurrencyForUserV2(convertCurrency, wPool, prefix, client, user, 1)

    if (!conversion.rate) {
      const response = {
        error: 'Global error.',
        errorCode: 1008,
      }

      res.status(200).json(response).end()
      console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Balance3#####', req.path, JSON.stringify(req.body), JSON.stringify(response))
      return
    }

    const isWageringBalanceValid = await handleWageringBalanceV2(wPool, wageringBalanceId, user, conversion.rate)

    if (!isWageringBalanceValid) {
      const response = {
        error: 'Global error.',
        errorCode: 1008,
      }

      res.status(200).json(response).end()
      console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Balance4#####', req.path, JSON.stringify(req.body), JSON.stringify(response))
      return
    }

    const response = {
      success: true,
      balance: fixNumber(user.balance),
    }

    res.status(200).json(response).end()
    console.log(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Balance(ok)#####', req.path, JSON.stringify(req.body), JSON.stringify(response))
    return
  } catch (e) {
    console.error(getCurrentDatetime(), e)
  }

  res.status(500).json({message: 'Internal server error'}).end()
}
