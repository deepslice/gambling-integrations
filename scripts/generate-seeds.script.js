import {readdirSync, readFileSync, writeFileSync} from 'node:fs'
import {Readable} from 'node:stream'
import path from 'path'

const SourceDir = 'testdata/db/migrations/schemas'
const OutputDir = 'testdata/db/migrations/seeds'
const RowsPerTable = 5

// Глобальное хранилище для PK родительских таблиц
let parentReferences = new Map()
let currentReferences = new Map()

// Вспомогательные функции
function extractVarcharLength(colType) {
  const match = /char\((\d+)\)/i.exec(colType)
  // console.log('match', match)
  return match ? parseInt(match[1]) : null
}

function generateUniqueString(base, existing, lengthLimit = null) {
  let counter = 1
  while (true) {
    let uniqueStr = `${base}_${counter}`
    if (lengthLimit && uniqueStr.length > lengthLimit) {
      uniqueStr = uniqueStr.substring(0, lengthLimit)
    }

    if (!existing.has(uniqueStr)) {
      console.log('uniqueStr:', uniqueStr, existing)
      return uniqueStr
    }

    counter++
    if (counter > 1000) {
      throw new Error('Cannot generate unique value')
    }
  }
}

function generateValue(columnType, columnName, isPrimary = false, isUnique = false, existingValues, existingUnique, references = []) {
  let refKey = ''
  const ref = references.find(r => r.column === columnName)
  if (ref) {
    refKey = `${ref.parentTable}:${ref.parentColumn}`
  }

  if (ref && parentReferences.has(refKey)) {
    const parent = [...parentReferences.get(refKey)]
    if (!currentReferences.has(refKey)) {
      currentReferences.set(refKey, new Set(parent))
    }

    let current = [...currentReferences.get(refKey)]
    const value = current[0]

    current = current.slice(1)
    if (current.length === 0) {
      current = parent
    }

    currentReferences.set(refKey, new Set(current))
    return value
  }

  const colType = columnType.toLowerCase()
  if (isPrimary || colType.includes('int')) {
    const isTiny = colType.includes('tinyint')
    if (isPrimary || isUnique) {
      let value = Math.floor(Math.random() * (isTiny ? 100 : 10000)) + 1
      while (existingValues.has(value.toString()) && existingUnique.has(value.toString())) {
        value = Math.floor(Math.random() * (isTiny ? 100 : 10000)) + 1
      }
      return value
    }
    return (Math.floor(Math.random() * (isTiny ? 100 : 1000)) + 1)
  }

  if (colType.includes('decimal') || colType.includes('float')) {
    return (Math.random() * 100).toFixed(2)
  }

  if (colType.includes('char') || colType.includes('varchar')) {
    const length = extractVarcharLength(columnType)

    if (isPrimary) {
      const base = length ? columnName.substring(0, length - 5) : columnName
      const value = generateUniqueString(base, existingValues, length)
      return `${value}`
    }

    if (isUnique) {
      const base = length ? columnName.substring(0, length - 5) : columnName
      const value = generateUniqueString(base, existingUnique, length)
      return `${value}`
    } else {
      const randSuffix = `_${Math.floor(Math.random() * 100) + 1}`
      if (length && length > randSuffix.length) {
        const base = columnName.substring(0, length - randSuffix.length)
        return `${base}${randSuffix}`
      }
      return length ? `${columnName.substring(0, length)}` : `${columnName}`
    }
  }

  if (colType.includes('text')) {
    return `Some text for ${columnName}`
  }

  if (colType.includes('json')) {
    return '{}'
  }

  if (colType.includes('enum')) {
    const enumValues = columnType.match(/'([^']+)'/g) || []
    if (enumValues.length > 0) {
      const randomValue = enumValues[Math.floor(Math.random() * enumValues.length)]
      return randomValue.replace(/^'|'$/g, '')
    }
    return 'default'
  }

  if (colType.includes('date')) {
    return `${new Date().toISOString().split('T')[0]}`
  }

  if (colType.includes('timestamp')) {
    return `${new Date().toISOString().replace('T', ' ').replace(/\..+/, '')}`
  }

  return 'NULL'
}

