import {databaseConnection} from 'packages/core-infra/database/connection'

export class RoundModel {

  constructor(database = databaseConnection) {
    this.database = database
  }

  async insertRound(data) {
    await this.database.query(`
                insert into casino_rounds(bet_amount, win_amount, round_id, user_id, aggregator, provider, uuid,
                                          currency, additional_info)
                values (?, 0, concat('ca:', ?), ?, ?, ?, ?, ?, ?) on duplicate key
                update bet_amount = bet_amount + ?
      `,
      [
        data.convertedAmount,
        data.transactionId,
        data.userId,
        'caleta',
        data.provider,
        data.gameUuid,
        data.nativeCurrency,
        data.wageringBalanceId ? JSON.stringify({wageringBalanceId: data.wageringBalanceId}) : null,
        data.convertedAmount,
      ],
    )
  }
}
