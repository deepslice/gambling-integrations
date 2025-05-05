// auth/auth.controller.ts
import { Controller, Get, Query, Req } from '@nestjs/common';
import type { Request } from 'express';

import { AuthenticateRequestDto } from '@/application/dto/auth/authenticate-request.dto';
import { AuthService } from '@/application/services/auth.service';

@Controller('api')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * authenticate
   * ...
   * @param dto 
   * @param req 
   * @returns 
   */
  @Get('authenticate')
  async authenticate(
    @Query() dto: AuthenticateRequestDto,
    @Req() req: Request,
  ) {
    return this.authService.authenticate(dto);
  }
}
