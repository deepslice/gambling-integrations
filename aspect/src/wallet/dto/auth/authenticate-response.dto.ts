// auth/dto/authenticate-response.dto.ts
export class AuthenticateResponseDto {
    authenticated!: boolean;
    username!: string;
    currency!: string;
    balance!: number;

    error?: string;
    errorCode?: number;
}
