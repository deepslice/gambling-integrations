export async function balanceHistory(trx, user, amount, rate, type, info, real = 0) {
  const [[final]] = await trx.query(`
      select cast((balance / ?) as float)  as balance
           , balance      as nativeBalance
           , real_balance as realBalance
      from users
      where id = ?
  `, [rate, user.id])

  const balanceHistory = {
    balanceBefore: user.nativeBalance,
    balanceAfter: final.nativeBalance,
    realBalance: real ? final.realBalance : undefined,
  }

  info.rate = rate

  await trx.query(`
      insert into balance_history (user_id, type, amount, balance, info)
      values (?, ?, ? * ?, ?, ?)
  `, [user.id, type, amount, rate, JSON.stringify(balanceHistory), JSON.stringify(info)])

  user.balance = final.balance
  user.nativeBalance = final.nativeBalance
}
