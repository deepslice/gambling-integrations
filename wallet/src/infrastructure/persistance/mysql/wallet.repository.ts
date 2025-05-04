// mysql/wallet.repository.ts
import { Injectable, Inject } from '@nestjs/common';
import type { Pool } from 'mysql2/promise';

import { WithdrawFundsDto } from '@/application/dto/wallet/transactions/withdrawal-transaction.dto';
import { DepositFundsDto } from '@/application/dto/wallet/transactions/deposit-transaction.dto';
import { GetBalanceDto } from '@/application/dto/wallet/balance/get-balance.dto';

import {
    TransactionReceipt,
    WalletBalance
} from '@/core/domain/entities/wallet.entity'

interface IUpdateBalance {
    userId: number
    amount: number
    isReal: boolean
}

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
     * @returns Promise<WalletBalance>
     */
    async getBalance(dto: GetBalanceDto): Promise<WalletBalance> {
        const [[userBalance]] = await this.conn.query<WalletBalance[]>(
            getBalanceQuery, [dto.userId]
        );

        if (!userBalance) {
            throw ('User not found');
        }

        return userBalance;
    }

    /**
     * depositFunds
     * ...
     * @param dto 
     * @returns Promise<WalletBalance>
     */
    async depositFunds(dto: DepositFundsDto): Promise<void> {
        await this.updateBalance(dto);
    }

    /**
     * withdrawFunds
     * 
     * @param dto
     * @returns Promise<TransactionReceipt>
     */
    async withdrawFunds(dto: WithdrawFundsDto): Promise<void> {
        await this.updateBalance(dto);
    }

    /**
     * updateBalance
     * 
     * @param dto 
     * @returns Promise<void>
     */
    async updateBalance(dto: IUpdateBalance): Promise<void> {
        await this.conn.query(
            updateBalanceQuery,
            [dto.amount, dto.isReal ? dto.amount : 0, dto.userId]
        )
    }
}
