// src/main.js
import {foodb} from './foodb.js'
import {databaseConnection} from 'core-infra/database/connection.js'

const defaultCardinality = 5
const references = new Map()

/**
 * orderByReference
 * @param items
 */
export function orderByReference(items) {
  return items.sort((a, b) => a.referencedTableName === b.tableName ? 1 : -1)
}

/**
 * splitBySchema
 * @param items
 * @returns {{}}
 */
export function splitBySchema(items) {
  const grouped = {}
  for (const item of items) {
    const schema = item.tableSchema
    if (!grouped[schema]) {
      grouped[schema] = []
    }
    grouped[schema].push(item)
  }
  return grouped
}

/**
 * splitByTable
 * @param items
 * @returns {{}}
 */
export function splitByTable(items) {
  const grouped = {}
  for (const item of items) {
    const schema = item.tableName
    if (!grouped[schema]) {
      grouped[schema] = []
    }
    grouped[schema].push(item)
  }
  return grouped
}

/**
 * unpackMultiplicity
 * @param item
 * @param cardinality
 * @returns {[]}
 */
export function unpackMultiplicity(item, cardinality = defaultCardinality) {
  const values = []
  for (let i = 0; i < cardinality; i++) {
    let value = null

    if (isUnique(item)) {
      while (true) {
        value = generateItemValue(item)
        if (!values.includes(value)) {
          break
        }
      }
    } else {
      value = generateItemValue(item)
    }

    values.push(value)
  }

  return {
    ...item,
    values,
  }
}

/**
 * hasReferenced
 * @param item
 * @returns {*}
 */
export function hasReferenced(item) {
  const {referencedTableSchema, referencedTableName} = item
  return referencedTableSchema && referencedTableName
}

/**
 * isUnique
 * @param item
 * @returns {boolean}
 */
export function isUnique(item) {
  const {constraintType} = item
  return constraintType === 'PRIMARY KEY' || constraintType === 'UNIQUE'
}

/**
 * generateItemValue
 * @param item
 * @returns {number|string}
 */
export function generateItemValue(item) {
  const {characterMaximumLength} = item

  switch (item.dataType) {
    case 'int':
      return Math.floor(Math.random() * 1000) + 1

    case 'tinyint':
      return Math.floor(Math.random() * 100) + 1

    case 'decimal':
      return (Math.random() * 100).toFixed(2)

    case 'float':
      return (Math.random() * 100).toFixed(2)

    case 'char':
      return foodb.varchar('sushi', characterMaximumLength)

    case 'varchar':
      return foodb.varchar('sushi', characterMaximumLength)

    case 'text':
      return foodb.text('sushi', characterMaximumLength)

    case 'json':
      return '{}'

    case 'enum':
      break

    case 'date':
      return `${
        new Date().toISOString()
          .split('T')[0]
      }`

    case 'timestamp':
      return `${
        new Date().toISOString()
          .replace('T', ' ')
          .replace(/\..+/, '')
      }`
    default:
      return 'NULL'
  }
}

/**
 * getDbms
 * @returns {Promise<*>}
 */
export async function getDbms() {
  const connection = await databaseConnection.getConnection()
  try {
    const [rows] = await connection.query(`SELECT 'mysql'                       dbms,
                                                  t.TABLE_SCHEMA             as tableSchema,
                                                  t.TABLE_NAME               as tableName,
                                                  c.COLUMN_NAME              as columnName,
                                                  c.ORDINAL_POSITION         as ordinalPosition,
                                                  c.DATA_TYPE                as dataType,
                                                  c.CHARACTER_MAXIMUM_LENGTH as characterMaximumLength,
                                                  n.CONSTRAINT_TYPE          as constraintType,
                                                  k.REFERENCED_TABLE_SCHEMA  as referencedTableSchema,
                                                  k.REFERENCED_TABLE_NAME    as referencedTableName,
                                                  k.REFERENCED_COLUMN_NAME   as referencedColumnName
                                           FROM INFORMATION_SCHEMA.TABLES t
                                                    LEFT JOIN INFORMATION_SCHEMA.COLUMNS c
                                                              ON t.TABLE_SCHEMA = c.TABLE_SCHEMA AND t.TABLE_NAME = c.TABLE_NAME
                                                    LEFT JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE k
                                                              ON c.TABLE_SCHEMA = k.TABLE_SCHEMA AND
                                                                 c.TABLE_NAME = k.TABLE_NAME AND
                                                                 c.COLUMN_NAME = k.COLUMN_NAME
                                                    LEFT JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS n
                                                              ON k.CONSTRAINT_SCHEMA = n.CONSTRAINT_SCHEMA AND
                                                                 k.CONSTRAINT_NAME = n.CONSTRAINT_NAME AND
                                                                 k.TABLE_SCHEMA = n.TABLE_SCHEMA AND
                                                                 k.TABLE_NAME = n.TABLE_NAME
                                           WHERE t.TABLE_TYPE = 'BASE TABLE'
                                             AND t.TABLE_SCHEMA NOT IN
                                                 ('INFORMATION_SCHEMA', 'mysql', 'performance_schema');`,
    )

    return rows
  } catch (e) {
    throw e
  } finally {
    await connection.release()
  }
}

