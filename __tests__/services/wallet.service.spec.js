import {describe, expect, jest, test} from '@jest/globals'
import {GameService} from '#app/services/game.service'
import {fixNumber} from '#app/utils/math'

describe('Wallet Service', () => {
  // Инициализируем mocks
  const userRepositoryMock = {}
  userRepositoryMock.getUserInfo = jest.fn()

  // Инициализируем mocks
  const gameRepositoryMock = {}
  gameRepositoryMock.getGameInfo = jest.fn()

  // Инициализируем mocks
  const currencyServiceMock = {}
  currencyServiceMock.getConvertSettings = jest.fn()
  currencyServiceMock.convert = jest.fn()

  // Инициализируем mocks
  const wageringServiceMock = {}
  wageringServiceMock.getWageringBalance = jest.fn()

  // const context = {
  //   userRepository: userRepositoryMock,
  //   gameRepository: gameRepositoryMock,
  //   currencyService: currencyServiceMock,
  //   wageringService: wageringServiceMock,
  // }

  // Целевой сервис с внедренными mocks
  const walletService = new GameService(
    userRepositoryMock,
    gameRepositoryMock,
    currencyServiceMock,
    wageringServiceMock,
  )

  test('Get Balance', async () => {
    userRepositoryMock.getUserInfo = jest.fn(async () => {
      return {
        id: 1,
        balance: 100,
        convertedAmount: 100,
        currency: 'USD',
        active: true,
        deleted: false,
      }
    })

    gameRepositoryMock.getGameInfo = jest.fn(async () => {
      return {
        id: 1,
        provider: 'agp',
        providerUid: '12345',
        finalGameId: '12345',
        active: true,
        deleted: false,
      }
    })

    currencyServiceMock.getConvertSettings = jest.fn(async () => {
      return {
        rate: 1,
        currency: 'USD',
      }
    })
    currencyServiceMock.convert = jest.fn(async () => {
      return {
        rate: 1,
        currency: 'USD',
        balance: 100,
        convertedAmount: 100,
      }
    })

    // wageringServiceMock.getWageringBalance = jest.fn(async () => {
    // })

    const userId = 1
    const gameId = 1
    const context = {
      prefix: 'a',
      // wageringBalanceId: 1,
    }

    const balance = await walletService.getBalance(context, userId, gameId)
    expect(balance).toEqual(fixNumber(100))
  })
})
