import mysql2 from 'mysql2/promise'
import {CronJob} from 'cron'
import {getCurrentDatetime} from '../utils/get-current-datetime.js'
import {getGames} from '../api/get-games.js'

/** @type {mysql2.Pool} */
const pool = mysql2.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 3,
  decimalNumbers: true,
})

new CronJob('*/30 * * * *', main, null, true, 'UTC', null, true)

async function main() {
  if (main.inProcess) {
    return
  }

  main.inProcess = true
  try {
    const existingProviderSet = new Set()
    const receivedProviderSet = new Set()

    const existingGamesSet = new Set()
    const existingGamesMap = new Map()
    const receivedGamesSet = new Set()
    const receivedGamesMap = new Map()

    await pool.query(`
        select *
        from casino.games
        where aggregator = 'aspect'
    `)
      .then(([games]) => games.forEach(game => {
        existingGamesSet.add(game.uuid)
        existingProviderSet.add(game.provider_uid)
        existingGamesMap.set(game.uuid, game)
      }))


    await getGames().then(games => {
      games.forEach(game => {
        receivedGamesSet.add(`as:${game.gameId}`)
        receivedProviderSet.add('aspect')
        receivedGamesMap.set(`as:${game.gameId}`, game)
      })
    })

    for (const provider of receivedProviderSet) {
      if (!existingProviderSet.has(provider)) {
        await pool.query(`
            insert ignore into casino.casino_providers (aggregator_uid, uid)
            values ('aspect', ?)
        `, [provider])
      }
    }

    const deletedGameSet = new Set()
    const insertGameSet = new Set()
    const updatedGameSet = new Set()

    existingGamesSet.forEach(id => {
      if (receivedGamesSet.has(id)) {
        updatedGameSet.add(id)
      } else {
        deletedGameSet.add(id)
      }
    })

    receivedGamesSet.forEach(id => {
      if (existingGamesSet.has(id)) {
        updatedGameSet.add(id)
      } else {
        insertGameSet.add(id)
      }
    })

    const promises = []

    deletedGameSet.forEach(id => {
      promises.push(pool.query(`
          update casino.games
          set deleted = 1
          where uuid = ?
            and aggregator = 'aspect'
      `, [id]))
    })

    updatedGameSet.forEach(id => {
      const game = receivedGamesMap.get(id)
      if (!game) {
        return
      }
      promises.push(pool.query(`
          update casino.games
          set deleted       = 0
            , additional_id = ?
          where uuid = ?
            and aggregator = 'aspect'
      `, [game.gameId, id]))
    })

    insertGameSet.forEach(id => {
      const game = receivedGamesMap.get(id)
      if (!game) {
        return
      }

      promises.push(pool.query(`
                  insert into casino.games (uuid, aggregator, provider_uid, provider, name, deleted, active, type,
                                            site_section, additional_id)
                  values (concat('as:', ?), 'aspect', 'aspect', 'aspect', ?, 0, 0, 'slots', 'casino', ?)
        `, [game.gameId, game.gameName, game.gameId]),
      )
    })

    await Promise.all(promises)

    console.log(getCurrentDatetime(),
      'inserted: ', insertGameSet.size,
      'received: ', receivedGamesSet.size,
      'deleted: ', deletedGameSet.size)
  } catch (e) {
    console.error(getCurrentDatetime(), e)
  } finally {
    main.inProcess = false
  }
}
