import {describe, expect, it, jest} from '@jest/globals'
import {WalletService} from '#app/services/wallet.service'
import {fixNumber} from '#app/utils/math.util'

describe('Wallet Service', () => {
  // Инициализируем mocks
  const userRepositoryMock = {}
  const gameRepositoryMock = {}
  const roundRepositoryMock = {}
  const transactionRepositoryMock = {}
  const limitsRepositoryMock = {}
  const restrictsRepositoryMock = {}
  const currencyServiceMock = {}
  const wageringServiceMock = {}

  // Целевой сервис с внедренными mocks
  const walletService = new WalletService(
    userRepositoryMock,
    gameRepositoryMock,
    roundRepositoryMock,
    transactionRepositoryMock,
    limitsRepositoryMock,
    restrictsRepositoryMock,
    currencyServiceMock,
    wageringServiceMock,
  )

  const userInfo = {
    id: 1,
    active: true,
    deleted: false,
  }

  const gameInfo = {
    id: 1,
    active: true,
    deleted: false,
  }

  const convertSettings = {
    rate: 1,
    currency: 'USD',
  }

  const userBalance = {
    rate: 1,
    balance: 100,
    currency: 'USD',
    convertedAmount: 100,
  }

  const wageringBalance = {
    balance: 150,
  }

  userRepositoryMock.getUserInfo = jest.fn(async (userId) => {
    return userInfo
  })

  gameRepositoryMock.getGameInfo = jest.fn(async (gameId) => {
    return gameInfo
  })

  currencyServiceMock.getConvertSettings = jest.fn(async (prefix) => {
    return convertSettings
  })

  currencyServiceMock.convert = jest.fn(async (currency, convertCurrency, amount, prefix) => {
    return userBalance
  })

  wageringServiceMock.getWageringBalance = jest.fn(async (userId, context, convertedBalance,
  ) => {
    return wageringBalance.balance
  })

  const userId = 1
  const gameId = 1
  const context = {
    prefix: 'a',
  }

  it('should return balance', async () => {
    // userBalance.balance = 150
    const balance = await walletService.getBalance(context, userId, gameId)
    expect(balance).toEqual(fixNumber(100))
  })

  it('should return wagering balance', async () => {
    context.wageringBalanceId = 1
    const balance = await walletService.getBalance(context, userId, gameId)
    expect(balance).toEqual(fixNumber(150))
  })
})
