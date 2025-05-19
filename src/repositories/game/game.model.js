import {databaseConnection} from 'packages/core-infra/database/connection'

const getGameInfo = `
    SELECT g.uuid       AS uuid
         , g.provider   AS provider
         , g.aggregator AS aggregator
         , g.site_section AS section
        , g.name                      AS name
        , g.provider_uid              AS providerUid
        , final_game_id               AS finalGameId
        , ifnull(cg.active, g.active) AS active
        , deleted                     AS deleted
    FROM casino.games g
        LEFT JOIN casino_games cg
    ON g.uuid = cg.uuid
    WHERE g.uuid = concat('as:', ?) AND aggregator = 'aspect'`

export class GameModel {
  constructor(database = databaseConnection) {
    this.database = database
  }

  async getGameInfo(gameId) {
    const [[game]] = await this.database.query(
      getGameInfo, [gameId],
    )

    return game
  }
}
