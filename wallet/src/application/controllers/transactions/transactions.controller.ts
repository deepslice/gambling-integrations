// transactions/transactions.controller.ts
import { Controller, Post, Body } from '@nestjs/common';

import { DebitRequestDto, CreditRequestDto} from '@/application/dto/transactions';
import { TransactionsService } from '@/application/services/transactions.service';

@Controller('api')
export class TransactionsController {
    constructor(private readonly transactionsService: TransactionsService) { }

    /**
     * debit
     * ...
     * @param dto
     * @returns 
     */
    @Post('debit')
    async debit(
        @Body() dto: DebitRequestDto,
    ) {
        return this.transactionsService.debit(dto);
    }

    /**
     * credit
     * ...
     * @param dto
     * @returns 
     */
    @Post('credit')
    async credit(
        @Body() dto: CreditRequestDto,
    ) {
        return this.transactionsService.credit(dto);
    }
}
