// common/types/project.type.ts
export type IProject = {
    id: number;
    prefix: string;
    db: string;
    currency: string;
    config: any;
    secretKey: string;
    operatorId: number;
    balanceLimit?: number;
    winLimit?: number;
};
