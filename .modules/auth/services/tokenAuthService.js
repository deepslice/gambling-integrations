// auth/token-auth.service.ts
import {Redis} from 'ioredis'

export class TokenAuthService {
  constructor(prefix) {
    this.prefix = prefix
    this.redisClient = new Redis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT),
    })
  }

  async setToken(key, token, ttl) {
    await this.redisClient.setex(key, ttl, token)
  }

  async getToken(key) {
    return this.redisClient.get(`${prefix}:${key}`)
  }

  async validateToken(key, token) {
    const storedToken = await this.getToken(key)
    return storedToken === token
  }
}
