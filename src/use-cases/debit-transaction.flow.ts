// use-cases/debit-transaction.flow.ts

import { Pool, RowDataPacket } from 'mysql2/promise'

import { DebitRequestDto } from '@/providers/aspect/src/dto';

import { IUserInfo } from '@/common/ifaces/user-info.iface';
import { IGameInfo } from '@/common/ifaces/game-info.iface';

interface UserInfo extends IUserInfo, RowDataPacket { };
interface GameInfo extends IGameInfo, RowDataPacket { };

// TODO: (maybe)
export class TransactionExecutor {
    constructor(

    ) { }
}

const getUserInfo = `
          select id                                      as id
               , balance                                 as balance
               , balance                                 as nativeBalance
               , real_balance                            as realBalance
               , json_extract(options, '$.transactions') as status
               , username                                as username
               , agent_id                                as parentId
               , currency                                as currency
               , currency                                as nativeCurrency
               , active                                  as active
               , deleted                                 as deleted
               , unix_timestamp(created_at)              as createdAt
          from users
          where id = ? for
          update`;

const getGameInfo = `
        select g.uuid                      as uuid
             , g.provider                  as provider
             , g.aggregator                as aggregator
             , g.site_section              as section
             , g.name                      as name
             , g.provider_uid              as providerUid
             , final_game_id               as finalGameId
             , ifnull(cg.active, g.active) as active
             , deleted                     as deleted
        from casino.games g
                 left join casino_games cg on g.uuid = cg.uuid
        where g.uuid = concat('as:', ?)
          and aggregator = 'aspect'`;

const isTransactionExist = `
SELECT id AS id
FROM casino_transactions
WHERE transaction_id = concat(?, ?)`;

const insertTransaction = `
insert into casino_transactions (amount, transaction_id, player_id, action, aggregator, provider, game_id,
    currency, session_id, section, round_id, freespin_id)
values (?, concat(?, ?), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

const insertConvertedTransaction = `
insert into casino_converted_transactions (id, amount, converted_amount, user_id, action, aggregator,
    provider, uuid, currency, currency_to, rate)
values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

const insertCasinoRounds = `
insert into casino_rounds(bet_amount, win_amount, round_id, user_id, aggregator, provider, uuid,
    currency, additional_info)
values (?, 0, concat('ca:', ?), ?, ?, ?, ?, ?, ?)
on duplicate key update bet_amount = bet_amount + ?`;

const getCasinoLimits = `
select bet_limit as betLimit
from casino.limits
where project_id = ?`

const getCasinoRestrictions = `
select ggr * ? as ggr, 
if(max_ggr is not null, max_ggr - ggr, 1) as difference
from casino.restrictions
where code = ?`

const updateCasinoLimits = `
update casino.limits
set bet_limit = bet_limit - ?
where project_id = ?`

const updateCasinoRestrictions = `
update casino.restrictions
set ggr = ggr - ? / ?
where code = ?`;

/**
 * debitTransactionFlow
 * ...
 * @param dto
 * @param connPool 
 * @returns 
 */

