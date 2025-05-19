const connection = require('./connection.js')
const BaseRepository = require('./repository.js')
const QueryBuilder = require('./query-builder')

// Создаем прокси для удобного доступа к методам репозитория
function createRepository(tableName) {
  return new BaseRepository(tableName)
}

module.exports = {
  connection,
  BaseRepository,
  QueryBuilder,
  createRepository,

  // Удобные методы для быстрого старта
  query: (sql, params) => connection.query(sql, params),
  execute: (sql, params) => connection.execute(sql, params),

  // Управление соединением
  connect: () => connection.connect(),
  close: () => connection.close(),

  // Создание репозиториев
  getRepository: createRepository,
}
