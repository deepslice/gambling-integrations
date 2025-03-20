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
      console.error('token--')
      return
    }

    if (['twin'].includes(data.prefix)) {
      next()
      return
    }

    const prefix = data.prefix

    const [[project]] = await pool.query(`
        select json_extract(configs, '$.secretKey')  as secretKey
             , json_extract(configs, '$.operatorId') as operatorId
        from casino.aspect_configs
        where prefix = ?
    `, [prefix])

    const secretKey = project.secretKey
    const operatorId = project.operatorId

    const secret = `${secretKey}` + `${req.originalUrl.substring(4)}`

    const secretToken = crypto.createHash('md5').update(secret).digest('hex')

    if (Number(operatorId) !== Number(req.query.operatorId)) {
      res.status(500).end()
      console.error('middleware operatorId')
      return
    }

    if (`AUTH ${secretToken.toUpperCase()}` === authorization) {
      next()
      return
    }

    const response = {
      error: 'Invalid Token',
      errorCode: 1002,
    }

    res.status(200).json(response).end()
    console.error('AUTH')
    return
  } catch (e) {
    console.error(getCurrentDatetime(), e)
  }
  res.status(500).json({message: 'internal server error'}).end()

}