// TODO: Move to Aspect/
export async function debitTransactionFlow(dto: DebitRequestDto, connPool: Pool) {
    const txn = await connPool.getConnection();

    const [[game]] = await txn.query<GameInfo[]>(
        getGameInfo, [dto.gameId]
    );

    try {
        await txn.beginTransaction();

        const [[user]] = await txn.query<UserInfo[]>(
            getUserInfo, [dto.userId]
        );

        const [[hasTransaction]] = await txn.query<RowDataPacket[]>(
            isTransactionExist, [dto.transactionKey, ':BET']
        );

        if (hasTransaction) {
            await txn.rollback();
            // res.status(500).end()
            // console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Debit1#####', req.path, JSON.stringify(req.body))
            return;
        }

        if (dto.amount < 0) {
            await txn.rollback();
            // res.status(500).end()
            // console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Debit2#####', req.path, JSON.stringify(req.body))
            return;
        }

        if (!game || !game.active || game.deleted) {
            const response = {
                error: 'Invalid Game ID',
                errorCode: 1008,
            }

            await txn.rollback();
            // res.status(200).json(response).end()
            // console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Debit3#####', req.path, JSON.stringify(req.body), JSON.stringify(response))
            return;
        }

        const parentActive = user && user.active && !user.deleted && await checkParentRecursive(user.parentId, trx)

        if (!user || !parentActive) {
            const response = {
                error: 'Invalid Player',
                errorCode: 1,
            }

            await txn.rollback()
            // res.status(200).json(response).end()
            // console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Debit4#####', req.path, JSON.stringify(req.body), JSON.stringify(response))
            return
        }

        if (user.status) {
            const status = user.status;
            if (status.transactions || status.casino) {
                const response = {
                    error: 'Insufficient Funds',
                    errorCode: 1003,
                }

                await txn.rollback();
                // res.status(200).json(response).end()
                // console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Debit5#####', req.path, JSON.stringify(req.body), JSON.stringify(response))
                return;
            }
        }

        user.convertedAmount = amount;

        const conversion = await convertCurrencyForUserV2(convertCurrency, wPool, prefix, client, user, 1);

        if (!conversion.rate) {
            const response = {
                error: 'Global error.',
                errorCode: 1008,
            }

            await txn.rollback();
            // res.status(200).json(response).end()
            // console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Debit6#####', req.path, JSON.stringify(req.body), JSON.stringify(response))
            return;
        }

        const isWageringBalanceValid = await handleWageringBalanceV2(wPool, wageringBalanceId, user, conversion.rate);

        if (!isWageringBalanceValid) {
            const response = {
                error: 'Global error.',
                errorCode: 1008,
            }

            await txn.rollback();
            // res.status(200).json(response).end()
            // console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Debit7#####', req.path, JSON.stringify(req.body), JSON.stringify(response))
            return;
        }

        if (user.balance < dto.amount) {
            const response = {
                error: 'Insufficient Funds',
                errorCode: 1003,
            }

            await txn.rollback();
            // res.status(200).json(response).end()
            // console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Debit8#####', req.path, JSON.stringify(req.body), JSON.stringify(response))
            return;
        }

        // TODO: Redis
        const currencyRate = await client.get(`currency`).then(JSON.parse);

        // TODO: Здесь осознанно запрос из пула? Так он не в рамках транзакции!
        const [[restrictions]] = await connPool.query(
            getCasinoRestrictions, 
            [currencyRate[user.currency] || 1, game.providerUid]
        );

        if (!restrictions || restrictions.ggr < dto.amount || restrictions.difference <= 0) {
            const response = {
                error: 'Insufficient Funds',
                errorCode: 1003,
            }

            await txn.rollback()
            // res.status(200).json(response).end()
            // console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Debit9#####', req.path, JSON.stringify(req.body), JSON.stringify(response))
            return
        }

        // TODO: Здесь осознанно запрос из пула? Так он не в рамках транзакции!
        const [[limit]] = await connPool.query(
            getCasinoLimits, [project.id]
        );

        if (!limit || limit.betLimit < 0) {
            const response = {
                error: 'Insufficient Funds',
                errorCode: 1003,
            }

            await txn.rollback();
            // res.status(200).json(response).end()
            // console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Debit10#####', req.path, JSON.stringify(req.body), JSON.stringify(response))
            return;
        }

        const betLimit = await getBetLimit(pool, prefix, game);

        if (betLimit && betLimit < user.convertedAmount) {
            const response = {
                error: 'Insufficient Funds',
                errorCode: 1003,
            }

            await txn.rollback();
            // res.status(200).json(response).end()
            // console.error(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Debit11#####', req.path, JSON.stringify(req.body), JSON.stringify(response))
            return;
        }

        const [{ insertId: txId }] = await txn.query(
            insertTransaction, 
            [
                user.convertedAmount, 
                dto.transactionKey, 
                ':BET', 
                user.id, 
                'BET', 
                'aspect',
                game.provider, 
                game.uuid, 
                user.nativeCurrency, 
                dto.token, 
                game.section, 
                dto.transactionKey, 
                wageringBalanceId ? wageringBalanceId : null
            ]
        );

        if (convertCurrency) {
            await txn.query(
                insertConvertedTransaction, 
                [
                    txId, 
                    -dto.amount, 
                    -user.convertedAmount, 
                    user.id, 
                    1, 
                    'aspect', 
                    game.provider, 
                    game.uuid, 
                    convertCurrency, 
                    user.nativeCurrency, 
                    conversion.rate
                ]
            );
        }

        await txn.query(
            insertCasinoRounds, 
            [
                user.convertedAmount, 
                dto.transactionKey, 
                user.id, 
                'caleta', 
                game.provider, 
                game.uuid, 
                user.nativeCurrency, 
                wageringBalanceId ? JSON.stringify({ wageringBalanceId }) : null, 
                user.convertedAmount
            ]
        );

        await txn.query(
            updateCasinoLimits, 
            [user.convertedAmount, project.id]
        );

        // TODO: Здесь осознанно запрос из пула? Так он не в рамках транзакции!
        await connPool.query(
            updateCasinoRestrictions, 
            [dto.amount, currencyRate[user.currency] || 1, game.providerUid]
        );

        await updateUserBalanceV2(trx, txId, prefix, transactionId, 'BET', user, -user.convertedAmount, game, conversion.rate, wageringBalanceId, 1);

        const response = {
            success: true,
            balance: fixNumber(user.balance),
        }

        await txn.commit();
        // res.status(200).json(response).end()
        // console.log(getCurrentDatetime(), `#${req._id}`, Date.now() - req._tm, '#####Debit(ok)#####', req.path, JSON.stringify(req.body), JSON.stringify(response))
        return;
    } catch (error) {
        // console.error(getCurrentDatetime(), e)
        await txn.rollback();
    } finally {
        // TODO: or txn.end() ?
        txn.release();
    }
}
