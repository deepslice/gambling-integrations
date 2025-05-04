import { Injectable } from '@nestjs/common';

import { BalanceRequestDto } from '@/application/dto/balance/balance-request.dto';
import { BalanceStore } from '@/infrastructure/persistance/mysql/balance.repository';

@Injectable()
export class BalanceService {
    constructor(
        private readonly balanceStore: BalanceStore
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
