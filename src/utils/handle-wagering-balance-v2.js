export async function handleWageringBalanceV2(trx, wageringBalanceId, user, rate) {
  if (wageringBalanceId) {
    const [[wBalance]] = await trx.query(`
        select id                as id
             , balance / ?       as balance
        from wagering_balance
        where id = ?
          and user_id = ?
          and status = 1
          and free_spin = 0
          and (expires_at > now() or expires_at is null)
    `, [rate, wageringBalanceId, user.id])

    if (!wBalance) {
      return null
    }

    user.balance = wBalance.balance
  }

  return true
}
