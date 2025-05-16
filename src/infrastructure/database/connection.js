import mysql from 'mysql2/promise'
import mysqlConfig from './config.js'

class MySQLConnection {
  constructor() {
    this.pool = null
    this.isConnected = false
    this.reconnectAttempts = 0
    this.connectionListeners = []
  }

  async connect(dbConfig) {
    try {
      this.pool = mysql.createPool(dbConfig)
      this.isConnected = true
      this.reconnectAttempts = 0

      // Тестовое соединение для проверки
      const conn = await this.pool.getConnection()
      await conn.ping()
      conn.release()

      console.log('✅ Connected to MySQL')

      // Вызываем все зарегистрированные слушатели
      this.connectionListeners.forEach(cb => cb(this.pool))

      return this.pool
    } catch (error) {
      console.error('Failed to connect to MySQL:', error.message)
      this.scheduleReconnect()
      throw error
    }
  }

  scheduleReconnect() {
    if (this.reconnectAttempts >= mysqlConfig.reconnectOptions.maxAttempts) {
      console.error('Max reconnection attempts reached')
      return
    }

    const delay = mysqlConfig.reconnectOptions.delay *
      Math.pow(mysqlConfig.reconnectOptions.backoffFactor, this.reconnectAttempts)

    this.reconnectAttempts++
    console.log(`Attempting to reconnect (${this.reconnectAttempts}) in ${delay}ms...`)

    setTimeout(() => this.connect(), delay)
  }

  onConnect(callback) {
    if (this.isConnected) {
      callback(this.pool)
    } else {
      this.connectionListeners.push(callback)
    }
  }

  async close() {
    if (this.pool) {
      await this.pool.end()
      this.isConnected = false
      console.log('MySQL connection pool closed gracefully')
    }
  }

  async getConnection() {
    if (!this.isConnected) {
      throw new Error('MySQL connection is not established')
    }
    return await this.pool.getConnection()
  }

  async execute(sql, params) {
    if (!this.isConnected) {
      throw new Error('MySQL connection is not established')
    }
    return await this.pool.execute(sql, params)
  }

  async query(sql, params) {
    if (!this.isConnected) {
      throw new Error('MySQL connection is not established')
    }
    return await this.pool.query(sql, params)
  }
}

export const databaseConnection = new MySQLConnection()
