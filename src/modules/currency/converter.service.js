import redis from '#app/infrastructure/cache/index'
import {databaseConnection} from '#app/infrastructure/database/connection'
import {assertField} from '#app/utils/assert.util'

export class CurrencyConverterService {
  constructor(
    database = databaseConnection,
    cache = redis,
  ) {
    this.database = database
    this.cache = cache
    this.init()
  }

  init() {
  }

  async convert(currency, convertCurrency, amount, prefix) {
    const rate = await this.getRate(currency, convertCurrency, prefix)
    if (!rate) {
      return null
    }

    // Вычисляем результат в SQL для большей точности
    const [[userBalance]] = await this.database.query(`
        select ? / ? as balance
             , ? * ? as convertedAmount
        from users
        where id = ?
    `, [amount, rate, amount, rate])

    userBalance.rate = rate
    return userBalance
  }

  async getConvertSettings(prefix) {
    const [[convertSettings]] = await this.database.query(`
        select currency as currency
        from global.casino_convert_settings
        where prefix = ?
          and provider = 'aspect'
    `, [prefix])

    return assertField(convertSettings, 'currency')
  }

  async getRate(currency, convertCurrency, prefix) {
    return await this.cache.get(`exchange-rate:${currency}:to:${convertCurrency}:${prefix}`).then(Number)
  }

  async setRate(currency, convertCurrency, rate, prefix) {
    return await this.cache.set(`exchange-rate:${currency}:to:${convertCurrency}:${prefix}`, rate)
  }

  async deleteRate(currency, convertCurrency, prefix) {
    return await this.cache.del(`exchange-rate:${currency}:to:${convertCurrency}:${prefix}`)
  }

  async deleteAllRates(prefix) {
    return await this.cache.del(`exchange-rate:*:${prefix}`)
  }
}
