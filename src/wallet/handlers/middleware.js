import crypto from 'node:crypto'
import mysql2 from 'mysql2/promise'

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

  const prefix = data.prefix

  const [[project]] = await pool.query(`
      select cast(configs as json) as configs
      from casino.aspect_configs
      where prefix = ?
  `, [prefix])

  const secretKey = project.configs.secretKey
  const operatorId = project.configs.operatorId

  const secretToken = crypto.createHash('md5').update(`${secretKey}` + `${req.originalUrl}`).digest('hex')

  if (operatorId !== req.query.operatorId) {
    res.status(500).end()
    console.error('middleware operatorId')
    return
  }

  if (`AUTH ${secretToken}` === authorization) {
    next()
    return
  }

  const response = {
    error: 'Invalid Token',
    errorCode: 1002,
  }

  res.status(200).json(response).end()
  console.error('AUTH')
}