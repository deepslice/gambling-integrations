import {AuthStore} from '#app/modules/auth/auth.store'
import {UserModel} from '#app/models/user/user.model'
import {isUserActive} from '#app/models/user/user.util'
import {GameModel} from '#app/models/game/game.model'
import {isGameActive} from '#app/models/game/game.util'
import {TransactionModel} from '#app/models/transaction/transaction.model'
import * as errors from '../utils/exceptions.util'

export class GameService {
  static async gameInit() {

    const token = randomBytes(36).toString('hex')
    AuthStore.setSessionToken()

  }

  /**
   * @param {string} userId
   * @param {string} gameId
   * @param {number} amount
   * @returns
   */
  static async transaction(userId, gameId, amount) {
    // res.status(500).end()
    // console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Debit2#####', req.path, JSON.stringify(req.body))

    if (amount < 0) {
      return
    }

    //const txn = await dbConnection.getConnection()

    const user = UserModel.getUserInfo(userId)
    if (!isUserActive(user)) {
      throw new errors.InvalidPlayerError()
    }

    if (user.balance < amount) {
      throw new errors.InsufficientFundsError()
    }

    const status = user.status
    if (status) {
      if (status.transactions || status.casino) {
        throw new errors.InsufficientFundsError()
      }
    }

    const game = GameModel.getGameInfo(gameId)
    if (!isGameActive(game)) {
      throw new errors.InvalidGameError()
    }

    const [{id: txId}] = await TransactionModel.getTransactionIdBet(transactionKey)
    if (txId) {
      return
    }

    user.convertedAmount = amount

    try {
      await txn.beginTransaction()

      const conversion = await convertCurrencyForUserV2(convertCurrency, wPool, prefix, client, user, 1)

      if (!conversion.rate) {
        const response = {
          error: 'Global error.',
          errorCode: 1008,
        }

        await txn.rollback()
        return
      }

      const isWageringBalanceValid = await handleWageringBalanceV2(wPool, wageringBalanceId, user, conversion.rate)

      if (!isWageringBalanceValid) {
        const response = {
          error: 'Global error.',
          errorCode: 1008,
        }

        await txn.rollback()
      }

    } catch (error) {

    } finally {

    }
  }
}
