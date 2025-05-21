import {databaseConnection} from 'core-infra/database/connection.js'

export class WageringService {
  constructor(
    database = databaseConnection,
  ) {
    this.database = database
  }

  async insertWageringTransaction(data) {
    await this.database.query(`
                insert into wagering_transactions (wagering_id, user_id, amount, balance_before, balance_after,
                                                   reference)
                values (?, ?, ?, ? * ?, ? * ?, concat('cas:', ?))
      `,
      [
        data.wageringBalanceId,
        data.userId,
        data.amount,
        data.balance,
        data.conversionRate,
        data.balanceAfter,
        data.conversionRate,
        data.trxId,
      ],
    )
  }

  async updateWageringBalance() {
    await this.database.query(`
                update wagering_balance
                set balance = balance + ?
                where id = ?
      `,
      [
        amount,
        wageringBalanceId,
      ],
    )
  }

  async getWageringBalance(userId, wageringBalanceId, rate) {
    const [[wBalance]] = await this.database.query(`
        select id as id, balance / ? as balance
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
