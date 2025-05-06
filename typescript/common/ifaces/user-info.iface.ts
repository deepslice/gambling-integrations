// common/ifaces/user-info.iface.ts
export interface IUserInfo {
    id: number;
    username?: string;
    balance: number;
    realBalance?: number;
    currency: string;
    nativeBalance?: number;
    nativeCurrency?: string;
    active?: boolean;
    deleted?: boolean;
    createdAt?: number;
    parentId?: number;
    status?: any;
    convertedAmount?: number;
};
