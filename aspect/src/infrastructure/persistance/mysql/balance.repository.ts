import { Injectable, Inject } from '@nestjs/common';
import type { Pool } from 'mysql2/promise';

@Injectable()
export class BalanceStore {
    constructor(
        @Inject('DatabaseConnection') private conn: Pool,
    ) { }
}
