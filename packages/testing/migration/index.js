import path from 'node:path'
import fs from 'node:fs'
import {databaseConnection} from 'core-infra/database/connection.js'

const applied = new Set()
const DEFAULT_MIGRATIONS_DIR = path.join(process.cwd(), 'migrations')

async function init() {
  const connection = await databaseConnection.getConnection()
  try {
    await connection.query(`CREATE TABLE IF NOT EXISTS migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      run_on DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`)
    const [rows] = await connection.query('SELECT name FROM migrations')
    rows.forEach(row => applied.add(row.name))
  } finally {
    connection.release()
  }
}

async function parseSqlFile(filepath) {
  const content = fs.readFileSync(filepath, 'utf-8')
  const upMatch = content.match(/--\s*\+{3}\s*UP\s*\+{3}\s*\n([\s\S]*?)--\s*\+{3}/i)
  const downMatch = content.match(/--\s*\+{3}\s*DOWN\s*\+{3}\s*\n([\s\S]*)/i)

  return {
    up: upMatch?.[1]?.trim() || '',
    down: downMatch?.[1]?.trim() || '',
  }
}

function getMigrationsDir() {
  const args = process.argv
  const dirIndex = args.findIndex(arg => arg === '--dir' || arg === '-d')

  if (dirIndex !== -1 && args.length > dirIndex + 1) {
    return path.resolve(args[dirIndex + 1])
  }

  return DEFAULT_MIGRATIONS_DIR
}

async function applyMigration(file, fullPath) {
  if (applied.has(file)) return

  const {up} = await parseSqlFile(fullPath)
  if (!up) {
    console.warn(`⚠️ No UP section found in migration: ${file}`)
    return
  }

  console.log(`Applying migration: ${file}`)
  const connection = await databaseConnection.getConnection()

  try {
    await connection.beginTransaction()
    await connection.query(up)
    await connection.query(
      'INSERT INTO migrations (name) VALUES (?)',
      [file],
    )
    await connection.commit()
    console.log(`✅ Applied migration: ${file}`)
  } catch (e) {
    await connection.rollback()
    throw new Error(`❌ Error applying migration: ${file}\n${e.message}`)
  } finally {
    connection.release()
  }
}

async function walkDirAndMigrate(dir) {
  if (!fs.existsSync(dir)) {
    throw new Error(`Migrations directory not found: ${dir}`)
  }

  const files = fs.readdirSync(dir)
    .filter(file => file.endsWith('.sql'))
    .sort() // Apply migrations in alphabetical order

  for (const file of files) {
    const fullPath = path.join(dir, file)
    const stats = fs.statSync(fullPath)

    if (stats.isFile()) {
      await applyMigration(file, fullPath)
    }
  }
}

async function main() {
  const command = process.argv[2]
  const migrationsDir = getMigrationsDir()

  await databaseConnection.connect({
    host: 'localhost',
    port: 3306,
    user: 'root',
    database: 'mydb',
    password: 'root',
    multipleStatements: true,
    waitForConnections: true,
    connectionLimit: 5,
  })

  try {
    await init()

    if (command === 'up') {
      console.log(`🔍 Looking for migrations in: ${migrationsDir}`)
      await walkDirAndMigrate(migrationsDir)
      console.log('✅ All migrations applied successfully.')
    } else {
      console.log('Usage: node migrate.js up [--dir /path/to/migrations]')
    }
  } finally {
    await databaseConnection.close()
  }
}

main().catch(err => {
  console.error('❌ Migration error:', err.message)
  process.exit(1)
})
