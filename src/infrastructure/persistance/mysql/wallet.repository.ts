// mysql/wallet.repository.ts
import { Injectable, Inject } from '@nestjs/common';
import type { Pool, RowDataPacket } from 'mysql2/promise';

import { GetBalanceDto } from '@/wallet/dto/get-balance.dto';
import { UpdateBalanceDto } from '@/wallet/dto/update-balance.dto';

import { IUserInfo } from "common/ifaces/user-info.iface";
interface UserInfo extends IUserInfo, RowDataPacket {};

const getBalanceQuery = `
    select id             as id,
           balance        as balance,
           real_balance   as realBalance,
           currency       as currency
    from users
    where id = ?`

const updateBalanceQuery = `
    update users
    set balance      = balance + ?,
        real_balance = real_balance + ?
    where id = ?`

@Injectable()
export class WalletStore {
    constructor(
        @Inject('DatabaseConnection') private conn: Pool,
    ) { }

    /**
     * getBalance
     * 
     * @param dto
     * @returns Promise<UserInfo>
     */
    async getBalance(dto: GetBalanceDto): Promise<UserInfo> {
        const [[userBalance]] = await this.conn.query<UserInfo[]>(
            getBalanceQuery, [dto.userId]
        );

        if (!userBalance) {
            throw ('user not found');
        }

        return userBalance;
    }

    /**
     * depositFunds
     * ...
     * @param dto 
     * @returns Promise<WalletBalance>
     */
    async depositFunds(dto: UpdateBalanceDto): Promise<void> {
        await this.updateBalance(dto);
    }

    /**
     * withdrawFunds
     * 
     * @param dto
     * @returns Promise<TransactionReceipt>
     */
    async withdrawFunds(dto: UpdateBalanceDto): Promise<void> {
        await this.updateBalance(dto);
    }

    /**
     * updateBalance
     * 
     * @param dto 
     * @returns Promise<void>
     */
    async updateBalance(dto: UpdateBalanceDto): Promise<void> {
        await this.conn.query(
            updateBalanceQuery,
            [dto.amount, dto.isReal ? dto.amount : 0, dto.userId]
        )
    }
}
