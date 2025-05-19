import {describe, expect, it} from '@jest/globals'
import {bake} from './index.js'

describe('', () => {
  const items = [
    {
      tableSchema: 'a',
      tableName: 'a',
      columnName: 'a1',
      dataType: 'char',
      referencedTableSchema: null,
      referencedTableName: null,
      referencedColumn: null,
    },
    {
      tableSchema: 'a',
      tableName: 'a',
      columnName: 'a2',
      dataType: 'int',
      referencedTableSchema: null,
      referencedTableName: null,
      referencedColumn: null,
    },
    {
      tableSchema: 'b',
      tableName: 'b',
      columnName: 'b1',
      dataType: 'int',
      referencedTableSchema: 'a',
      referencedTableName: 'a',
      referencedColumn: 'a2',
    },
    {
      tableSchema: 'b',
      tableName: 'b',
      columnName: 'b2',
      dataType: 'int',
      referencedTableSchema: 'a',
      referencedTableName: 'a',
      referencedColumn: 'a2',
    },
  ]

  it('', () => {
    const tables = {}
    const data = bake(items)
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

    expect(tables).toBe([])
  })
})
