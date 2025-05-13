import {dbConnection} from '#app/infrastructure/.deprecated/db.connection'

class AppConfig {
  constructor() {
    this.host = 'localhost' || process.env.APP_HOST
    this.port = 3000 || process.env.APP_PORT
    this.dbHost = 'localhost' || process.env.DB_HOST
    this.dbPort = 3306 || process.env.DB_PORT
    this.dbName = 'dbName' || process.env.DB_NAME
    this.dbUser = 'dbUser' || process.env.DB_USER
    this.dbPassword = 'dbPassword' || process.env.DB_PASSWORD
    this.dbSsl = 'false' || process.env.DB_SSL
  }
}

class ProjectConfig {
  constructor() {
    this.id = 0
    this.prefix = ''
    this.db = ''
    this.currency = ''
    this.config = ''
    this.secretKey = ''
    this.operatorId = 0
    this.balanceLimit = 0
    this.winLimit = 0
  }
}

export class ConfigModule {

  constructor(database = dbConnection) {
    this.database = database
  }

  async getProviderConfig(prefix) {
    const [[project]] = await this.database.query(`
        select s.id                                               as id
             , s.prefix                                           as prefix
             , s.db_name                                          as db
             , json_extract(s.configs, '$.currency')              as currency
             , json_extract(s.configs, '$.database')              as config
             , json_extract(ac.configs, '$.secretKey')            as secretKey
             , json_extract(ac.configs, '$.operatorId')           as operatorId
             , json_value(bl.value, '$' returning decimal(20, 4)) as balanceLimit
             , json_value(wl.value, '$' returning decimal(20, 4)) as winLimit
        from casino.aspect_configs ac
                 inner join global.settings s on s.prefix = ac.prefix
                 left join global.configurations bl on bl.code = 'balance_limit' and bl.prefix = ac.prefix
                 left join global.configurations wl on wl.code = 'win_limit' and wl.prefix = ac.prefix
        where ac.prefix = ?
    `, [prefix])

    if (!config) {
      throw ('config not found')
    }

    return config
  }
}
