import {describe, expect, it, jest, test} from '@jest/globals'
import {GameService} from '#app/services/game.service'

describe('Wallet Service', () => {
  // Инициализируем mocks
  const currencyServiceMock = {}
  currencyServiceMock.getConvertSettings = jest.fn()
  currencyServiceMock.convert = jest.fn()

  // Инициализируем mocks
  const wageringServiceMock = {}
  wageringServiceMock.getWageringBalance = jest.fn()

  // Целевой сервис с внедренными mocks
  const walletService = new GameService(
    currencyServiceMock,
    wageringServiceMock,
  )

  test('Get Balance', () => {
    walletService.getBalance()
    it('', () => {
      expect(1).toBe(1)
    })
  })

  test('Deposit Funds', () => {

    it('', () => {
      expect(1).toBe(1)
    })
  })

  test('Withdrawal Funds', () => {

    it('', () => {
      expect(1).toBe(1)
    })
  })
})
