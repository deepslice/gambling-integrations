// token-auth.service.ts
import { Injectable } from '@nestjs/common';

import { WalletStore } from '@/infrastructure/persistance/mysql/wallet.repository'
import { GetBalanceDto } from '@/wallet/dto/get-balance.dto';
import { UpdateBalanceDto } from '@/wallet/dto/update-balance.dto';

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
    async depositFunds(dto: UpdateBalanceDto) {

    }

    /**
     * withdrawFunds
     * 
     * @param dto 
     */
    async withdrawFunds(dto: UpdateBalanceDto) {

    }
}
