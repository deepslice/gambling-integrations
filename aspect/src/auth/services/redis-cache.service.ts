// redis-cache.service.ts
import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisCacheService {
  private readonly redisClient: Redis;

  constructor() {
    this.redisClient = new Redis({
      host: process.env.REDIS_HOST,
      port: parseInt(<string>process.env.REDIS_PORT),
    });
  }

  async setToken(key: string, token: string, ttl: number): Promise<void> {
    await this.redisClient.setex(key, ttl, token);
  }

  async getToken(key: string): Promise<string | null> {
    return this.redisClient.get(key);
  }

  async validateToken(key: string, token: string): Promise<boolean> {
    const storedToken = await this.getToken(key);
    return storedToken === token;
  }
}
