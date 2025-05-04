// transactions/dto/transaction-response.dto.ts
export class TransactionResponseDto {
    success!: boolean;
    balance!: number;

    error?: string;
    errorCode?: number;
}
