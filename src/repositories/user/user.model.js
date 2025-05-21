import container from '#app/dependencies/container.deps'

export class UserModel {

  constructor(database = container.database) {
    this.database = database
  }

  async getUserInfo(userId) {
    const [[user]] = await this.database.query(`
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
        WHERE id = ? FOR UPDATE`, [userId],
    )

    return user
  }

  async getUserBalance(userId) {
    const [[userBalance]] = await this.database.query(`
        select ? / ? as balance, ? * ? as convertedAmount
        from users
        where id = ?
    `, [user.balance, rate, user?.convertedAmount || 0, rate, user.id])
  }

  async updateUserBalance(data) {
    await this.database.query(`
        update users
        set balance      = balance + ?,
            real_balance = real_balance + ?
        where id = ?
    `, [data.amount, data.isReal ? data.amount : 0, data.playerId])
  }

  // TODO: Not implemented yet
  async getUserParents() {

  }
}

export const userRepository = new UserModel()
