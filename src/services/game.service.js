import {AuthStore} from '#app/modules/auth/auth.store'
import {UserModel} from '#app/models/user/user.model'
import {isUserActive} from '#app/models/user/user.util'
import {GameModel} from '#app/models/game/game.model'
import {isGameActive} from '#app/models/game/game.util'
import {TransactionModel} from '#app/models/transaction/transaction.model'
import {randomBytes} from 'node:crypto'
import * as errors from '../utils/exceptions.util'
import {CurrencyConverterService} from '#app/modules/currency/converter.service'
import {WageringService} from '#app/modules/wagering/wagering.service'
import {fixNumber} from '#app/utils/math'
import {assertField} from '#app/utils/assert.util'

const sessionTTLSeconds = 30 * 60 * 60

export class GameService {
  constructor(
    userRepository = UserModel,
    gameRepository = GameModel,
    currencyService = new CurrencyConverterService(),
    wageringService = new WageringService(),
  ) {
    this.userRepository = userRepository
    this.gameRepository = gameRepository
    this.currencyService = currencyService
    this.wageringService = wageringService
  }

  static async transaction(context, userId, gameId, transactionId, amount) {
    if (amount < 0) {
      throw new Error('Bet amount must be greater than 0')
    }

    const [{id: existedId}] = await TransactionModel.getTransactionIdBet(transactionId)
    if (existedId) {
      return new Error('Transaction already exists')
    }

    // 1. Проверяем наличие активного пользователя с данным userId
    const user = UserModel.getUserInfo(userId)
    if (!isUserActive(user)) {
      throw new Error('Player not found or invalid')
    }

    if (user.balance < amount) {
      throw new Error('Insufficient funds')
    }

    // 2. Проверяем наличие активной игры с данным gameId
    const game = GameModel.getGameInfo(gameId)
    if (!isGameActive(game)) {
      throw new Error('Game not found or invalid')
    }

    // TODO: Refactor it
    const status = user.status
    if (status) {
      if (status.transactions || status.casino) {
        throw new errors.InsufficientFundsError()
      }
    }

    user.convertedAmount = amount

    // 3. Конвертируем валюту пользователя, при необходимости
    const convertSettings = await this.currencyService.getConvertSettings(context.prefix)
    const convertedBalance = await this.currencyService.convert(
      user.currency, convertSettings?.currency, context.prefix,
    )

    assertField(convertedBalance, 'rate')
    user.balance = convertedBalance.balance
    user.convertedAmount = convertedBalance.convertedAmount
    user.currency = 'USD' // TODO: Move to constants

    // 4. Применяем игровые бонусы
    if (context.wageringBalanceId) {
      const wBalance = await this.wageringService.getWageringBalance(
        userId,
        context.wageringBalanceId,
        convertedBalance.rate,
      )

      user.balance = wBalance || user.balance
    }

    // TODO: Сравнить с flow
    // 5. Применяем изменения к пользователю
    await UserModel.update(user)

    // 6. Сохраняем транзакцию в базу данных

    // const [{insertId: txId}] = await trx.query(`
    //       insert into casino_transactions (amount, transaction_id, player_id, action, aggregator, provider, game_id,
    //                                        currency, session_id, section, round_id, freespin_id)
    //       values (?, concat(?, ?), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    //   `, [user.convertedAmount, transactionId, ':BET', user.id, 'BET', 'aspect',
    //   game.provider, game.uuid, user.nativeCurrency, token, game.section, transactionId, wageringBalanceId ? wageringBalanceId : null])

    // if (convertCurrency) {
    //   await trx.query(`
    //         insert into casino_converted_transactions (id, amount, converted_amount, user_id, action, aggregator,
    //                                                    provider, uuid, currency, currency_to, rate)
    //         values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    //     `, [txId, -amount, -user.convertedAmount, user.id, 1, 'aspect', game.provider, game.uuid, convertCurrency, user.nativeCurrency, conversion.rate])
    // }

    // await trx.query(`
    //       insert into casino_rounds(bet_amount, win_amount, round_id, user_id, aggregator, provider, uuid,
    //                                 currency, additional_info)
    //       values (?, 0, concat('ca:', ?), ?, ?, ?, ?, ?, ?)
    //       on duplicate key update bet_amount = bet_amount + ?
    //  `, [user.convertedAmount, transactionId, user.id, 'caleta', game.provider, game.uuid, user.nativeCurrency, wageringBalanceId ? JSON.stringify({wageringBalanceId}) : null, user.convertedAmount])

    // await trx.query(`
    //       update casino.limits
    //       set bet_limit = bet_limit - ?
    //       where project_id = ?
    //   `, [user.convertedAmount, project.id])

    // await pool.query(`
    //       update casino.restrictions
    //       set ggr = ggr - ? / ?
    //       where code = ?
    //   `, [amount, currencyRate[user.currency] || 1, game.providerUid])

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

  async getBalance(context, userId, gameId) {
    // 1. Проверяем наличие активной игры с данным gameId
    const game = this.gameRepository.getGameInfo(gameId)
    if (!isGameActive(game)) {
      throw new Error('Game not found or invalid')
    }

    // 2. Проверяем наличие активного пользователя с данным userId
    const user = this.userRepository.getUserInfo(userId)
    if (!isUserActive(user)) {
      throw new Error('Player not found or invalid')
    }

    // 3. Конвертируем валюту пользователя, при необходимости
    const convertSettings = await this.currencyService.getConvertSettings(context.prefix)
    const convertedBalance = await this.currencyService.convert(
      user.currency,
      convertSettings?.currency,
      context.prefix,
    )

    user.balance = convertedBalance.balance
    user.convertedAmount = convertedBalance.convertedAmount
    user.currency = 'USD' // TODO: Move to constants

    // 4. Применяем игровые бонусы
    if (context.wageringBalanceId) {
      const wBalance = await this.wageringService.getWageringBalance(
        userId,
        context.wageringBalanceId,
        convertedBalance.rate,
      )

      user.balance = wBalance || user.balance
    }

    // TODO: Сравнить с flow, возможно сохранять не нужно
    // 5. Применяем изменения к пользователю
    await this.userRepository.update(user)

    // 6. Возвращаем актуальный баланс
    return fixNumber(user.balance)
  }

  async depositFunds(context, userId, gameId, amount) {
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
