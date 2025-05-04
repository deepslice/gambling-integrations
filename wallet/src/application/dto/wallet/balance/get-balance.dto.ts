// balance/get-balance.dto.ts
import { IsString } from 'class-validator';

export class GetBalanceDto {
  @IsString()
  userId!: number;
}
