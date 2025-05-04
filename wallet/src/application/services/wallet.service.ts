import { Injectable } from '@nestjs/common';

@Injectable()
export class WalletService {
    constructor(
        private readonly walletStore: WalletStore
    ) {}

    /**
     * getBalance
     * ...
     * @param dto
     * @return 
     */
    async getBalance(dto: BalanceRequestDto) {
        dto.gameId
    }
}
