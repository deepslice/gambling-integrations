export async function balanceHistoryV2(trx, user, amount, type, rate, info, real = 0) {
  const [[final]] = await trx.query(`
      select balance / ?  as balance
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

  await trx.query(`
      insert into balance_history (user_id, type, amount, balance, info)
      values (?, ?, ?, ?, ?)
  `, [user.id, type, amount, JSON.stringify(balanceHistory), JSON.stringify(info)])

  user.balance = final.balance
  user.nativeBalance = final.nativeBalance
}
