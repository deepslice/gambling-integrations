// aspect/aspect.controller.ts
import { Controller, Post, Get, UseGuards, Body, Query, Req } from '@nestjs/common';
import type { Request } from 'express';

import { TokenAuthGuard } from '@/auth/guards/token-auth.guard';
import { Token } from '@/auth/decorators/token.decorator';

import { BalanceRequestDto } from '@/wallet/dto/balance/balance-request.dto';
import { WalletService } from '@/wallet/services/wallet.service';
import { 
    DebitRequestDto, 
    CreditRequestDto,
    TransactionResponseDto
} from '@/wallet/dto/transactions';

@Controller('api')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  /**
   * getBalance
   * ...
   * @param dto 
   * @param req 
   * @returns 
   */
  @Get('balance')
  @UseGuards(TokenAuthGuard)
  async getBalance(
    @Token() token: string,
    @Query() dto: BalanceRequestDto,
    @Req() req: Request,
  ): Promise<void> {
    
  }

  /**
   * debit
   * ...
   * @param dto 
   */
  @Post('debit')
  @UseGuards(TokenAuthGuard)
  async debit(
    @Token() token: string,
    @Body() dto: DebitRequestDto
  ): Promise<void> {

  }

  /**
   * credit
   * ...
   * @param dto 
   */
  @Post('credit')
  @UseGuards(TokenAuthGuard)
  async credit(
    @Token() token: string,
    @Body() dto: CreditRequestDto
  ): Promise<void> {

  }

  /**
   * rollback
   * ...
   * @param dto 
   */
  @Post('rollback')
  @UseGuards(TokenAuthGuard)
  async rollback(
    @Token() token: string,
    @Body() dto: DebitRequestDto
  ): Promise<void> {

  }
}
