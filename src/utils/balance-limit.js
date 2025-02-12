import {balanceHistory} from './balance-history.js'
import {pool} from '../wallet/pool.js'

export async function balanceLimit(trx, user, rate, prefix, info) {
  const [[balanceLimit]] = await pool.query(`
      select value
      from global.configurations
      where code = 'balance_limit'
        and prefix = ?
  `, [prefix])

  if (!balanceLimit) {
    return
  }
  if (user.balance <= Number(balanceLimit.value)) {
    return
  }

  const [[limitDrop]] = await trx.query(`
      select greatest(0, balance - ?) as amount
      from users
      where id = ?
  `, [Number(balanceLimit.value), user.id])

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

  await balanceHistory(trx, user, -drop, rate, 11, info)
}
