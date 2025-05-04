import { IsNumber } from 'class-validator';
import { BaseTransactionDto } from './base-transaction.dto';

// transactions/dto/credit-request.dto.ts
export class CreditRequestDto extends BaseTransactionDto {
    @IsNumber()
    amount!: number;
}
