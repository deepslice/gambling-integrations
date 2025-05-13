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

export const appConfig = Object.freeze(new AppConfig())
