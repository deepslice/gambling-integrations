module.exports = {
  rabbitMQ: {
    url: 'amqp://localhost',
    exchangeName: 'my_exchange',
    queueName: 'my_queue',
    routingKey: 'my_routing_key',
    reconnectOptions: {
      maxAttempts: 5,       // Максимальное количество попыток переподключения
      delay: 3000,          // Задержка между попытками (мс)
      backoffFactor: 2,      // Множитель для экспоненциальной задержки
    },
  },
}
