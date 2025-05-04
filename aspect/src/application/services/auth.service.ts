import { Injectable } from '@nestjs/common';

import { AuthenticateRequestDto } from '@/application/dto/auth/authenticate-request.dto';
import { AuthStore } from '@/infrastructure/persistance/mysql/auth.repository';

@Injectable()
export class AuthService {
    constructor(
        private readonly authStore: AuthStore
    ) {}

    /**
     * authenticate
     * ...
     * @param dto 
     * @return 
     */
    async authenticate(dto: AuthenticateRequestDto) {
    
    }
}