/**
 * bake
 * @param items
 * @returns {*[]}
 */
export function bake(items) {
  const result = []

  // const columnNames = items.map(i => `\`${i.columnName}\``).join(', ')

  for (const item of items) {
    let itemValues = unpackMultiplicity(item)

    items.filter(i =>
      i.referencedTableSchema === item.tableSchema &&
      i.referencedTableName === item.tableName &&
      i.referencedColumn === item.columnName)
      .forEach(i => references.set(
        `${i.referencedTableSchema}:${i.referencedTableName}:${i.referencedColumn}`,
        itemValues.values,
      ))

    const {
      referencedTableSchema,
      referencedTableName,
      referencedColumn,
    } = item
    const referenceKey = `${referencedTableSchema}:${referencedTableName}:${referencedColumn}`

    if (hasReferenced(item)) {
      itemValues = {
        ...item,
        values: references.get(referenceKey),
      }
    }

    result.push(itemValues)
  }

  console.log(result)
  //return transpose(result)
  return result
}

/**
 * insertData
 * @param tables
 * @returns {Promise<void>}
 */
async function insertData(tables) {
  // Выполняем вставку для каждой таблицы
  for (const key in tables) {
    const table = tables[key]
    if (table.values.length === 0) continue

    try {
      const connection = await databaseConnection.getConnection()

      // Создаем SQL запрос
      const columns = table.columns.map(col => `\`${col}\``).join(', ')
      const placeholders = table.columns.map(() => '?').join(', ')
      const sql = `INSERT INTO \`${table.schema}\`.\`${table.name}\` (${columns})
                   VALUES (${placeholders})`

      // Выполняем вставку для каждой строки
      for (const row of table.values) {
        await connection.execute(sql, row)
      }

      connection.release()
      console.log(`Данные успешно вставлены в таблицу ${table.schema}.${table.name}`)
    } catch (error) {
      console.error(`Ошибка при вставке в таблицу ${table.schema}.${table.name}:`, error)
    }
  }
}

async function main() {
  const args = process.argv.slice(0)
  const command = args[2]

  await databaseConnection.connect({
    host: 'localhost',
    port: 3306,
    user: 'root',
    database: 'foodb',
    password: 'root',
    multipleStatements: true,
    waitForConnections: true,
    connectionLimit: 5,
  })

  if (command === 'bake' || command === 'cook') {
    const rows = await getDbms()
    const data = bake(orderByReference(rows))

    const tables = {}
    data.forEach(item => {
      const key = `${item.tableSchema}.${item.tableName}`
      if (!tables[key]) {
        tables[key] = {
          schema: item.tableSchema,
          name: item.tableName,
          columns: [],
          values: [],
        }
      }

      // Добавляем информацию о колонке
      if (!tables[key].columns.includes(item.columnName)) {
        tables[key].columns.push(item.columnName)
      }
    })

    Object.keys(tables).forEach(key => {
      const table = tables[key]
      const columnCount = table.columns.length

      // Находим все записи для этой таблицы
      const tableItems = data.filter(
        item => item.tableSchema === table.schema && item.tableName === table.name,
      )

      // Определяем количество строк
      const rowCount = tableItems[0]?.values?.length || 0

      // Формируем значения для каждой строки
      for (let i = 0; i < rowCount; i++) {
        const rowValues = []
        table.columns.forEach(col => {
          const colItem = tableItems.find(item => item.columnName === col)
          rowValues.push(colItem.values[i])
        })
        table.values.push(rowValues)
      }
    })

    await insertData(tables)
  }

  if (command === 'help') {
    const rows = await getDbms()
    console.log(rows)
  }
}

main()
