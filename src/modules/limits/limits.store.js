// @ts-check

import dbConnection from '../../infrastructure/.deprecated/db.connection.js'
import {assertField} from '@/utils/assert.util.js'

const getLimits = `
    SELECT bet_limit AS betLimit
    FROM casino.limits
    WHERE project_id = ?`

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
      AND site_section = ?`

const getRestrictions = `
    SELECT ggr * ?                                   AS ggr,
           if(max_ggr IS NOT NULL, max_ggr - ggr, 1) AS difference
    FROM casino.restrictions
    WHERE code = ?`

export class LimitStore {
  static async getLimits() {
    const [[row]] = await dbConnection.query(
      getLimits, [providerId],
    )

    /**
     * @type {number}
     */
    return assertField(row, 'betLimit')
  }

  static async getBetLimits() {
    const [[row]] = await dbConnection.query(
      getBetLimits,
      [
        prefix, game.finalGameId,
        prefix, game.provider,
        prefix, game.section,
      ],
    )

    /**
     * @type {number}
     */
    return assertField(row, 'amount')
  }

  static async getRestrictions() {
    const [[row]] = await dbConnection.query(
      getRestrictions,
      [currencyRate[user.currency] || 1, game.providerUid],
    )

    /**
     * @type {{
     *   ggr: number;
     *   difference: number;
     * }}
     */
    return {
      ggr: assertField(row, 'ggr'),
      difference: assertField(row, 'difference'),
    }
  }
}
