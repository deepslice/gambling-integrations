
const getCasinoLimitQuery = 
`
SELECT bet_limit AS betLimit
FROM casino.limits
WHERE project_id = ?
`;

const getBetLimitQuery = 
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

const getRestrictionsQuery = 
`
SELECT ggr * ? AS ggr, 
if(max_ggr IS NOT NULL, max_ggr - ggr, 1) AS difference
FROM casino.restrictions
WHERE code = ?
`;

const getCasinoLimit = async (conn) => {
    const [ [ limit ] ] = await conn.query(
        getCasinoLimitQuery, [ id ]
    )

    if (limit) {
        return limit.betLimit || 
    }
}

const getBetLimit = async (conn) => {
    const [ [ limit ] ] = await conn.query(
        getBetLimitQuery,
        [
            prefix, game.finalGameId,
            prefix, game.provider,
            prefix, game.section,
        ]
    )

    if (limit) {
        return limit.amount
    }
}

export const checkBetLimits = async () => {

}

export const checkRestrictions = async () => {

}
