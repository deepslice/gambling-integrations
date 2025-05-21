import {userRepository} from '#app/repositories/user/user.model'
import {gameRepository} from '#app/repositories/game/game.model'
import {currencyConverterService} from '#app/modules/currency/converter.service'
import {wageringService} from '#app/modules/wagering/wagering.service'
import {isGameActive, isUserActive} from '#app/utils/common.util'
import {assertField} from '#app/utils/assert.util'
import {fixNumber} from '#app/utils/math.util'

/**
 * getBalance
 * @param session
 * @param gameId
 * @returns {Promise<void>}
 */
export async function getBalance(session, gameId) {
  const userId = assertField(session, 'userId')
  const prefix = assertField(session, 'prefix')
  const wageringBalanceId = assertField(session, 'wageringBalanceId')

  // 1. Проверяем наличие активного пользователя с данным userId
  const user = await userRepository.getUserInfo(userId)
  if (!isUserActive(user)) {
    throw new Error('User not found or invalid')
  }

  // 2. Проверяем наличие активной игры с данным gameId
  const game = await gameRepository.getGameInfo(gameId)
  if (!isGameActive(game)) {
    throw new Error('Game not found or invalid')
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

  return fixNumber(user.balance)
}
