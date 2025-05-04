// mysql/user.repository.ts
import { Injectable, Inject } from '@nestjs/common';
import type { Pool, RowDataPacket } from 'mysql2/promise';

export class GetUserDto {
    constructor(
        readonly id: string
    ) { }
}

@Injectable()
export class UserStore {
    constructor(
        @Inject('DatabaseConnection') private conn: Pool,
    ) { }

    /**
     * getUser
     * 
     * @param dto 
     * @returns 
     */
    async getUser(dto: GetUserDto) {
        const [[user]] = await this.conn.query<RowDataPacket[]>(`
            select id        as id
              , balance      as balance
              , real_balance as realBalance
              , currency     as currency
            from users
            where id = ?
        `, [dto.id])

        return user;
    }
}
