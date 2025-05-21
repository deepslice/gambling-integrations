import {getBalance} from '#app/services/wallet/balance.wallet'
import {assertField} from '#app/utils/assert.util'

export class WalletController {

  getBalance = async (req, res) => {
    const response = await getBalance(
      assertField(req, 'session'),
      assertField(req.query, 'gameId'),
    )
    res.status(200).json(response).end()
  }

  depositFunds = async (req, res) => {
    res.status(200).end()
  }

  withdrawFunds = async (req, res) => {
    res.status(200).end()
  }

  rollback = async (req, res) => {
    res.status(200).end()
  }
}

export const walletController = new WalletController()
