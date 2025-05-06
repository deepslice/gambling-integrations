import { IsString, IsNumber } from 'class-validator';
import { BaseTransactionDto } from './base-transaction.dto';

export class CreditRequestDto extends BaseTransactionDto {
    @IsNumber()
    amount!: number;
}
