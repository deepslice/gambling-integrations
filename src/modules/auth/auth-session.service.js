import redis from '@/infrastructure/cache'

const sessionTTLSeconds = 30 * 60 * 60

export class AuthSessionService {
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
