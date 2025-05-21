import {databaseConnection} from 'core-infra/database/connection.js'

export class GameModel {
  constructor(database = databaseConnection) {
    this.database = database
  }

  async getGameInfo(gameId) {
    const [[game]] = await this.database.query(`
                select g.uuid as uuid, g.provider as provider, g.aggregator as aggregator, g.site_section as section
        , g.name                      as name
        , g.provider_uid              as providerUid
        , g.final_game_id             as finalGameId
        , g.active                    as active
        , g.deleted                   as deleted
                from casino.games g
                where g.uuid = concat('as:', ?) and g.aggregator = 'aspect'`,
      [gameId],
    )

    return game
  }
}

export const gameRepository = new GameModel()
