import connection from './connection.js'
import client from './client.js'

export default {
  connection,
  client,

  // Удобные методы для быстрого старта
  set: client.set.bind(client),
  get: client.get.bind(client),
  del: client.del.bind(client),
  hset: client.hset.bind(client),
  hget: client.hget.bind(client),
  publish: client.publish.bind(client),
  subscribe: client.subscribe.bind(client),

  // Управление соединением
  connect: () => connection.connect(),
  close: () => connection.close(),
}
