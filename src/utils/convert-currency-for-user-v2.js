export async function convertCurrencyForUserV2(convertCurrency, trx, prefix, client, user, rate) {
  if (convertCurrency) {
    rate = await client.get(`exchange-rate:${user.currency}:to:${convertCurrency}:${prefix}`).then(Number)

    if (!rate) {
      return {convertCurrency, rate: null}
    }

    const [[userBalance]] = await trx.query(`
        select ? / ? as balance
             , ? * ? as convertedAmount
        from users
        where id = ?
    `, [user.balance, rate, user?.convertedAmount || 0, rate, user.id])

    user.balance = userBalance.balance
    user.convertedAmount = userBalance.convertedAmount
    user.currency = 'USD'
  }

  return {convertCurrency, rate}
}
