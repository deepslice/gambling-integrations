import {balanceHistoryV2} from './balance-history-v2'
import {wbSendData} from './wb-send-data'

export async function updateUserBalanceV2(trx, trxId, prefix, round_id, action, user, amount, game, rate, wageringBalanceId, real) {
  if (wageringBalanceId) {
    if (amount !== 0) {
      await trx.query(`
          update wagering_balance
          set balance = balance + ?
          where id = ?
      `, [amount, wageringBalanceId])

      const [[after]] = await trx.query(`
          select balance / ? as balance
          from wagering_balance
          where id = ?
      `, [rate, wageringBalanceId])

      await trx.query(`
          insert into wagering_transactions (wagering_id, user_id, amount, balance_before, balance_after,
                                             reference)
          values (?, ?, ?, ? * ?, ? * ?, concat('cas:', ?))
      `, [wageringBalanceId, user.id, amount, user.balance, rate, after.balance, rate, trxId])

      if (amount > 0) {
        await wbSendData(prefix, user.id, round_id, wageringBalanceId)
      }

      user.balance = after.balance
    }
  } else {
    if (amount !== 0) {
      await trx.query(`
          update users
          set balance      = balance + ?,
              real_balance = real_balance + ?
          where id = ?
      `, [amount, real ? amount : 0, user.id])

      const historyInfo = {
        provider: game.provider,
        aggregator: game.aggregator,
        section: game.section,
        uuid: game.uuid,
        gameName: game.name,
        transactionId: trxId,
        action,
      }

      await balanceHistoryV2(trx, user, amount, 10, rate, historyInfo, real)
    }
  }
}
