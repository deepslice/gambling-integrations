import axios from 'axios'
import mysql2 from 'mysql2/promise'
import {getRedisClient} from '../utils/redis.js'
import {getCurrentDatetime} from '../utils/get-current-datetime.js'
import {randomBytes} from 'node:crypto'

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

export async function gameInitHandler(req, res) {
  try {
    const {game, user, prefix, wageringId} = req.body
    const gameId = game.split(':')[1]

    const [[project]] = await pool.query(`
        select cast(configs as json) as configs
        from casino.aspect_configs
        where prefix = ?
    `, [prefix])

    if (!project) {
      res.status(200).json({url: null}).end()
      return
    }

    const operatorId = project.configs.operatorId

    const client = await getRedisClient()

    const token = randomBytes(36).toString('hex')

    await client.setEx(`aspect-initial-token:${token}`, 5 * 60, JSON.stringify({user, prefix, wageringId}))

    const url = await axios.get(`https://eu.agp.xyz/agp-launcher/${gameId}/?token=${token}&operatorId=${operatorId}&language=en-US`).then(resp => {
      return resp.config.url || null
    }).catch((error) => {
      console.error('error ', error)
      return null
    })

    const response = {url}
    console.log(getCurrentDatetime(), 'game-init', req.url, JSON.stringify(req.body), JSON.stringify(response))
    res.status(200).json(response).end()
    return
  } catch (e) {

    console.error(getCurrentDatetime(), e)
  }

  const response = {url: null}
  console.error(getCurrentDatetime(), 'game-init', JSON.stringify(req.body), JSON.stringify(response))
  res.status(200).json(response).end()
}
