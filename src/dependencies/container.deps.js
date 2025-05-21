import {databaseConnection} from '@core-infra/database'
import {AppConfig} from '#app/config'

// DI Container
class Container {
  constructor(
    config = new AppConfig(),
    database = databaseConnection,
  ) {
    this.database = database
    this.config = config
  }

  async init() {
    await this.database.connect({
      host: this.config.dbHost,
      port: this.config.dbPort,
      user: this.config.dbUser,
      password: this.config.dbPassword,
      database: this.config.dbName,
      multipleStatements: true,
      waitForConnections: true,
      connectionLimit: 5,
    })
  }
}

const container = new Container()
await container.init()
export default container
