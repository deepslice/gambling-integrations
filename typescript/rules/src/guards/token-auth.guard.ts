// token-auth.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { TokenAuthService } from '@/auth/services/token-auth.service';

@Injectable()
export class TokenAuthGuard implements CanActivate {
  constructor(private readonly tokenAuthService: TokenAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.query['token'];
    
    if (!token) {
      throw new UnauthorizedException('Token not provided');
    }

    const isValid = await this.tokenAuthService.validateToken(`aspect-initial-token:${token}`, token);
    
    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    return true;
  }
}
