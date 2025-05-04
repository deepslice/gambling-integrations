import { Injectable, Inject } from '@nestjs/common';
import type { Pool } from 'mysql2/promise';

@Injectable()
export class AuthStore {
    constructor(
        @Inject('DatabaseConnection') private conn: Pool,
    ) { }
}
