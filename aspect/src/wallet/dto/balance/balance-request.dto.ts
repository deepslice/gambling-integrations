// balance/dto/balance-request.dto.ts
import { IsString } from 'class-validator';

export class BalanceRequestDto {
  @IsString()
  token!: string;

  @IsString()
  gameId!: string;
}
