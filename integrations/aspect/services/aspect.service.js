import dbConnection from '#app/infrastructure/.deprecated/db.connection'
import * as errors from '../utils/exceptions.util'

import {UserModel} from '#app/models/user/user.model'
import {isUserActive} from '#app/models/user/user.util'

import {GameModel} from '#app/models/game/game.model'
import {isGameActive} from '#app/models/game/game.util'

import {TransactionModel} from '#app/models/transaction/transaction.model'

export class AspectService {
  // Проверка на существование активной игры
  // static async hasGameActive(gameId) {
  //     const [[game]] = await txn.query < GameInfo[] > (
  //         getGameInfo, [dto.gameId]
  //     );

  //     return (game && game.active && !game.deleted)
  // }

  // static async hasValidUser(userId) {
  //     const [[user]] = await txn.query(
  //         getUserInfo, [dto.userId]
  //     );

  //     const isValid = (user && user.active && !user.deleted);
  //     return this.hasUserActiveParents(user.parentId);
  // }

  // static async hasUserActiveParents(parentId) {
  //     return await checkParentRecursive(user.parentId, trx);
  // }

  static async gameInit() {

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

    const txn = await dbConnection.getConnection()

    // res.status(200).json(response).end()
    // console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Debit4#####', req.path, JSON.stringify(req.body), JSON.stringify(response))

    const user = UserModel.getUserInfo(userId)
    if (!isUserActive(user)) {
      throw new errors.InvalidPlayerError()
    }

    // res.status(200).json(response).end()
    // console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Debit8#####', req.path, JSON.stringify(req.body), JSON.stringify(response))

    if (user.balance < amount) {
      throw new errors.InsufficientFundsError()
    }

    // res.status(200).json(response).end()
    // console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Debit5#####', req.path, JSON.stringify(req.body), JSON.stringify(response))

    const status = user.status
    if (status) {
      if (status.transactions || status.casino) {
        throw new errors.InsufficientFundsError()
      }
    }

    // res.status(200).json(response).end()
    // console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Debit3#####', req.path, JSON.stringify(req.body), JSON.stringify(response))

    const game = GameModel.getGameInfo(gameId)
    if (!isGameActive(game)) {
      throw new errors.InvalidGameError()
    }

    // res.status(500).end()
    // console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Debit1#####', req.path, JSON.stringify(req.body))

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
        // res.status(200).json(response).end()
        // console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Debit6#####', req.path, JSON.stringify(req.body), JSON.stringify(response))
        return
      }

      const isWageringBalanceValid = await handleWageringBalanceV2(wPool, wageringBalanceId, user, conversion.rate)

      if (!isWageringBalanceValid) {
        const response = {
          error: 'Global error.',
          errorCode: 1008,
        }

        await txn.rollback()
        // res.status(200).json(response).end()
        // console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Debit7#####', req.path, JSON.stringify(req.body), JSON.stringify(response))

      }

    } catch (error) {

    } finally {

    }
  }
}