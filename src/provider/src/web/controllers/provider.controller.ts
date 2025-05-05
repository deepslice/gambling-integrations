// wallet/wallet.controller.ts
import { Controller, Post, Get, Query, Req } from '@nestjs/common';
import type { Request } from 'express';

import { AspectService as ProviderService } from 'provider/src/services/provider.service';

@Controller('api')
export class ProviderController {
  constructor(private readonly providerService: ProviderService) {}

  @Get('balance')
  async getBalance() {}

  @Post('debit')
  async debit() {}

  @Post('credit')
  async credit() {}

  @Post('rollback')
  async rollback() {}
}
