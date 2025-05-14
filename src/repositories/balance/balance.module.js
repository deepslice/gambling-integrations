import {databaseConnection} from '#app/infrastructure/database/connection'

export class BalanceModel {

  constructor(database = databaseConnection) {
    this.database = database
  }

  
}
