import {AuthStore} from '#app/modules/auth/auth.store'
import {UserModel} from '#app/models/user/user.model'
import {isUserActive} from '#app/models/user/user.util'
import {GameModel} from '#app/models/game/game.model'
import {isGameActive} from '#app/models/game/game.util'
import {TransactionModel} from '#app/models/transaction/transaction.model'
import {randomBytes} from 'node:crypto'
import * as errors from '../utils/exceptions.util'
import {CurrencyConverterService} from '#app/modules/currency/converter.service'

const sessionTTLSeconds = 30 * 60 * 60

export class GameService {
  constructor(
    currencyService = new CurrencyConverterService(),
  ) {
    this.currencyService = currencyService
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

  // TODO: Implement
  async gameInit(operatorId, gameId) {
    // Открываем сессию, записываем токен
    const token = randomBytes(36).toString('hex')
    await AuthStore.setSessionToken(token, {}, sessionTTLSeconds)

    const url = await axios.get(`https://eu.agp.xyz/agp-launcher/${gameId}/?token=${token}&operatorId=${operatorId}&language=en-US`).then(resp => {
      return resp.config.url || null
    }).catch((error) => {
      console.error('error ', error)
      return null
    })
  }

  async getBalance(gameId, userId, session) {
    // 1. Проверяем наличие активной игры с данным gameId
    const game = GameModel.getGameInfo(gameId)
    if (!isGameActive(game)) {
      throw new Error('Game not found or invalid')
    }

    // 2. Проверяем наличие активного пользователя с данным userId
    const user = UserModel.getUserInfo(userId)
    if (!isUserActive(user)) {
      throw new Error('Player not found or invalid')
    }

    // 3. Конвертируем валюту пользователя, при необходимости
    const convertSettings = await this.currencyService.getConvertSettings(session.prefix)
    const conversion = await this.currencyService.convert(
      user.currency,
      convertSettings?.currency,
      session.prefix,
    )
    // TODO: Implement
    UserModel.updateCurrency(conversion)

    // 4. Применяем игровые бонусы

    // const isWageringBalanceValid = await handleWageringBalanceV2(wPool, wageringBalanceId, user, conversion.rate)

    // if (!isWageringBalanceValid) {
    //   const response = {
    //     error: 'Global error.',
    //     errorCode: 1008,
    //   }
    //
    //   res.status(200).json(response).end()
    //   console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Balance4#####', req.path, JSON.stringify(req.body), JSON.stringify(response))
    //   return
    // }
  }

  async depositFunds(gameId, userId, amount) {
    // Проверяем наличие активной игры с данным gameId
    const game = GameModel.getGameInfo(gameId)
    if (!isGameActive(game)) {
      throw new Error('Game not found or invalid')
    }

    // Проверяем наличие активного пользователя с данным userId
    const user = UserModel.getUserInfo(userId)
    if (!isUserActive(user)) {
      throw new Error('Player not found or invalid')
    }

  }

  async withdrawalFunds(gameId, userId, amount) {
    // Проверяем наличие активной игры с данным gameId
    const game = GameModel.getGameInfo(gameId)
    if (!isGameActive(game)) {
      throw new Error('Game not found or invalid')
    }

    // Проверяем наличие активного пользователя с данным userId
    const user = UserModel.getUserInfo(userId)
    if (!isUserActive(user)) {
      throw new Error('Player not found or invalid')
    }

  }

  async rollback(gameId, userId) {
    // Проверяем наличие активной игры с данным gameId
    const game = GameModel.getGameInfo(gameId)
    if (!isGameActive(game)) {
      throw new Error('Game not found or invalid')
    }

    // Проверяем наличие активного пользователя с данным userId
    const user = UserModel.getUserInfo(userId)
    if (!isUserActive(user)) {
      throw new Error('Player not found or invalid')
    }

  }
}
