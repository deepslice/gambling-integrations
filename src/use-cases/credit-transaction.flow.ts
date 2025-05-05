// use-cases/credit-transaction.flow.ts
import { Pool, RowDataPacket } from 'mysql2/promise'

import { IUserInfo } from '@/common/ifaces/user-info.iface';

interface UserInfo extends IUserInfo, RowDataPacket {};

// TODO: (maybe)
export class TransactionExecutor {
    constructor(

    ) {}
}

const sqlGetUserInfo = `
SELECT id                        AS id
    , balance                    AS balance
    , balance                    AS nativeBalance
    , real_balance               AS realBalance
    , username                   AS username
    , currency                   AS currency
    , currency                   AS nativeCurrency
    , active                     AS active
    , deleted                    AS deleted
    , unix_timestamp(created_at) AS createdAt
FROM users
WHERE id = ? FOR UPDATE`;

/**
 * creditTransactionFlow
 * ...
 * @param connPool 
 * @returns 
 */
export async function creditTransactionFlow(connPool: Pool) {
    const connection = await connPool.getConnection();
    try {
        await connection.beginTransaction()

        const [ [ user ] ] = await connection.query<UserInfo[]>(
            sqlGetUserInfo, [userInfo.id]
        )

        if (!user) {
            const response = {
                error: 'Invalid Player',
                errorCode: 1001,
            }

            await connection.rollback()
            // res.status(200).json(response).end()
            // console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Credit1#####', req.path, JSON.stringify(req.body), JSON.stringify(response))
            return
        }

        const [ [ transaction ] ] = await connection.query(`
          select id as id
          from casino_transactions
          where transaction_id = concat(?, ?)
      `, [transactionId, ':WIN'])

        if (transaction) {
            await connection.rollback()
            // res.status(500).end()
            // console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Credit2#####', req.path, JSON.stringify(req.body))
            return
        }

        if (!game) {
            const response = {
                error: 'Invalid Game ID',
                errorCode: 1008,
            }

            await connection.rollback()
            // res.status(200).json(response).end()
            // console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Credit3#####', req.path, JSON.stringify(req.body), JSON.stringify(response))
            return
        }

        if (amount < 0) {
            await connection.rollback()
            // res.status(500).end()
            // console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Credit4#####', req.path, JSON.stringify(req.body))
            return
        }

        const [[checkBet]] = await connection.query(`
          select id as id
          from casino_transactions
          where transaction_id = concat(?, ?)
      `, [transactionId, ':BET'])

        if (!checkBet) {
            const response = {
                error: 'Could Not Credit After Debit',
                errorCode: 1024,
            }

            await connection.rollback()
            // res.status(200).json(response).end()
            // console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Credit5#####', req.path, JSON.stringify(req.body), JSON.stringify(response))
            return
        }

        user.convertedAmount = amount

        const conversion = await convertCurrencyForUserV2(convertCurrency, wPool, prefix, client, user, 1)

        if (!conversion.rate) {
            const response = {
                error: 'Global error.',
                errorCode: 1008,
            }

            await connection.rollback()
            // res.status(200).json(response).end()
            // console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Credit6#####', req.path, JSON.stringify(req.body), JSON.stringify(response))
            return
        }

        const isWageringBalanceValid = await handleWageringBalanceV2(wPool, wageringBalanceId, user, conversion.rate)

        if (!isWageringBalanceValid) {
            const response = {
                error: 'Global error.',
                errorCode: 1008,
            }

            await connection.rollback()
            // res.status(200).json(response).end()
            // console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Credit7#####', req.path, JSON.stringify(req.body), JSON.stringify(response))
            return
        }

        const [{ insertId: txId }] = await connection.query(`
          insert into casino_transactions (amount, transaction_id, player_id, action, aggregator, provider, game_id,
                                           currency, session_id, section, bet_transaction_id, round_id, freespin_id)
          values (?, concat(?, ?), ?, ?, ?, ?, ?, ?, ?, ?, concat(?, ?), ?, ?)
      `, [user.convertedAmount, transactionId, ':WIN', user.id, 'WIN', 'aspect',
        game.provider, game.uuid, user.nativeCurrency, token, game.section, transactionId, ':BET', transactionId, wageringBalanceId ? wageringBalanceId : null])

        if (convertCurrency) {
            await connection.query(`
            insert into casino_converted_transactions (id, amount, converted_amount, user_id, action, aggregator,
                                                       provider, uuid, currency, currency_to, rate)
            values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [txId, amount, user.convertedAmount, user.id, 2, 'aspect', game.provider, game.uuid, convertCurrency, user.nativeCurrency, conversion.rate])

        }

        await connection.query(`
          update casino_rounds
          set status     = 1
            , win_amount = ifnull(win_amount, 0) + ?
          where round_id = concat('ca:', ?)
      `, [user.convertedAmount, transactionId])

        // TODO: Redis
        const currencyRate = await client.get(`currency`).then(JSON.parse)

        // TODO: Здесь осознанно запрос из пула? Так он не в рамках транзакции!
        await pool.query(`
          update casino.restrictions
          set ggr = ggr + ? / ?
          where code = ?
      `, [amount, currencyRate[user.currency] || 1, game.providerUid])

        if (amount > 0) {
            await updateUserBalanceV2(trx, txId, prefix, transactionId, 'WIN', user, user.convertedAmount, game, conversion.rate, wageringBalanceId, 0)

            if (!wageringBalanceId) {
                const historyInfo = {
                    provider: game.provider,
                    aggregator: game.aggregator,
                    section: game.section,
                    uuid: game.uuid,
                    gameName: game.name,
                    transactionId: txId,
                    action: 'WIN',
                }

                await winLimitV2(trx, user, user.convertedAmount, project, historyInfo, conversion.rate)
                await balanceLimitV2(trx, user, project, historyInfo, conversion.rate)
            }
        }

        const response = {
            success: true,
            balance: fixNumber(user.balance),
        }

        await connection.commit()
        // res.status(200).json(response).end()
        // console.log(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Credit(ok)#####', req.path, JSON.stringify(req.body), JSON.stringify(response))
        return
    } catch (error) {
        // console.error(getCurrentDatetime(), e)
        await connection.rollback()
    } finally {
        await connection.end()
    }
}
