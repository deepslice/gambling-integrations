import { Injectable } from '@nestjs/common';
import { WalletService } from '@/wallet/services/wallet.service';

import { 
    BalanceRequestDto,
    CreditRequestDto,
    DebitRequestDto,
} from '@/providers/aspect/src/dto';

@Injectable()
export class AspectService {
    constructor(
        private readonly walletService: WalletService
    ) { }

    async getBalance(dto: BalanceRequestDto) { 
        this.walletService.getBalance
    }

    @UseGuards(BetLimitGuard, RestrictionsGuard)
    async credit(dto: CreditRequestDto) { }

    @UseGuards(BetLimitGuard, RestrictionsGuard)
    async debit(dto: DebitRequestDto) { }

    // TODO: ...
    async rollback(dto: void) { }
}
