// balance/dto/balance-response.dto.ts
export class BalanceResponseDto {
    success!: boolean;
    balance!: number;

    error?: string;
    errorCode?: number;
}
