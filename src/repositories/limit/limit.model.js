import {databaseConnection} from '#app/infrastructure/database/connection'

export class LimitModel {

  constructor(database = databaseConnection) {
    this.database = database
  }

  async updateLimits(data) {
    await this.database.query(`
                update casino.limits
                set bet_limit = bet_limit - ?
                where project_id = ?
      `,
      [
        data.convertedAmount,
        data.projectId,
      ],
    )
  }

  async updateRestrictions(data) {
    await this.database.query(`
                update casino.restrictions
                set ggr = ggr - ? / ?
                where code = ?
      `,
      [
        data.amount,
        data.currencyRate[data.currency] || 1,
        data.providerUid,
      ],
    )
  }
}
