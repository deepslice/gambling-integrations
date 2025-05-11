const publisher = require('./publisher')
const consumer = require('./consumer')
const connection = require('./connection')

module.exports = {
  publisher,
  consumer,
  connection,

  // Удобные методы для быстрого старта
  publish: publisher.publish.bind(publisher),
  subscribe: (handler) => consumer.addHandler(handler),
  unsubscribe: (handler) => consumer.removeHandler(handler),

  // Управление соединением
  connect: () => connection.connect(),
  close: () => connection.close(),
}
