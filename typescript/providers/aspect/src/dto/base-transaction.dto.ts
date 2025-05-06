import { IsString, IsNumber } from 'class-validator';

export class BaseTransactionDto {
    @IsString()
    token!: string;

    @IsString()
    gameId!: string;

    @IsString()
    transactionKey!: string;
}
