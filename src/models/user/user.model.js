import dbConnection from '#app/infrastructure/.deprecated/db.connection'

export class UserModel {
  static async getUserBalance(useId) {
    const [[userBalance]] = await trx.query(`
        select ? / ? as balance
             , ? * ? as convertedAmount
        from users
        where id = ?
    `, [user.balance, rate, user?.convertedAmount || 0, rate, user.id])
  }

  static async getUserInfo(userId) {
    const conn = dbConnection.getConnection()

    const [[user]] = await conn.query(`
        SELECT id                                      AS id
             , balance                                 AS balance
             , balance                                 AS nativeBalance
             , real_balance                            AS realBalance
             , json_extract(options, '$.transactions') AS status
             , username                                AS username
             , agent_id                                AS parentId
             , currency                                AS currency
             , currency                                AS nativeCurrency
             , active                                  AS active
             , deleted                                 AS deleted
             , unix_timestamp(created_at)              AS createdAt
        FROM users
        WHERE id = ? FOR
            UPDATE`, [userId],
    )

    return user
  }

  static async getUserParents() {

  }
}
