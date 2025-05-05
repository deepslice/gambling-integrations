// token-auth.service.ts
import { Injectable } from '@nestjs/common';

import { WalletStore } from '@/infrastructure/persistance/mysql/wallet.repository'
import { WithdrawFundsDto } from '@/wallet/dto/withdraw-funds.dto';
import { DepositFundsDto } from '@/wallet/dto/deposit-funds.dto';
import { GetBalanceDto } from '@/wallet/dto/get-balance.dto';

@Injectable()
export class WalletService {
    constructor(
        private readonly walletStore: WalletStore
    ) { }

    /**
     * getBalance
     * 
     * @param dto 
     */
    async getBalance(dto: GetBalanceDto) {

    }

    /**
     * depositFunds
     * 
     * @param dto 
     */
    async depositFunds(dto: DepositFundsDto) {

    }

    /**
     * withdrawFunds
     * 
     * @param dto 
     */
    async withdrawFunds(dto: WithdrawFundsDto) {

    }
}
