// @ts-check

import crypto from 'node:crypto'
import {getRedisClient} from '@/infrastructure/redis.connection.js'
import {assertField} from '@/utils/assert.util.js'
import {ConfigStore} from '@/modules/config/configModel'

const getLimits = `
    SELECT bet_limit AS betLimit
    FROM casino.limits
    WHERE project_id = ?`

const getBetLimits = `
    SELECT bet_limit AS amount
    FROM casino.final_game_limits
    WHERE prefix = ?
      AND final_game_id = ?

    UNION ALL

    SELECT bet_limit AS amount
    FROM casino.provider_limits
    WHERE prefix = ?
      AND provider = ?

    UNION ALL

    SELECT bet_limit AS amount
    FROM casino.section_limits
    WHERE prefix = ?
      AND site_section = ?`

const getRestrictions = `
    SELECT ggr * ?                                   AS ggr,
           if(max_ggr IS NOT NULL, max_ggr - ggr, 1) AS difference
    FROM casino.restrictions
    WHERE code = ?`

export class AuthStore {

  /**
   * @param   {string} key
   * @returns {Promise<object>}
   */
  static async getSessionToken(key) {
    const rc = await getRedisClient()
    return rc.get(key)
  }

  /**
   * @param {string} key
   * @param {object} token
   * @param {number} ttl
   */
  static async setSessionToken(key, token, ttl) {
    const rc = await getRedisClient()
    await rc.setEx(key, ttl, token)
  }

  static async getPersistentToken(prefix) {
    const config = await ConfigStore.getProviderConfig(prefix)
    const secretKey = assertField(config, 'secretKey')
    const secret = `${secretKey}` // + `${req.originalUrl.substring(4)}`
    return crypto.createHash('md5').update(secret).digest('hex')
  }
}
