import {databaseConnection} from '#app/infrastructure/database/connection'

export class WageringService {
  constructor(
    database = databaseConnection,
  ) {
    this.database = database
  }

  async getWageringBalance(userId, wageringBalanceId, rate) {
    const [[wBalance]] = await this.database.query(`
        select id          as id
             , balance / ? as balance
        from wagering_balance
        where id = ?
          and user_id = ?
          and status = 1
          and free_spin = 0
          and (expires_at > now() or expires_at is null)
    `, [rate, wageringBalanceId, user.id])

    if (!wBalance) {
      return null
    }

    return wBalance.balance
  }
}
