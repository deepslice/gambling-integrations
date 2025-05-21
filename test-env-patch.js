import {databaseConnection} from '@core-infra/database'

async function insertData(data) {
  const columns = data.columns.map(col => `\`${col}\``).join(', ')
  const placeholders = data.values.map(() => '?').join(', ')

  const connection = await databaseConnection.getConnection()
  try {
    await connection.query(`
                insert into \`${data.table}\` (${columns})
                values (${placeholders});`,
      [...data.values])
  } catch (e) {
    throw e
  } finally {
    connection.release()
  }
}

async function addUser(data) {
  const user = {
    table: 'users',
    columns: [
      'uid',
      'segment',
      'username',
      'password',
      'email',
      'phone',
      'birth',
      'balance',
      'real_balance',
      'plus_bonus',
      'bonus',
      'currency',
      'active',
      'verified',
      'deleted',
      'test',
      'agent_id',
      'sign_in_version',
      'created_at',
      'options',
    ],
    values: [
      data.uid,
      data.segment,
      data.username,
      data.password,
      data.email,
      data.phone,
      data.birth,
      data.balance,
      data.real_balance,
      data.plus_bonus,
      data.bonus,
      data.currency,
      data.active,
      data.verified,
      data.deleted,
      data.test,
      data.agent_id,
      data.sign_in_version,
      data.created_at,
      data.options,
    ],
  }

  await insertData(user)
}

async function main() {
  await databaseConnection.connect({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'root',
    database: 'mydb',
    multipleStatements: true,
    waitForConnections: true,
    connectionLimit: 5,
  })

  await addUser({
    uid: '123456789',
    segment: '1',
    username: 'test',
    password: '<PASSWORD>',
    email: '<EMAIL>',
    phone: '1234567890',
    birth: '1990-01-01',
    balance: 1000.00,
    real_balance: 1000.00,
    plus_bonus: 0.00,
    bonus: 0.00,
    currency: 'USD',
    active: 1,
    verified: 1,
    deleted: 0,
    test: 0,
    agent_id: 43,
    sign_in_version: 0,
    options: '{}',
  })

  const connection = await databaseConnection.getConnection()
  const [[{prefix}]] = await connection.query(`
      select prefix
      from casino.aspect_configs limit 1`)

  const [[settings]] = await connection.query(`
      select *
      from global.settings
      where prefix = ?`, [prefix])

  if (!settings) {
    await connection.query(`
        insert into global.settings (id, name, project, prefix, db_name, configs, sportsbook, readonly)
        values (NULL,
                'default',
                'casino',
                ?,
                'casino',
                '{ "currency": "USD", "database": "", "secretKey": "test", "operatorId": "12345" }',
                0,
                0);`, [prefix])

    await connection.query(`
        insert into global.configurations (prefix, code, value)
        values (?, 'balance_limit', '1000');`, [prefix])

    await connection.query(`
        insert into global.configurations (prefix, code, value)
        values (?, 'win_limit', '1000');`, [prefix])
  }

  console.log('prefix:', prefix)
}

main().catch(e => console.log(e))
