import { createPool } from 'mysql2/promise';
import { databaseConfig } from '@/config/database.config';

export const DatabaseConnection = {
    provide: 'DatabaseConnection',
    useFactory: () => createPool(databaseConfig),
}
