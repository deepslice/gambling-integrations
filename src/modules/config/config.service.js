import {dbConnection} from '#app/infrastructure/.deprecated/db.connection'
import {assertField} from '#app/utils/assert.util'

const ConfigTypeEnum = {
  ASPECT: 'aspect',
  SPADES: 'spades',
}

class ConfigService {
  private id
  private prefix
  private db
  private currency
  private config
  private secretKey
  private operatorId
  private balanceLimit
  private winLimit

  constructor(context, configType = ConfigTypeEnum.ASPECT, database = dbConnection) {
    this.configType = configType
    this.prefix = assertField(context, 'prefix')
    this.database = database
  }

  async LoadConfig() {
    await this.loadConfig()
    return {
      id: this.id,
      prefix: this.prefix,
      db: this.db,
      currency: this.currency,
      config: this.config,
      secretKey: this.secretKey,
      operatorId: this.operatorId,
      balanceLimit: this.balanceLimit,
    }
  }

  private async loadConfig() {
    const project = await this.getConfig()
    if (!project) {
      return null
    }

    this.id = project.id
    this.db = project.db
    this.currency = project.currency
    this.config = project.config
    this.secretKey = project.secretKey
    this.operatorId = project.operatorId
    this.balanceLimit = project.balanceLimit
    this.winLimit = project.winLimit
  }

  private async getConfig() {
    const [[project]] = this.database.query(`
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
    `, [this.prefix])

    return project.id ? project : null
  }
}

export const configService = new ConfigService()
