import { Injectable } from '@nestjs/common';

import { DebitRequestDto, CreditRequestDto } from '@/application/dto/transactions';
import { TransactionsStore } from '@/infrastructure/persistance/mysql/transactions.repository';

@Injectable()
export class TransactionsService {
    constructor(
        private readonly transactionsStore: TransactionsStore
    ) {}

    /**
     * debit
     * ...
     * @param dto
     * @return 
     */
    async debit(dto: DebitRequestDto) {
    
    }

    /**
     * credit
     * ...
     * @param dto
     * @return 
     */
    async credit(dto: CreditRequestDto) {
    
    }
}
