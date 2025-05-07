import {getRedisClient} from '@/infrastructure/redis.connection.js'

export class ExchangeService {
  static async convertCurrency(currency, convertCurrency, prefix) {
    const rc = getRedisClient()
    const rate = await rc.get(`exchange-rate:${currency}:to:${convertCurrency}:${prefix}`).then(Number)


  }
}
