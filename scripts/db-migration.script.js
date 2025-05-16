import fs, {readdirSync, statSync} from 'node:fs'
import path from 'node:path'

import {databaseConnection} from '#app/infrastructure/database/connection'

// const sourceDir1 = 'db/migrations/0001-privileges'
// const sourceDir2 = 'db/migrations/0002-databases'
// const sourceDir3 = 'db/migrations/0003-schemas'
// const sourceDirs = [
//   sourceDir1,
//   sourceDir2,
//   sourceDir3,
// ]

const sourceDir1 = 'db/testdata/0001-global'
const sourceDir2 = 'db/testdata/0002-casino'
const sourceDir3 = 'db/testdata/0003-local'
const sourceDirs = [
  sourceDir1,
  sourceDir2,
  sourceDir3,
]

async function parseSqlFile(filepath) {
  const content = fs.readFileSync(filepath, 'utf-8')
  console.log('content:', content)
  const upMatch = content.match(/--\s*\+{3}\s*UP\s*\+{3}\s*\n([\s\S]*?)--\s*\+{3}/i)
  console.log('upMatch:', upMatch)
  const downMatch = content.match(/--\s*\+{3}\s*DOWN\s*\+{3}\s*\n([\s\S]*)/i)

  return {
    up: upMatch?.[1]?.trim() || '',
    down: downMatch?.[1]?.trim() || '',
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

  const connection = await databaseConnection.getConnection()
  // await connection.query(`
  //     create table IF NOT EXISTS migrations
  //     (
  //         id
  //         INT
  //         AUTO_INCREMENT
  //         PRIMARY
  //         KEY,
  //         name
  //         VARCHAR
  //     (
  //         255
  //     ) NOT NULL,
  //         run_on DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  //         );
  // `)
  //

  const [rows] = await connection.query('SELECT name FROM mydb.migrations')
  const applied = new Set(rows.map(row => row.name))
  connection.release()

  const walkDirAndMigrate = async (dir) => {
    const files = readdirSync(dir)
    for (const file of files) {
      const fullPath = path.join(dir, file)
      const stats = statSync(fullPath)
      if (stats.isDirectory()) {
        await walkDirAndMigrate(fullPath)
      } else {
        if (file.endsWith('.sql')) {
          if (!applied.has(file)) {
            const {up} = await parseSqlFile(fullPath)
            console.log(`Applying migration: ${fullPath}`)

            const connection = await databaseConnection.getConnection()
            try {
              await connection.beginTransaction()
              await connection.query(up)
              await connection.query(`
                          INSERT INTO mydb.migrations (name)
                          VALUES (?)`,
                [file])
              await connection.commit()
            } catch (e) {
              await connection.rollback()
              throw new Error('Error applying migration: ' + file + '\n' + e.message)
            } finally {
              connection.release()
            }
          }
        }
      }
    }
  }

  if (command === 'up') {
    await walkDirAndMigrate(sourceDirs[0])
    console.log('✅ All migrations applied.')
  }
}

main().catch(err => {
  console.error('Migration error:', err)
  process.exit(1)
})
