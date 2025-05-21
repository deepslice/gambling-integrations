const connection = require('./connection.js')
const config = require('./config.js')
const {rabbitMQ} = config

class RabbitMQConsumer {
  constructor() {
    this.initialized = false
    this.consumerTag = null
    this.messageHandlers = new Set()
    this.init()
  }

  async init() {
    connection.onConnect(async (channel) => {
      this.channel = channel
      this.initialized = true

      // Настраиваем QoS (качество обслуживания)
      await this.channel.prefetch(1)

      console.log('Consumer ready')

      // Перезапускаем потребителя, если он был прерван
      if (this.messageHandlers.size > 0) {
        this.startConsuming()
      }
    })
  }

  addHandler(handler) {
    this.messageHandlers.add(handler)
    if (this.initialized && !this.consumerTag) {
      this.startConsuming()
    }
  }

  removeHandler(handler) {
    this.messageHandlers.delete(handler)
    if (this.messageHandlers.size === 0 && this.consumerTag) {
      this.stopConsuming()
    }
  }

  async startConsuming() {
    if (this.consumerTag) return

    try {
      const {queueName} = rabbitMQ

      const {consumerTag} = await this.channel.consume(queueName, async (msg) => {
        if (msg !== null) {
          try {
            const message = JSON.parse(msg.content.toString())

            // Вызываем все обработчики сообщений
            for (const handler of this.messageHandlers) {
              await handler(message)
            }

            this.channel.ack(msg)
          } catch (error) {
            console.error('Error processing message:', error)
            this.channel.nack(msg, false, false) // Отбрасываем сообщение при ошибке
          }
        }
      })

      this.consumerTag = consumerTag
      console.log(`Consumer started with tag: ${consumerTag}`)
    } catch (error) {
      console.error('Failed to start consumer:', error)
      throw error
    }
  }

  async stopConsuming() {
    if (!this.consumerTag) return

    try {
      await this.channel.cancel(this.consumerTag)
      this.consumerTag = null
      console.log('Consumer stopped')
    } catch (error) {
      console.error('Failed to stop consumer:', error)
      throw error
    }
  }
}

module.exports = new RabbitMQConsumer()
