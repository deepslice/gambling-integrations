export type IGameInfo = {
    uuid: string;
    provider: string;
    aggregator: string;
    section: string;
    name: string;
    providerUid: string;
    active?: boolean;
    deleted?: boolean;
    finalGameId?: string;
};