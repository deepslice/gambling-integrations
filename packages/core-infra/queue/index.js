const publisher = require('./publisher.js')
const consumer = require('./consumer.js')
const connection = require('./connection.js')

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
