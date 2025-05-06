// rules/wager-policy.service.ts
import { Injectable } from '@nestjs/common';
import type { Pool, RowDataPacket } from 'mysql2/promise';

// TODO: Унести весь SQL в файлы .sql для линтинга, валидации и отдельного версионирования
const getHouseRestrictions = 
`
SELECT ggr * ? AS ggr, 
if(max_ggr IS NOT NULL, max_ggr - ggr, 1) AS difference
FROM casino.restrictions
WHERE code = ?
`;

// TODO: Унести весь SQL в файлы .sql для линтинга, валидации и отдельного версионирования
const getHouseLimits = 
`
SELECT bet_limit AS betLimit
FROM casino.limits
WHERE project_id = ?
`;

// TODO: Унести весь SQL в файлы .sql для линтинга, валидации и отдельного версионирования
const getBetLimits = 
`
SELECT bet_limit AS amount
FROM casino.final_game_limits
WHERE prefix = ?
AND final_game_id = ?

UNION ALL

SELECT bet_limit AS amount
FROM casino.provider_limits
WHERE prefix = ?
AND provider = ?

UNION ALL

SELECT bet_limit AS amount
FROM casino.section_limits
WHERE prefix = ?
AND site_section = ?
`;

@Injectable()
export class WagerPolicyService {
    constructor(
        private readonly connPool: Pool
    ) { }

    /**
     * getHouseLimits
     * Global Bet Limits
     * 
     */
    async getHouseLimits(providerId: number) {
        const [[limit]] = await this.connPool.query<RowDataPacket[]>(
            getHouseLimits, [providerId]
        );

        if (limit) {
            return limit.betLimit;
        }
    }

    async getBetLimits() {
        const [[betLimit]] = await this.connPool.query(
            getBetLimits,
            [
                prefix, game.finalGameId,
                prefix, game.provider,
                prefix, game.section,
            ]
        );

        if (betLimit) {
            return betLimit.amount;
        }
    }

    async getRestrictions() {

    }

    /**
     * validateRestrictions
     * Проверка ограничений игрока
     * 
     * @param userId 
     * @param amount 
     */
    async validateRestrictions(userId: number, amount: number) {
        const [[restrictions]] = await connPool.query(
            getCasinoRestrictions,
            [currencyRate[user.currency] || 1, game.providerUid]
        );

        if (!restrictions || restrictions.ggr < dto.amount || restrictions.difference <= 0) {
            const response = {
                error: 'Insufficient Funds',
                errorCode: 1003,
            }

            await txn.rollback()
            // res.status(200).json(response).end()
            // console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Debit9#####', req.path, JSON.stringify(req.body), JSON.stringify(response))
            return
        }
    }

    /**
     * validateBetLimits
     * Проверка лимитов игрока
     * 
     * @param userId 
     * @param amount 
     */
    async validateBetLimits(userId: number, amount: number) {
        // TODO: Здесь осознанно запрос из пула? Так он не в рамках транзакции!
        const [[limit]] = await connPool.query(
            getCasinoLimits, [project.id]
        );

        if (!limit || limit.betLimit < 0) {
            const response = {
                error: 'Insufficient Funds',
                errorCode: 1003,
            }

            await txn.rollback();
            // res.status(200).json(response).end()
            // console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Debit10#####', req.path, JSON.stringify(req.body), JSON.stringify(response))
            return;
        }

        const betLimit = await getBetLimit(pool, prefix, game);

        if (betLimit && betLimit < user.convertedAmount) {
            const response = {
                error: 'Insufficient Funds',
                errorCode: 1003,
            }

            await txn.rollback();
            // res.status(200).json(response).end()
            // console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Debit11#####', req.path, JSON.stringify(req.body), JSON.stringify(response))
            return;
        }
    }
}
