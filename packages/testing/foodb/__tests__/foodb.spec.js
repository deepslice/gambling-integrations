import {describe, expect, it} from '@jest/globals'
import {bake} from '#foodb/foodb'

describe('', () => {
  const items = [
    {
      tableSchema: 'a',
      tableName: 'a',
      columnName: 'a1',
      dataType: 'int',
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
  ]

  it('', async () => {
    let result = []
    let tableItems = []

    let tableName = items[0].tableName
    for (let i = 0; i < items.length; i++) {
      tableItems.push(items[i])

      if (i === items.length - 1) {
        const food = await bake(tableItems)
        result.push(food)
        break
      }

      if (items[i + 1].tableName !== tableName) {
        const food = await bake(tableItems)
        result.push(food)

        tableItems = []
        tableName = items[i + 1].tableName
      }
    }

    expect(result).toBe([])
  })
})
