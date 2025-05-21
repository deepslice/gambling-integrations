import container from '#app/dependencies/container.deps'

const ConfigTypeEnum = {
  ASPECT: 'aspect',
  SPADES: 'spades',
}

class ConfigService {
  constructor(configType = ConfigTypeEnum.ASPECT, database = container.database) {
    this.database = database
    this.configType = configType
  }

  async loadConfig(prefix) {
    const project = await this.getConfig(prefix)
    if (!project) {
      return null
    }

    return {
      id: project.id,
      prefix: project.prefix,
      db: project.db,
      currency: project.currency,
      config: project.config,
      secretKey: project.secretKey,
      operatorId: project.operatorId,
      balanceLimit: project.balanceLimit,
      winLimit: project.winLimit,
    }
  }

  async getConfig(prefix) {
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

    return project.id ? project : null
  }
}

export const configService = new ConfigService()
