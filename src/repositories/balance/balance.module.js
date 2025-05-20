import {databaseConnection} from 'core-infra/database/connection.js'

export class BalanceModel {

  constructor(database = databaseConnection) {
    this.database = database
  }


}
