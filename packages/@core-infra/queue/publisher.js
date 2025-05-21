const connection = require('./connection.js')
const config = require('./config.js')
const {rabbitMQ} = config

class RabbitMQPublisher {
  constructor() {
    this.initialized = false
    this.init()
  }

  async init() {
    connection.onConnect((channel) => {
      this.channel = channel
      this.initialized = true
      console.log('Publisher ready')
    })
  }

  async publish(message, options = {}) {
    if (!this.initialized) {
      throw new Error('Publisher not initialized yet')
    }

    try {
      const {exchangeName, routingKey} = rabbitMQ
      const msgBuffer = Buffer.from(JSON.stringify(message))

      this.channel.publish(exchangeName, routingKey, msgBuffer, {
        persistent: true,
        ...options,
      })

      console.log(`Message published to ${exchangeName} with key ${routingKey}`)
      return true
    } catch (error) {
      console.error('Failed to publish message:', error)
      throw error
    }
  }
}

module.exports = new RabbitMQPublisher()