function parseColumns(sqlContent) {
  const lines = sqlContent.split('\n')
  let tableName = null
  const columns = []
  const primaryKeys = new Set()
  const uniques = new Set()
  let inCreateTable = false

  for (const line of lines) {
    const trimmedLine = line.trim().replace(/,$/, '')

    if (trimmedLine.toLowerCase().startsWith('create table')) {
      inCreateTable = true
      const match = /create table\s+`?(\w+)`?/i.exec(trimmedLine)
      if (match) tableName = match[1]
    } else if (inCreateTable && trimmedLine.startsWith(')')) {
      break
    } else if (inCreateTable && trimmedLine) {

      if (trimmedLine.toLowerCase().includes('primary key')) {
        const complexPk = trimmedLine.match(/PRIMARY\s+KEY\s+\(([^)]+)\)/i) || []
        if (complexPk.length > 0) {
          const keys = complexPk[1].split(',')
          //console.log('complexPk:', keys)
          keys.forEach(key => primaryKeys.add(key.replace(/`/g, '').toLowerCase()))
        } else {
          const keys = trimmedLine.match(/`?(\w+)`?/g) || []
          keys.forEach(key => primaryKeys.add(key.replace(/`/g, '').toLowerCase()))
        }
      }

      if (trimmedLine.toLowerCase().includes('unique')) {
        const complexUnique = trimmedLine.match(/PRIMARY\s+KEY\s+\(([^)]+)\)/i) || []
        if (complexUnique.length > 0) {
          const keys = complexUnique[1].split(',')
          //console.log('complexUnique:', keys)
          keys.forEach(key => uniques.add(key.replace(/`/g, '').toLowerCase()))
        } else {
          const keys = trimmedLine.match(/`?(\w+)`?/g) || []
          keys.forEach(key => uniques.add(key.replace(/`/g, '').toLowerCase()))
        }
      }

      if (trimmedLine.toLowerCase().match(/^(?!\s*(?:CONSTRAINT|UNIQUE|PRIMARY\s+KEY|FOREIGN\s+KEY)).+/i)) {
        const match = /`?(\w+)`?\s+([^\s,]+(?:\s*\([^)]*\))?)/.exec(trimmedLine)
        if (match) {
          const colName = match[1]
          const colType = match[2]
          const isPrimary = primaryKeys.has(colName.toLowerCase())
          const isUnique = uniques.has(colName.toLowerCase())
          //console.log('test:', [colName, colType, isPrimary, isUnique])
          columns.push([colName, colType, isPrimary, isUnique])
        }
      }
    }
  }

  if (!tableName) throw new Error('Table name not found')

  const references = parseReferences(sqlContent)
  return {tableName, columns, references}
}

function generateInsert(table, columns, references) {
  const colNames = columns.map(col => `\`${col[0]}\``).join(', ')
  const valuesList = []

  const temproraryRefs = new Map()
  const usedPrimaryValues = new Set()
  const usedUniqueValues = new Set()

  for (let i = 0; i < RowsPerTable; i++) {
    const rowValues = []

    // Затем остальные столбцы
    for (const col of columns) {

      const columnName = col[0]
      const columnType = col[1]
      const isPrimary = col[2]
      const isUnique = col[3]

      let value

      // if primary
      if (isPrimary) {
        value = generateValue(columnType, columnName, isPrimary, false, usedPrimaryValues, new Set(), references)
        rowValues.push(value)
        usedPrimaryValues.add(value)
      } else {
        value = generateValue(columnType, columnName, false, isUnique, new Set(), usedUniqueValues, references)
        rowValues.push(`'${value}'`)

        // if unique
        if (isUnique) {
          // Important!
          // value = value.replace(/^'|'$/g, '')
          usedUniqueValues.add(value)
        }
      }

      if (isPrimary || isUnique) {
        if (!temproraryRefs.has(`${table}:${columnName}`)) {
          temproraryRefs.set(`${table}:${columnName}`, new Set([value]))
        } else {
          const currRefs = temproraryRefs.get(`${table}:${columnName}`)
          currRefs.add(value)
          temproraryRefs.set(`${table}:${columnName}`, new Set([...currRefs]))
        }
      }
    }

    valuesList.push(`INSERT INTO \`${table}\` (${colNames})
                     VALUES (${rowValues.join(', ')});`)
  }

  temproraryRefs.forEach((refs, key) => {
    parentReferences.set(key, refs)
  })

  return valuesList.join('\n')
}

function parseReferences(sqlContent) {
  const references = []
  const lines = sqlContent.split('\n')

  for (const line of lines) {
    const trimmedLine = line.trim()
    const refMatch = /FOREIGN KEY\s*\(([^)]+)\)\s*REFERENCES\s+([^\s(]+)\s*\(([^)]+)\)/i.exec(trimmedLine)
    if (refMatch) {
      references.push({
        column: refMatch[1].replace(/`/g, ''),
        parentTable: refMatch[2].replace(/`/g, ''),
        parentColumn: refMatch[3].replace(/`/g, ''),
      })
    }
  }

  return references
}

function main() {
  const stream = Readable.from(readdirSync(SourceDir))
  stream.on('data', async (file) => {
    if (file.endsWith('.sql')) {
      try {
        const content = readFileSync(path.join(SourceDir, file), 'utf8')
        const {tableName, columns, references} = parseColumns(content)
        // console.log('references:', tableName, references)
        const seedSql = generateInsert(tableName, columns, references)

        const filenameBase = path.parse(file).name
        const outputFilename = `${filenameBase}_seed.sql`
        const outputPath = path.join(OutputDir, outputFilename)

        const outputContent = `-- +++ UP +++\n${seedSql}\n-- +++ DOWN +++\n\n`
        await writeFileSync(outputPath, outputContent, 'utf8')
        // console.log(`✅ Created seed for table: ${tableName}`)
      } catch (err) {
        console.error(`❌ Failed to process ${file}: ${err.message}`)
      }
    }
  })
}

main()
