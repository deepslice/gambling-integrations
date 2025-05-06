// secret-token-auth.service.ts
import { Injectable } from '@nestjs/common';
import crypto from 'node:crypto'

import { ConfigProviderService } from '@/config/services/config-provider.service';

@Injectable()
export class SecretTokenAuthService {
    constructor(
        private readonly configProviderService: ConfigProviderService
    ) { }

    async getSecretKey(prefix: string): Promise<string> {
        const providerConfig =  await this.configProviderService.getConfig(prefix);

        if (!providerConfig) {
            throw ('provider config not found')
        }

        return providerConfig.secretKey
    }

    async validateSecretToken(prefix: string, secretToken: string): Promise<boolean> {
        const storedKey = await this.getSecretKey(prefix);
        const secret = `${storedKey}`; // + `${req.originalUrl.substring(4)}`
        const expectedToken = crypto.createHash('md5').update(secret).digest('hex')

        return `AUTH ${expectedToken.toUpperCase()}` === secretToken;
    }
}
