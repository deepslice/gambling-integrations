import { IsString } from 'class-validator';

export class BalanceRequestDto {
  @IsString()
  token!: string;

  @IsString()
  gameId!: string;
}
