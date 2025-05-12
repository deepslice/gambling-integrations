import {databaseConnection} from '#app/infrastructure/database/connection'

// DI Container
export class Container {
  constructor() {
    this.database = databaseConnection()
  }
}
