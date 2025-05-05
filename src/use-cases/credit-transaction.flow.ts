// use-cases/credit-transaction.flow.ts
import { Pool, RowDataPacket } from 'mysql2/promise'

import { CreditRequestDto } from '@/providers/aspect/src/dto';

import { IUserInfo } from '@/common/ifaces/user-info.iface';
import { IGameInfo } from '@/common/ifaces/game-info.iface';

interface UserInfo extends IUserInfo, RowDataPacket {};
interface GameInfo extends IGameInfo, RowDataPacket {};

// TODO: (maybe)
export class TransactionExecutor {
    constructor(

    ) {}
}

const getUserInfo = `
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

const getGameInfo = `
SELECT g.uuid        AS uuid
    , g.provider     AS provider
    , g.aggregator   AS aggregator
    , g.site_section AS section
    , g.name         AS name
    , g.provider_uid AS providerUid
FROM casino.games g
LEFT JOIN casino_games cg ON g.uuid = cg.uuid
WHERE g.uuid = concat('as:', ?) AND aggregator = 'aspect'`;

const isTransactionExist = `
SELECT id AS id
FROM casino_transactions
WHERE transaction_id = concat(?, ?)`;

const insertTransaction = `
INSERT INTO casino_transactions 
(
    amount, 
    transaction_id, 
    player_id, 
    action, 
    aggregator,
    provider, 
    game_id, 
    currency, 
    session_id, 
    section, 
    bet_transaction_id, 
    round_id, 
    freespin_id
)
VALUES (?, concat(?, ?), ?, ?, ?, ?, ?, ?, ?, ?, concat(?, ?), ?, ?)`;

const insertConvertedTransaction = `
INSERT INTO casino_converted_transactions 
(
    id, 
    amount, 
    converted_amount, 
    user_id, 
    action,
    aggregator, 
    provider, 
    uuid, 
    currency, 
    currency_to, 
    rate
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

const updateCasinoRounds = `
UPDATE casino_rounds
SET status = 1, win_amount = ifnull(win_amount, 0) + ?
WHERE round_id = concat('ca:', ?)`;

const updateCasinoRestrictions = `
UPDATE casino.restrictions
SET ggr = ggr + ? / ?
WHERE code = ?`;

/**
 * creditTransactionFlow
 * ...
 * @param connPool 
 * @returns 
 */

// TODO: Move to Aspect/
export async function creditTransactionFlow(dto: CreditRequestDto, connPool: Pool) {
    const connection = await connPool.getConnection();

    const [ [ game ] ] = await connection.query<GameInfo[]>(
        getGameInfo, [ dto.gameId ]
    );

    try {
        await connection.beginTransaction();

        const [ [ user ] ] = await connection.query<UserInfo[]>(
            getUserInfo, [ dto.userId ]
        );

        if (!user) {
            const response = {
                error: 'Invalid Player',
                errorCode: 1001,
            }

            await connection.rollback();
            // res.status(200).json(response).end()
            // console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Credit1#####', req.path, JSON.stringify(req.body), JSON.stringify(response))
            return;
        }

        const [ [ hasTransaction ] ] = await connection.query<RowDataPacket[]>(
            isTransactionExist, [dto.transactionKey, ':WIN']
        );

        if (hasTransaction) {
            await connection.rollback();
            // res.status(500).end()
            // console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Credit2#####', req.path, JSON.stringify(req.body))
            return;
        }

        if (!game) {
            const response = {
                error: 'Invalid Game ID',
                errorCode: 1008,
            }

            await connection.rollback();
            // res.status(200).json(response).end()
            // console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Credit3#####', req.path, JSON.stringify(req.body), JSON.stringify(response))
            return;
        }

        if (dto.amount < 0) {
            await connection.rollback();
            // res.status(500).end()
            // console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Credit4#####', req.path, JSON.stringify(req.body))
            return;
        }

        const [[ hasBet ]] = await connection.query<RowDataPacket[]>(
            isTransactionExist, [dto.transactionKey, ':BET']
        );

        if (!hasBet) {
            const response = {
                error: 'Could Not Credit After Debit',
                errorCode: 1024,
            }

            await connection.rollback();
            // res.status(200).json(response).end()
            // console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Credit5#####', req.path, JSON.stringify(req.body), JSON.stringify(response))
            return;
        }

        user.convertedAmount = dto.amount;

        const conversion = await convertCurrencyForUserV2(convertCurrency, wPool, prefix, client, user, 1)

        if (!conversion.rate) {
            const response = {
                error: 'Global error.',
                errorCode: 1008,
            }

            await connection.rollback();
            // res.status(200).json(response).end()
            // console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Credit6#####', req.path, JSON.stringify(req.body), JSON.stringify(response))
            return;
        }

        const isWageringBalanceValid = await handleWageringBalanceV2(wPool, wageringBalanceId, user, conversion.rate)

        if (!isWageringBalanceValid) {
            const response = {
                error: 'Global error.',
                errorCode: 1008,
            }

            await connection.rollback();
            // res.status(200).json(response).end()
            // console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Credit7#####', req.path, JSON.stringify(req.body), JSON.stringify(response))
            return;
        }

        const [{ insertId: txId }] = await connection.query(
            insertTransaction, 
            [
                user.convertedAmount, 
                dto.transactionKey, 
                ':WIN', 
                user.id, 
                'WIN', 
                'aspect',
                game.provider, 
                game.uuid, 
                user.nativeCurrency, 
                dto.token, 
                game.section, 
                dto.transactionKey, 
                ':BET', 
                dto.transactionKey, 
                wageringBalanceId ? wageringBalanceId : null
            ]
        );

        if (convertCurrency) {
            await connection.query(
                insertConvertedTransaction, 
                [
                    txId, 
                    dto.amount, 
                    user.convertedAmount, 
                    user.id, 
                    2, 
                    'aspect', 
                    game.provider, 
                    game.uuid, 
                    convertCurrency, 
                    user.nativeCurrency, 
                    conversion.rate
                ]
            );
        }

        await connection.query(
            updateCasinoRounds, 
            [user.convertedAmount, dto.transactionKey]
        );

        // TODO: Redis
        const currencyRate = await client.get(`currency`).then(JSON.parse);

        // TODO: Здесь осознанно запрос из пула? Так он не в рамках транзакции!
        await connPool.query(
            updateCasinoRestrictions,
            [dto.amount, currencyRate[user.currency] || 1, game.providerUid]
        );

        if (dto.amount > 0) {
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

        await connection.commit();
        // res.status(200).json(response).end()
        // console.log(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Credit(ok)#####', req.path, JSON.stringify(req.body), JSON.stringify(response))
        return;
    } catch (error) {
        // console.error(getCurrentDatetime(), e)
        await connection.rollback();
    } finally {
        await connection.end();
    }
}
