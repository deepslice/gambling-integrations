// wallet/wallet.controller.ts
import { Controller, Get, Query, Req } from '@nestjs/common';
import type { Request } from 'express';

import { BalanceRequestDto } from '@/application/dto/balance/balance-request.dto';
import { BalanceService } from '@/application/services/balance.service';

@Controller('api')
export class WalletController {
  constructor(private readonly balanceService: BalanceService) {}

  /**
   * getBalance
   * ...
   * @param dto 
   * @param req 
   * @returns 
   */
  @Get('balance')
  async getBalance(
    @Query() dto: BalanceRequestDto,
    @Req() req: Request,
  ) {
    return this.balanceService.getBalance(dto);
  }
}
