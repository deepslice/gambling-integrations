// @ts-check

import crypto from 'node:crypto'
import redis from '@/infrastructure/cache'
import {assertField} from '@/utils/assert.util.js'
import {ConfigStore} from '@/modules/config/configModel'

export class AuthStore {

  /**
   * @param   {string} key
   * @returns {Promise<object>}
   */
  static async getSessionToken(key) {
    return redis.get(key)
  }

  /**
   * @param {string} key
   * @param {object} token
   * @param {number} ttl
   */
  static async setSessionToken(key, token, ttl) {
    const rc = await getRedisClient()
    await redis.set(key, token, ttl)
  }

  static async getPersistentToken(prefix) {
    const config = await ConfigStore.getProviderConfig(prefix)
    const secretKey = assertField(config, 'secretKey')
    const secret = `${secretKey}` // + `${req.originalUrl.substring(4)}`
    return crypto.createHash('md5').update(secret).digest('hex')
  }
}
