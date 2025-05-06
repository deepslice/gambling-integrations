import { RowDataPacket } from 'mysql2/promise';

export interface ProviderConfig extends RowDataPacket {
    id: number;
    prefix: number;
    db: number;
    currency: string;
    dbConfig: string;
    secretKey: string;
    operatorId: string;
    balanceLimit: number;
    winLimit: number;
}
