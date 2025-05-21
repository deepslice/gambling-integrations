export class AppConfig {
  constructor() {
    this.host = process.env.APP_HOST || 'localhost'
    this.port = process.env.APP_PORT || 3000
    this.dbHost = process.env.DB_HOST || 'localhost'
    this.dbPort = process.env.DB_PORT || 3306
    this.dbName = process.env.DB_NAME || 'dbName'
    this.dbUser = process.env.DB_USER || 'dbUser'
    this.dbPassword = process.env.DB_PASSWORD || 'dbPassword'
    this.dbSsl = process.env.DB_SSL || 'false'
  }
}

export const appConfig = Object.freeze(new AppConfig())
