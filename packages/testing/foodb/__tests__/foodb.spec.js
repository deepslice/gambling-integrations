import {describe, expect, it, jest} from '@jest/globals'

const items = [
  {
    tableSchema: 'a',
    tableName: 'a',
    columnName: 'a1',
    referencedTableSchema: null,
    referencedTableName: null,
    referencedColumn: null,
  },
  {
    tableSchema: 'a',
    tableName: 'a',
    columnName: 'a2',
    referencedTableSchema: null,
    referencedTableName: null,
    referencedColumn: null,
  },
  {
    tableSchema: 'b',
    tableName: 'b',
    columnName: 'b1',
    referencedTableSchema: 'a',
    referencedTableName: 'a',
    referencedColumn: 'a2',
  },
]

jest.fn()

describe('', () => {
  it('', async () => {
    await bake(items)
    expect(sorted).toBe([])
  })
})
