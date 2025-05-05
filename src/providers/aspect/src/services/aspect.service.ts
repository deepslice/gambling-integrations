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

    async credit(dto: CreditRequestDto) { }

    async debit(dto: DebitRequestDto) { }

    // TODO: ...
    async rollback(dto: void) { }
}
