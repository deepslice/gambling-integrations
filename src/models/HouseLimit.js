import db from '@/config/db';

const getLimits = `
SELECT bet_limit AS betLimit
FROM casino.limits
WHERE project_id = ?`;

const getBetLimits = `
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
AND site_section = ?`;

const getRestrictions = `
SELECT ggr * ? AS ggr, 
if(max_ggr IS NOT NULL, max_ggr - ggr, 1) AS difference
FROM casino.restrictions
WHERE code = ?`;

class HouseLimits {
    static async getLimits() {
        const [ [ limit ] ] = await db.query(
            getLimits, [providerId]
        );

        // if (limit) {
        //     return limit.betLimit;
        // }

        return limit;
    }

    static async getBetLimits() {
        const [ [ limit ] ] = await dq.query(
            getBetLimits,
            [
                prefix, game.finalGameId,
                prefix, game.provider,
                prefix, game.section,
            ]
        );

        // if (limit) {
        //     return limit.amount;
        // }

        return limit;
    }

    static async getRestrictions() {
        const [ [ restrictions ] ] = await db.query(
            getRestrictions,
            [currencyRate[user.currency] || 1, game.providerUid]
        );

        return restrictions;
    }
}

export default BetLimit;
