import {databaseConnection} from '#app/infrastructure/database/connection'

export class LimitsModel {

  constructor(database = databaseConnection) {
    this.database = database
  }

  async getLimits(data) {
    await this.database.query(`
                select bet_limit as betLimit
                from casino.limits
                where project_id = ?`,
      [
        data.providerId,
      ])
  }

  async getBetLimits(data) {
    await this.database.query(`
                select bet_limit as amount
                from casino.final_game_limits
                where prefix = ?
                  and final_game_id = ?

                union all

                select bet_limit as amount
                from casino.provider_limits
                where prefix = ?
                  and provider = ?

                union all

                select bet_limit as amount
                from casino.section_limits
                where prefix = ?
                  and site_section = ?`,
      [
        data.prefix, data.finalGameId,
        data.prefix, data.provider,
        data.prefix, data.section,
      ])
  }

  async updateLimits(data) {
    await this.database.query(`
                update casino.limits
                set bet_limit = bet_limit - ?
                where project_id = ?`,
      [
        data.convertedAmount,
        data.projectId,
      ],
    )
  }
}
