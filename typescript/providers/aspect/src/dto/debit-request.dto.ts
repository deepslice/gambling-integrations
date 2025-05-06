import { IsString, IsNumber } from 'class-validator';
import { BaseTransactionDto } from './base-transaction.dto';

export class DebitRequestDto extends BaseTransactionDto {
    @IsNumber()
    amount!: number;
}
