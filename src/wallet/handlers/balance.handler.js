import {getCurrentDatetime} from '../../utils/get-current-datetime.js'
import {pool} from '../pool.js'
import {getRedisClient} from '../../utils/redis.js'
import mysql2 from 'mysql2/promise'

export async function getBalanceHandler(req, res) {
  const token = req.query.token
  const client = await getRedisClient()

  const data = await client.get(`aspect-initial-token:${token}`).then(JSON.parse)

  if (!data) {
    res.status(200).json({
      'error': 'Invalid Token',
      'errorCode': 1002,
    }).end()
    console.error('data')
    return
  }

  await client.setEx(`aspect-initial-token:${token}`, 30 * 60 * 60, JSON.stringify(data))

  try {
    const [[project]] = await pool.query(`
        select id                                  as id
             , prefix                              as prefix
             , db_name                             as db
             , json_extract(configs, '$.currency') as currency
             , json_extract(configs, '$.database') as config
        from global.settings
        where prefix = ?
    `, [data.prefix])

    const [[bonus]] = await pool.query(`
        select cast(value as json) as value
        from global.configurations
        where code = 'plus_bonus'
          and prefix = ?
    `, [data.prefix])

    /** @type {mysql2.Connection} */
    const trx = await mysql2.createConnection(project.config)

    try {
      const [[user]] = await trx.query(`
          select id                                  as id,
                 balance                             as balance,
                 greatest(0, (balance - plus_bonus)) as realBalance,
                 currency                            as currency
          from users
          where id = ?
      `, [data.user.id])

      if (!user) {
        res.status(200).json({
          error: 'Invalid Player',
          errorCode: 1,
        }).end()
        console.error('user not found')
        return
      }

      if (bonus && !bonus.value['live-casino']) {
        user.balance = user.realBalance
      }

      let rate = 1

      if (user.currency === 'TOM') {
        rate = await client.get(`exchage-rate:tom:to:usd`).then(Number)

        const [[userBalance]] = await trx.query(`
            select id                                      as id,
                   balance / ?                             as balance,
                   greatest(0, (balance - plus_bonus)) / ? as realBalance
            from users
            where id = ?
        `, [rate, rate, user.id])

        if (bonus && !bonus.value['live-casino']) {
          userBalance.balance = userBalance.realBalance
        }

        user.balance = userBalance.balance
        user.currency = 'USD'
      }

      const response = {
        success: true,
        balance: user.balance,
      }


      res.status(200).json(response).end()
      return
    } catch (e) {
      console.error(getCurrentDatetime(), e)
    } finally {
      await trx.end()
    }
  } catch (e) {
    console.error(getCurrentDatetime(), e)
  }
  res.status(500).json({message: 'internal server error'}).end()
}