import axios from 'axios'
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

export async function getGames() {
  const [[project]] = await pool.query(`
      select cast(configs as json) as configs
      from casino.aspect_configs
      where prefix = ?
  `, ['twin'])

  const operatorId = project.configs.operatorId
  
  const data = await axios.get(`https://uat.aspectgaming.com/agp-api/settings/games?operatorId=${operatorId}&language=en-US`, {
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
  }).then(({data}) => {
    return data
  })
  return data
}
