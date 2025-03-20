import {balanceHistoryV2} from './balance-history-v2.js'
export async function balanceLimitV2(trx, user, settings, info, rate) {
  if (!settings.balanceLimit) {
    return
  }

  if (user.balance <= settings.balanceLimit) {
    return
  }

  const [[limitDrop]] = await trx.query(`
      select greatest(0, balance - ?) as amount
      from users
      where id = ?
  `, [settings.balanceLimit, user.id])

  const drop = limitDrop.amount

  if (drop <= 0) {
    return
  }

  await trx.query(`
      update users
      set balance = balance - ?
      where id = ?
  `, [drop, user.id])

  info.action = 'DROP'

  await balanceHistoryV2(trx, user, -drop, 11, rate, info)
}
