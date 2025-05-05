// secret-token-auth.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { SecretTokenAuthService } from '@/auth/services/secret-token-auth.service';

@Injectable()
export class SecretKeyAuthGuard implements CanActivate {
  constructor(private readonly secretTokenAuthService: SecretTokenAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const secretKey = request.headers['authorization']?.split(' ')[1];
    
    if (!secretKey) {
      throw new UnauthorizedException('Token not provided');
    }

    const isValid = await this.secretTokenAuthService.validateSecretToken(prefix, secretKey);
    
    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    return true;
  }
}
