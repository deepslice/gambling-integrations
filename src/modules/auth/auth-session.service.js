import redis from 'core-infra/cache/index.js'

const sessionTTLSeconds = 30 * 60 * 60

export class AuthSessionService {
  /**
   * getSession
   * @param token
   * @returns {Promise<object>}
   */
  static async getSession(token) {
    return await redis.get(token)
  }

  /**
   * setSessionToken
   * @param token
   * @param payload
   * @param ttl
   * @returns {Promise<boolean>}
   */
  static async setSession(token, payload, ttl) {
    await redis.set(token, payload, ttl)
    return redis.client.exists(token)
  }

  /**
   * validateSessionToken
   * @param token
   * @returns {Promise<boolean>}
   */
  static async validateSession(token) {
    const exists = await redis.client.exists(token)
    return exists && redis.client.expire(token, sessionTTLSeconds)
  }
}
