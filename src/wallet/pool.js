import mysql2 from 'mysql2/promise'
import {getCurrentDatetime} from '../utils/get-current-datetime.js'

const connectionLimits = {
  'fg': 5,
  'b216': 5,
  'm7': 5,
}

/** @type {{[key: string]: mysql2.Pool}} */
const pools = {}

/** @type {mysql2.Pool} */
export const pool = mysql2.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 5,
  decimalNumbers: true,
})


/**
 * @param prefix {string}
 * @param config {object}
 * @returns {mysql2.Pool}
 */
export function getPool(prefix, config) {
  if (pools[prefix]) {
    return pools[prefix]
  }

  pools[prefix] = mysql2.createPool({
    ...config,
    decimalNumbers: true,
    waitForConnections: true,
    connectionLimit: connectionLimits[prefix] || 2,
  })

  return pools[prefix]
}

setInterval(() => {
  try {
    console.error('#', getCurrentDatetime(), 'ASPECT MICROSERVICE POOL INFO', JSON.stringify([
      pool.pool?._allConnections?.length,
      pool.pool?._freeConnections?.length,
      pool.pool?._connectionQueue?.length,
    ]))
  } catch (e) {
    console.error(e)
  }
}, 10000)
