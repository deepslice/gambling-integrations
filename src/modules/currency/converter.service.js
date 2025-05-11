import db from '#app/infrastructure/.deprecated/db.connection'
import {getRedisClient} from '#app/infrastructure/.deprecated/redis.connection'

export class CurrencyConverterService {
  static async convert(currency, convertCurrency, amount, prefix) {
    const rc = getRedisClient()
    const conn = db.getConnection()

    const rate = await rc.get(`exchange-rate:${currency}:to:${convertCurrency}:${prefix}`).then(Number)
    await conn.query(`
        select ? / ? as balance
             , ? * ? as convertedAmount
        from users
        where id = ?
    `, [amount, rate, amount, rate])


  }
}
