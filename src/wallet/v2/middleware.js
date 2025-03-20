import crypto from 'node:crypto'
import mysql2 from 'mysql2/promise'
import {getRedisClient} from '../../utils/redis.js'
import {getCurrentDatetime} from '../../utils/get-current-datetime.js'

/**
 * @type {mysql2.Pool}
 */
const pool = mysql2.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 2,
  decimalNumbers: true,
})

export async function middleware(req, res, next) {
  try {
    const token = req.query.token
    const authorization = req.headers['authorization']

    const client = await getRedisClient()

    const data = await client.get(`aspect-initial-token:${token}`).then(JSON.parse)

    if (!data) {
      const response = {
        error: 'Invalid Token',
        errorCode: 1002,
      }

      res.status(200).json(response).end()
      console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Middleware1#####', req.path, JSON.stringify(req.body), JSON.stringify(response))
      return
    }

    await client.setEx(`aspect-initial-token:${token}`, 30 * 60 * 60, JSON.stringify(data))

    const prefix = data.prefix

    const [[project]] = await pool.query(`
        select s.id                                               as id
             , s.prefix                                           as prefix
             , s.db_name                                          as db
             , json_extract(s.configs, '$.currency')              as currency
             , json_extract(s.configs, '$.database')              as config
             , json_extract(ac.configs, '$.secretKey')            as secretKey
             , json_extract(ac.configs, '$.operatorId')           as operatorId
             , json_value(bl.value, '$' returning decimal(20, 4)) as balanceLimit
             , json_value(wl.value, '$' returning decimal(20, 4)) as winLimit
        from casino.aspect_configs ac
                 inner join global.settings s on s.prefix = ac.prefix
                 left join global.configurations bl on bl.code = 'balance_limit' and bl.prefix = ac.prefix
                 left join global.configurations wl on wl.code = 'win_limit' and wl.prefix = ac.prefix
        where ac.prefix = ?
    `, [prefix])

    const secretKey = project.secretKey
    const operatorId = project.operatorId

    const secret = `${secretKey}` + `${req.originalUrl.substring(4)}`

    const secretToken = crypto.createHash('md5').update(secret).digest('hex')

    if (Number(operatorId) !== Number(req.query.operatorId)) {
      res.status(500).end()
      console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Middleware2#####', req.path, JSON.stringify(req.body))
      return
    }

    const [[convertSettings]] = await pool.query(`
        select currency as currency
        from global.casino_convert_settings
        where prefix = ?
          and provider = 'aspect'
    `, [prefix])

    if (`AUTH ${secretToken.toUpperCase()}` === authorization) {
      req.prefix = data.prefix
      req.userInfo = data.user
      req.wageringBalanceId = data.wageringBalanceId
      req.project = project
      req.convertCurrency = convertSettings?.currency || null

      next()
      return
    }

    const response = {
      error: 'Invalid Token',
      errorCode: 1002,
    }

    res.status(200).json(response).end()
    console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Middleware3#####', req.path, JSON.stringify(req.body), JSON.stringify(response))
    return
  } catch (e) {
    console.error(getCurrentDatetime(), e)
  }

  res.status(500).json({message: 'Internal server error'}).end()
}
