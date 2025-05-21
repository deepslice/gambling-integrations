import {databaseConnection} from 'core-infra/database/connection.js'

export class RestrictsModel {

  constructor(database = databaseConnection) {
    this.database = database
  }

  async getRestrictions() {
    await this.database.query(`
                select ggr * ? as ggr, if(max_ggr is not null, max_ggr - ggr, 1) as difference
                from casino.restrictions
                where code = ?`,
      [
        data.currencyRate[data.currency] || 1,
        data.providerUid,
      ])
  }

  async updateRestrictions(data) {
    await this.database.query(`
                update casino.restrictions
                set ggr = ggr - ? / ?
                where code = ?`,
      [
        data.amount,
        data.currencyRate[data.currency] || 1,
        data.providerUid,
      ],
    )
  }
}

export const restrictsRepository = new RestrictsModel()
