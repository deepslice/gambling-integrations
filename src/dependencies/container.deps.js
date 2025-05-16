// DI Container
import {databaseConnection} from '#app/infrastructure/database/connection'
import {AppConfig} from '#app/config'

export class Container {
  constructor(
    config = new AppConfig(),
    database = databaseConnection,
  ) {
    this.database = database
    this.config = config

    this.init()
  }

  init() {
    this.database.connect({
      host: this.config.dbHost,
      user: this.config.dbUser,
      password: this.config.dbPassword,
      database: this.config.dbName,
      waitForConnections: true,
      connectionLimit: 5,
    })
  }
}
