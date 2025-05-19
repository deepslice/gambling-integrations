import {databaseConnection} from 'packages/core-infra/database/connection'

export class BalanceModel {

  constructor(database = databaseConnection) {
    this.database = database
  }


}
