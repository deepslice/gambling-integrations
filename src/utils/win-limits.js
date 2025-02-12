import {balanceHistory} from './balance-history.js'
import {pool} from '../wallet/pool.js'

export async function winLimit(trx, user, amount, prefix, rate, info) {
  const [[maxWin]] = await pool.query(`
      select value as value
      from global.configurations
      where code = 'win_limit'
        and prefix = ?
  `, [prefix])

  if (!maxWin) {
    return
  }

  if (amount * rate - Number(maxWin.value) < -1) {
    return
  }

  const [[limitDrop]] = await trx.query(`
      select greatest(0, ? * ? - ?) as amount
      from users
      where id = ?
  `, [amount, rate, Number(maxWin.value), user.id])

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

  await balanceHistory(trx, user, -winDrop, rate, 13, info, 1)
}
