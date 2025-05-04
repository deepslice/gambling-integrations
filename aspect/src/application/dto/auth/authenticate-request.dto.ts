// auth/dto/authenticate-request.dto.ts
import { IsString, IsNumber } from 'class-validator';

export class AuthenticateRequestDto {
  @IsString()
  token!: string;

  @IsString()
  gameId!: string;

  @IsNumber()
  operatorId!: number;
}
