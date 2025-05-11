import redis from '#app/infrastructure/cache/index'

const sessionTTLSeconds = 30 * 60 * 60

export class AuthSessionService {
  /**
   * setSessionToken
   * @param token
   * @param payload
   * @param ttl
   * @returns {Promise<boolean>}
   */
  static async setSessionToken(token, payload, ttl) {
    await redis.set(token, payload, ttl)
    return redis.client.exists(token)
  }

  /**
   * validateSessionToken
   * @param token
   * @returns {Promise<boolean>}
   */
  static async validateSessionToken(token) {
    const exists = await redis.client.exists(token)
    return exists && redis.client.expire(token, sessionTTLSeconds)
  }
}
