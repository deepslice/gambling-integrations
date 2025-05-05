import { RowDataPacket } from 'mysql2/promise'

export interface WalletBalance extends RowDataPacket {
    id: number;
    balance: number;
    realBalance: number;
    currency: string;
}

export interface TransactionReceipt {

}
