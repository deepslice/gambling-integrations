import {CurrencyConverterService} from '#app/modules/currency/converter.service'
import {WageringService} from '#app/modules/wagering/wagering.service'

import {UserModel as UserRepository} from '#app/repositories/user/user.model'
import {LimitsModel as LimitRepository} from '#app/repositories/limits/limits.model'
import {RestrictsModel as RestrictsRepository} from '#app/repositories/restrictions/restrictions.model'
import {GameModel as GameRepository} from '#app/repositories/game/game.model'
import {RoundModel as RoundRepository} from '#app/repositories/round/round.model'
import {TransactionModel as TransactionRepository} from '#app/repositories/transaction/transaction.model'

import * as errors from '#app/utils/exceptions.util'
import {isGameActive, isUserActive} from '#app/utils/common.util'
import {assertField} from '#app/utils/assert.util'
import {fixNumber} from '#app/utils/math.util'

export class WalletService {

  constructor(
    userRepository = new UserRepository(),
    gameRepository = new GameRepository(),
    roundRepository = new RoundRepository(),
    transactionRepository = new TransactionRepository(),
    limitRepository = new LimitRepository(),
    restrictsRepository = new RestrictsRepository(),
    currencyService = new CurrencyConverterService(),
    wageringService = new WageringService(),
  ) {
    this.userRepository = userRepository
    this.gameRepository = gameRepository
    this.roundRepository = roundRepository
    this.transactionRepository = transactionRepository
    this.limitRepository = limitRepository
    this.restrictsRepository = restrictsRepository
    this.currencyService = currencyService
    this.wageringService = wageringService
  }

  async transaction(context, userId, gameId, roundId, amount, isBet = true) {
    if (amount < 0) {
      throw new Error('Bet amount must be greater than 0')
    }

    if (await this.transactionRepository.hasBetTransaction()) {
      isBet = false
    }

    // this.transactionRepository.hasWinTransaction()

    // const [{id: existedId}] = await TransactionModel.getTransactionIdBet(transactionId)
    // if (existedId) {
    //   return new Error('Transaction already exists')
    // }

    // 1. Проверяем наличие активного пользователя с данным userId
    const user = await this.userRepository.getUserInfo(userId)
    if (!isUserActive(user)) {
      throw new Error('Player not found or invalid')
    }

    if (user.balance < amount) {
      throw new Error('Insufficient funds')
    }

    // 2. Проверяем наличие активной игры с данным gameId
    const game = await this.gameRepository.getGameInfo(gameId)
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
    const [{insertId: txId}] = await this.transactionRepository.insertTransaction({
      amount: user.convertedAmount,
      transactionId: transactionId,
      playerId: user.id,
      action: 'BET',
      aggregator: 'aspect',
      provider: game.provider,
      gameId: game.uuid,
      currency: user.nativeCurrency,
      sessionId: context.sessionToken,
    })

    // Если была конвертация валюты, то сохраняем ее в отдельную транзакцию
    if (convertSettings?.currency) {
      await this.transactionRepository.insertConvertedTransaction({
        id: txId,
        amount: -amount,
        convertedAmount: -user.convertedAmount,
        userId: user.id,
        action: 1,
        aggregator: 'aspect',
        provider: game.provider,
        uuid: game.uuid,
        currency: convertCurrency,
      })
    }

    // 7. Открываем раунд
    // TODO: this.roundService.openRound(game.uuid, user.id)
    await this.roundRepository.insertRound({
      gameId: game.uuid,
      playerId: user.id,
      amount: user.convertedAmount,
      action: 'BET',
      aggregator: 'aspect',
      provider: game.provider,
      sessionId: context.sessionToken,
    })

    // 8. Обновляем лимиты пользователя
    await this.limitRepository.updateLimits({
      playerId: user.id,
      gameId: game.uuid,
      action: 'BET',
      amount: user.convertedAmount,
    })

    await this.restrictsRepository.updateRestrictions({
      playerId: user.id,
      gameId: game.uuid,
      action: 'BET',
    })

    // 9. Обновляем баланс пользователя
    if (context.wageringBalanceId) {
      // Обновляем игровой баланс пользователя
      await this.wageringService.updateWageringBalance()
    } else {
      // Обновляем реальный баланс пользователя
      await this.userRepository.updateBalance(user)
    }
  }

  async getBalance(context, userId, gameId) {
    // 1. Проверяем наличие активного пользователя с данным userId
    const user = await this.userRepository.getUserInfo(userId)
    if (!isUserActive(user)) {
      throw new Error('User not found or invalid')
    }

    // 2. Проверяем наличие активной игры с данным gameId
    const game = await this.gameRepository.getGameInfo(gameId)
    if (!isGameActive(game)) {
      throw new Error('Game not found or invalid')
    }

    console.log('has valid user and game!')

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
    // await this.userRepository.update(user)

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
