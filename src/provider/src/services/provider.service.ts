import { Injectable } from '@nestjs/common';

@Injectable()
export class AspectService {
    constructor(
        // private readonly walletStore: WalletStore
    ) { }

    async getBalance() { }

    async debit() { }

    async credit() { }

    async rollback() { }
}
