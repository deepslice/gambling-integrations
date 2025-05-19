import {databaseConnection} from 'packages/core-infra/database/connection'
import {assertField} from '#app/utils/assert.util'

class TransactionTypeEnum {
  static get BET() {
    return ':BET'
  }

  static get WIN() {
    return ':WIN'
  }
}

export class TransactionModel {
  constructor(database = databaseConnection) {
    this.database = database
  }

  async getTransactionId(key, type) {
    const [[transaction]] = await this.database.query(`
                select id AS id
                from casino_transactions
                where transaction_id = concat(?, ?)`,
      [key, type],
    )
    return assertField(transaction, 'id')
  }

  async hasBetTransaction(id) {
    try {
      const txId = await this.getTransactionId(id, TransactionTypeEnum.BET)
      return !!txId
    } catch (e) {
      return false
    }
  }

  async hasWinTransaction(id) {
    try {
      const txId = await this.getTransactionId(id, TransactionTypeEnum.WIN)
      return !!txId
    } catch (e) {
      return false
    }
  }

  async insertTransaction(data) {
    const [{insertId: txId}] = await this.database.query(`
                insert into casino_transactions (amount, transaction_id, player_id,
                                                 action, aggregator, provider,
                                                 game_id, currency, session_id,
                                                 section, round_id, freespin_id)
                values (?, concat(?, ?), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.convertedAmount, data.transactionId, TransactionTypeEnum.BET,
        data.userId, 'BET', 'aspect', data.provider, data.gameUuid,
        data.nativeCurrency, data.sessionToken, data.section,
        data.transactionId, data.wageringBalanceId ? data.wageringBalanceId : null,
      ],
    )

    return txId
  }

  async insertConvertedTransaction(data) {
    await this.database.query(`
                insert into casino_converted_transactions (id, amount, converted_amount,
                                                           user_id, action, aggregator,
                                                           provider, uuid, currency,
                                                           currency_to, rate)
                values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.transactionId, -data.amount, -data.convertedAmount,
        data.userId, 1, 'aspect',
        data.provider, data.gameUuid, data.convertCurrency,
        data.nativeCurrency, data.conversionRate,
      ],
    )
  }
}
