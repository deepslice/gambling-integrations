// redis-cache.service.ts
import { Injectable } from '@nestjs/common';
import { Pool, createPool } from 'mysql2/promise';

import { ProviderConfig } from '@/interfaces/config-provider.interface';
import { getProviderConfigQuery } from '@/constants/config-provider.constant';

@Injectable()
export class ConfigProviderService {
  private readonly connPool: Pool;

  constructor() {
    this.connPool = createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 5,
        enableKeepAlive: true
    });
  }

  async getConfig(prefix: string): Promise<ProviderConfig> {
    const [[config]] = await this.connPool.query<ProviderConfig[]>(
        getProviderConfigQuery, [prefix]
    );

    if (!config) {
        throw ('config not found');
    }

    return config;
  }
}
