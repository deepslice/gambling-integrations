import {balanceHistoryV2} from './balance-history-v2.js'

export async function winLimitV2(trx, user, amount, settings, info, rate) {
  if (!settings.winLimit) {
    return
  }

  if (amount - settings.winLimit < -1) {
    return
  }

  const [[limitDrop]] = await trx.query(`
      select greatest(0, ? - ?) as amount
      from users
      where id = ?
  `, [amount, settings.winLimit, user.id])

  const winDrop = limitDrop.amount

  if (winDrop <= 0) {
    return
  }

  await trx.query(`
      update users
      set balance = balance - ?
      where id = ?
  `, [winDrop, user.id])

  const [{insertId: tId}] = await trx.query(`
      insert into drop_history(uuid, user_id, amount)
      values (?, ?, ?)
  `, [info.uuid, user.id, winDrop])

  info.action = 'WIN_DROP'
  info.dropId = tId

  await balanceHistoryV2(trx, user, -winDrop, 13, rate, info)
}
