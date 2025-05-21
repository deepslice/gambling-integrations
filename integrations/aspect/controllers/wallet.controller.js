import {getBalance} from '#app/services/wallet/balance.wallet'
import {assertField} from '#app/utils/assert.util'

export class WalletController {

  async getBalance(req, res) {
    const session = assertField(req, 'session')
    const gameId = assertField(req.query, 'gameId')
    const balance = await getBalance(session, gameId)

    res.status(200).json({
      success: true,
      balance: balance,
    }).end()
  }

  async debit(req, res) {
    res.status(200).end()
  }

  async credit(req, res) {
    res.status(200).end()
  }

  async rollback(req, res) {
    res.status(200).end()
  }
}

export const walletController = new WalletController()
