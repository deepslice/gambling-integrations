// src/main.js
import {databaseConnection} from 'core-infra/database/connection.js'
import {bake} from '#foodb/foodb'

const defaultCardinality = 5

/**
 * orderByReference
 * @param items
 */
export function orderByReference(items) {
  return items.sort((a, b) => a.referencedTableName === b.tableName ? -1 : 1)
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
 * @param isUnique
 * @param cardinality
 * @returns {[]}
 */
export function unpackMultiplicity(item, cardinality = defaultCardinality) {
  const itemValues = []

  for (let i = 0; i < cardinality; i++) {
    let value = null

    if (isUnique(item)) {
      while (true) {
        value = generateItemValue(item)
        if (!itemValues.includes(value)) {
          break
        }
      }
    } else {
      value = generateItemValue(item)
    }

    itemValues.push(value)
  }

  return itemValues
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
      return ''

    case 'varchar':
      return ''

    case 'text':
      return ''

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
 * @returns {Promise<void>}
 */
export async function bake(items) {
  const connection = await databaseConnection.getConnection()
  await connection.beginTransaction()

  const columnNames = items.map(i => `\`${i.columnName}\``).join(', ')
  const references = Map()

  for (const item of items) {
    const {
      referencedTableSchema,
      referencedTableName,
      referencedColumnName,
    } = item
    const referenceKey = `${referencedTableSchema}:${referencedTableName}:${referencedColumnName}`

    let itemValues = unpackMultiplicity(item)
    items.filter(i => i.referencedTableName === item.tableName)
      .forEach(i => references.set(referenceKey, itemValues))

    if (hasReferenced(item)) {
      itemValues = references.get(referenceKey)
    }

    try {
      await connection.query(
        `INSERT INTO ${item.tableSchema}.${item.tableName} (${columnNames})
         VALUES ?`,
        [itemValues],
      )
      await connection.commit()
    } catch (e) {
      await connection.rollback()
    } finally {
      await connection.release()
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
    database: 'global',
    password: 'root',
    multipleStatements: true,
    waitForConnections: true,
    connectionLimit: 5,
  })

  if (command === 'bake' || command === 'cook') {
    const rows = await getDbms()
    const items = orderByReference(rows)
    await bake(items)
  }

  if (command === 'help') {

  }
}

main()
