const amqp = require('amqplib')
const config = require('./config')
const {rabbitMQ} = config

class RabbitMQConnection {
  constructor() {
    this.connection = null
    this.channel = null
    this.isConnected = false
    this.reconnectAttempts = 0
    this.listeners = []
  }

  async connect() {
    try {
      this.connection = await amqp.connect(rabbitMQ.url)
      this.channel = await this.connection.createChannel()
      this.isConnected = true
      this.reconnectAttempts = 0

      console.log('✅ Connected to RabbitMQ')

      // Настраиваем обменник и очередь
      await this.setupExchangeAndQueue()

      // Вызываем все зарегистрированные слушатели
      this.listeners.forEach(cb => cb(this.channel))

      // Обработка закрытия соединения
      this.connection.on('close', () => {
        console.log('❌ RabbitMQ connection closed')
        this.isConnected = false
        this.scheduleReconnect()
      })

      this.connection.on('error', (err) => {
        console.error('RabbitMQ connection error:', err.message)
        if (!this.isConnected) {
          this.scheduleReconnect()
        }
      })

      return this.channel
    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error.message)
      this.scheduleReconnect()
      throw error
    }
  }

  async setupExchangeAndQueue() {
    await this.channel.assertExchange(rabbitMQ.exchangeName, 'direct', {durable: true})
    await this.channel.assertQueue(rabbitMQ.queueName, {durable: true})
    await this.channel.bindQueue(rabbitMQ.queueName, rabbitMQ.exchangeName, rabbitMQ.routingKey)
  }

  scheduleReconnect() {
    if (this.reconnectAttempts >= rabbitMQ.reconnectOptions.maxAttempts) {
      console.error('Max reconnection attempts reached')
      return
    }

    const delay = rabbitMQ.reconnectOptions.delay *
      Math.pow(rabbitMQ.reconnectOptions.backoffFactor, this.reconnectAttempts)

    this.reconnectAttempts++
    console.log(`Attempting to reconnect (${this.reconnectAttempts}) in ${delay}ms...`)

    setTimeout(() => this.connect(), delay)
  }

  onConnect(callback) {
    if (this.isConnected) {
      callback(this.channel)
    } else {
      this.listeners.push(callback)
    }
  }

  async close() {
    if (this.channel) await this.channel.close()
    if (this.connection) await this.connection.close()
    this.isConnected = false
    console.log('RabbitMQ connection closed gracefully')
  }
}

module.exports = new RabbitMQConnection()
