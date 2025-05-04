// transactions/withdrawal-transaction.dto.ts
import { IsNumber, IsBoolean } from 'class-validator';
import { BaseTransactionDto } from './base-transaction.dto';

export class WithdrawFundsDto extends BaseTransactionDto {
    @IsNumber()
    userId!: number;

    @IsNumber()
    amount!: number;

    @IsBoolean()
    isReal!: boolean;
}
