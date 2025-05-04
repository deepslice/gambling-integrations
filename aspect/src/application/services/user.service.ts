import { Injectable } from '@nestjs/common';

import { UserStore as UserStore, GetUserDto } from '@/infrastructure/persistance/mysql/user.repository';
import { UserStore as UserCache, GetUserDto as GetCachedUserDto } from '@/infrastructure/persistance/redis/user.repository';

@Injectable()
export class UserService {
    constructor(
        private readonly userStore: UserStore,
        private readonly userCache: UserCache
    ) {}

    /**
     * getUser
     * ...
     * @param dto
     * @return 
     */
    async getUser(dto: GetCachedUserDto) {
        const cachedUser = await this.userCache.getUser(dto);
        const user = await this.userStore.getUser(new GetUserDto(cachedUser.id));
        return user;
    }
}
