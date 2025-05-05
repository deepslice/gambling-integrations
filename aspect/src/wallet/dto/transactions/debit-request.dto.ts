import { IsNumber } from 'class-validator';
import { BaseTransactionDto } from './base-transaction.dto';

// transactions/dto/debit-request.dto.ts
export class DebitRequestDto extends BaseTransactionDto {
    @IsNumber()
    amount!: number;
}
