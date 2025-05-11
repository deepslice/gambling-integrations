import Redis from 'ioredis'
import redisConfig from './config'

class RedisConnection {
  constructor() {
    this.client = null
    this.isConnected = false
    this.reconnectAttempts = 0
    this.connectionListeners = []
    this.subscribers = new Map()
  }

  async connect() {
    try {
      this.client = new Redis({
        host: redisConfig.host,
        port: redisConfig.port,
        password: redisConfig.password,
        db: redisConfig.db,
        retryStrategy: redisConfig.reconnectOptions.retryStrategy,
        ...redisConfig.options,
      })

      // Обработчики событий
      this.client.on('connect', () => {
        this.isConnected = true
        this.reconnectAttempts = 0
        console.log('✅ Connected to Redis')

        // Вызываем все зарегистрированные слушатели
        this.connectionListeners.forEach(cb => cb(this.client))
      })

      this.client.on('error', (error) => {
        console.error('Redis error:', error.message)
        if (!this.isConnected) {
          this.scheduleReconnect()
        }
      })

      this.client.on('close', () => {
        console.log('❌ Redis connection closed')
        this.isConnected = false
        this.scheduleReconnect()
      })

      this.client.on('reconnecting', () => {
        console.log('Reconnecting to Redis...')
      })

      // Принудительное подключение, если используется lazyConnect
      if (redisConfig.options.lazyConnect) {
        await this.client.connect()
      }

      return this.client
    } catch (error) {
      console.error('Failed to connect to Redis:', error.message)
      this.scheduleReconnect()
      throw error
    }
  }

  scheduleReconnect() {
    if (this.reconnectAttempts >= redisConfig.reconnectOptions.maxAttempts) {
      console.error('Max reconnection attempts reached')
      return
    }

    const delay = redisConfig.reconnectOptions.delay *
      Math.pow(redisConfig.reconnectOptions.backoffFactor, this.reconnectAttempts)

    this.reconnectAttempts++
    console.log(`Attempting to reconnect (${this.reconnectAttempts}) in ${delay}ms...`)

    setTimeout(() => this.connect(), delay)
  }

  onConnect(callback) {
    if (this.isConnected) {
      callback(this.client)
    } else {
      this.connectionListeners.push(callback)
    }
  }

  async close() {
    if (this.client) {
      // Отписываемся от всех каналов перед закрытием
      if (this.subscribers.size > 0) {
        await this.client.unsubscribe(...this.subscribers.keys())
        this.subscribers.clear()
      }

      await this.client.quit()
      this.isConnected = false
      console.log('Redis connection closed gracefully')
    }
  }

  subscribe(channel, callback) {
    if (!this.isConnected) {
      throw new Error('Redis connection is not established')
    }

    if (!this.subscribers.has(channel)) {
      this.client.subscribe(channel)
      this.subscribers.set(channel, new Set())
    }

    const handlers = this.subscribers.get(channel)
    handlers.add(callback)

    // Обработчик сообщений
    this.client.on('message', (msgChannel, message) => {
      if (channel === msgChannel) {
        try {
          const parsedMsg = this.tryParseJson(message)
          handlers.forEach(handler => handler(parsedMsg))
        } catch (error) {
          console.error('Error processing Redis message:', error)
        }
      }
    })

    return () => this.unsubscribe(channel, callback)
  }

  unsubscribe(channel, callback) {
    if (!this.subscribers.has(channel)) return

    const handlers = this.subscribers.get(channel)
    handlers.delete(callback)

    if (handlers.size === 0) {
      this.client.unsubscribe(channel)
      this.subscribers.delete(channel)
    }
  }

  publish(channel, message) {
    if (!this.isConnected) {
      throw new Error('Redis connection is not established')
    }

    const msgString = typeof message === 'string' ? message : JSON.stringify(message)
    return this.client.publish(channel, msgString)
  }

  tryParseJson(str) {
    try {
      return JSON.parse(str)
    } catch (e) {
      return str
    }
  }
}

export default new RedisConnection()
