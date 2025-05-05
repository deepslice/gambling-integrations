// transactions/dto/base-transaction.dto.ts
import { IsString } from 'class-validator';

export class BaseTransactionDto {
  @IsString()
  token!: string;

  @IsString()
  gameId!: string;

  @IsString()
  transactionKey!: string;
}
