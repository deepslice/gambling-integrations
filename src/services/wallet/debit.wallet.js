import {currencyConverterService} from '#app/modules/currency/converter.service'
import {wageringService} from '#app/modules/wagering/wagering.service'

import {userRepository} from '#app/repositories/user/user.model'
import {gameRepository} from '#app/repositories/game/game.model'
import {transactionRepository} from '#app/repositories/transaction/transaction.model'
import {roundRepository} from '#app/repositories/round/round.model'
import {limitsRepository} from '#app/repositories/limits/limits.model'
import {restrictsRepository} from '#app/repositories/restrictions/restrictions.model'

import {isGameActive, isUserActive} from '#app/utils/common.util'
import {assertField} from '#app/utils/assert.util'
import * as errors from '#app/utils/exceptions.util'

/**
 * debit
 * @param session
 * @param gameId
 * @param amount
 * @returns {Promise<void>}
 */
export async function transaction(session, gameId, amount) {
  const userId = assertField(session, 'userId')
  const prefix = assertField(session, 'prefix')
  const wageringBalanceId = assertField(session, 'wageringBalanceId')

  if (amount < 0) {
    throw new Error('Bet amount must be greater than 0')
  }

  let isBet = true
  if (await this.transactionRepository.hasBetTransaction()) {
    isBet = false
  }

  // 1. Проверяем наличие активного пользователя с данным userId
  const user = await userRepository.getUserInfo(userId)
  if (!isUserActive(user)) {
    throw new Error('User not found or invalid')
  }

  if (user.balance < amount) {
    throw new Error('Insufficient funds')
  }

  // 2. Проверяем наличие активной игры с данным gameId
  const game = await gameRepository.getGameInfo(gameId)
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

  // TODO: Refactor it
  user.rate = 1

  // 3. Конвертируем валюту пользователя, при необходимости
  const convertSettings = await currencyConverterService.getConvertSettings(prefix)
  if (convertSettings) {

    const currencyFrom = assertField(user, 'currency')
    const currencyTo = assertField(convertSettings, 'currency')

    const convertedBalance = await currencyConverterService.convert(
      currencyFrom,
      currencyTo,
      prefix,
    )

    user.rate = convertedBalance.rate
    user.balance = convertedBalance.balance
    user.convertedAmount = convertedBalance.convertedAmount
    user.currency = 'USD' // TODO: Move to constants
  }

  // 4. Применяем игровые бонусы
  if (wageringBalanceId) {
    const wBalance = await wageringService.getWageringBalance(
      userId,
      wageringBalanceId,
      user.rate,
    )

    user.balance = wBalance || user.balance
  }

  // 6. Сохраняем транзакцию в базу данных
  const [{insertId: txId}] = await transactionRepository.insertTransaction({
    amount: user.convertedAmount,
    transactionId: transactionId,
    playerId: user.id,
    action: isBet ? 'BET' : 'WIN',
    aggregator: 'aspect',
    provider: game.provider,
    gameId: game.uuid,
    currency: user.nativeCurrency,
    sessionId: context.sessionToken,
  })

  // Если была конвертация валюты, то сохраняем ее в отдельную транзакцию
  if (convertSettings?.currency) {
    await transactionRepository.insertConvertedTransaction({
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
  await roundRepository.insertRound({
    gameId: game.uuid,
    playerId: user.id,
    amount: user.convertedAmount,
    action: 'BET',
    aggregator: 'aspect',
    provider: game.provider,
    sessionId: context.sessionToken,
  })

  // 8. Обновляем лимиты пользователя
  await limitsRepository.updateLimits({
    playerId: user.id,
    gameId: game.uuid,
    action: 'BET',
    amount: user.convertedAmount,
  })
  await restrictsRepository.updateRestrictions({
    playerId: user.id,
    gameId: game.uuid,
    action: 'BET',
  })

  // 9. Обновляем баланс пользователя
  if (wageringBalanceId) {
    // Обновляем игровой баланс пользователя
    await wageringService.updateWageringBalance()
  } else {
    // Обновляем реальный баланс пользователя
    await userRepository.updateBalance(user)
  }

}
