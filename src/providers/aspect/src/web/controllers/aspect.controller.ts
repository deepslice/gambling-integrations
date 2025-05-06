// wallet/wallet.controller.ts
import { Controller, Post, Get, UseGuards, Body, Query } from '@nestjs/common';
import { AspectService as ProviderService } from '@/providers/aspect/src/services/aspect.service';

import { SecretTokenAuthGuard } from '@/auth/guards/secret-token-auth.guard';
import { SecretToken } from '@/auth/decorators/secret-token.decorator';

import { TokenAuthGuard } from '@/auth/guards/token-auth.guard';
import { Token } from '@/auth/decorators/token.decorator';

import { 
    BalanceRequestDto,
    DebitRequestDto,
    CreditRequestDto,
 } from '@/providers/aspect/src/dto';

@Controller('api')
export class ProviderController {
    constructor(private readonly providerService: ProviderService) { }

    /**
     * getBalance
     * 
     * @param token 
     * @param secretToken 
     */
    @Get('balance')
    @UseGuards(TokenAuthGuard, SecretTokenAuthGuard)
    async getBalance(
        @Token() token: string,
        @SecretToken() secretToken: string,
        @Query() dto: BalanceRequestDto
    ) {
        return this.providerService.getBalance(dto);
    }

    /**
     * debit
     * 
     * @param token 
     * @param secretToken 
     */
    @Post('debit')
    @UseGuards(TokenAuthGuard, SecretTokenAuthGuard)
    async debit(
        @Token() token: string,
        @SecretToken() secretToken: string,
        @Body() dto: DebitRequestDto
    ) { 
        return this.providerService.debit(dto);
    }

    /**
     * credit
     * 
     * @param token 
     * @param secretToken 
     */
    @Post('credit')
    @UseGuards(TokenAuthGuard, SecretTokenAuthGuard)
    async credit(
        @Token() token: string,
        @SecretToken() secretToken: string,
        @Body() dto: CreditRequestDto
    ) {
        return this.providerService.credit(dto);
     }

    /**
     * rollback
     * 
     * @param secretToken 
     */
    @Post('rollback')
    @UseGuards(SecretTokenAuthGuard)
    async rollback(
        @SecretToken() secretToken: string
        // TODO: ...
    ) { }
}
