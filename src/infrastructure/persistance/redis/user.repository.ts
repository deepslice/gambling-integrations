// redis/user.repository.ts
import { Injectable } from '@nestjs/common';
import type { RedisClientType } from 'redis';

import { UserInfo } from '@/core/domain/entities/user.entity';

export class SetUserDto {
    user!: UserInfo
    token!: string
}

export class GetUserDto {
    token!: string
}

@Injectable()
export class UserStore {
    constructor(
        private client: RedisClientType,
    ) { }

    /**
     * setUser
     * ..
     * @param dto 
     */
    async setUser(dto: SetUserDto) {
        await this.client.setEx(
            `aspect-initial-token:${dto.token}`,
            30 * 60 * 60,
            JSON.stringify(dto.user)
        );
    }

    /**
     * getUser
     * ...
     * @param dto 
     * @returns 
     */
    async getUser(dto: GetUserDto) {
        const user = this.client.get(`aspect-initial-token:${dto.token}`);
        return JSON.parse(user);
    }
}
