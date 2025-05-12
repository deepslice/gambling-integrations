import {databaseConnection} from '#app/infrastructure/database/connection'
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

  async insertTransaction() {
    const [{insertId: txId}] = await this.database.query(`
                insert into casino_transactions (amount, transaction_id, player_id,
                                                 action, aggregator, provider,
                                                 game_id, currency, session_id,
                                                 section, round_id, freespin_id)
                values (?, concat(?, ?), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.convertedAmount, dto.transactionKey, ':BET',
        user.id, 'BET', 'aspect', game.provider, game.uuid,
        user.nativeCurrency, dto.token, game.section,
        dto.transactionKey, wageringBalanceId ? wageringBalanceId : null,
      ],
    )

    return txId
  }

  async insertConvertedTransaction() {
    await this.database.query(`
                insert into casino_converted_transactions (id, amount, converted_amount,
                                                           user_id, action, aggregator,
                                                           provider, uuid, currency,
                                                           currency_to, rate)
                values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        txId, -dto.amount, -user.convertedAmount,
        user.id, 1, 'aspect',
        game.provider, game.uuid, convertCurrency,
        user.nativeCurrency, conversion.rate,
      ],
    )
  }
}
