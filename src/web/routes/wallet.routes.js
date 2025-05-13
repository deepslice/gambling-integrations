import {Router} from 'express'
import {WalletController} from '#app/web/controllers/wallet.controller'
import {authenticateSession} from '#app/modules/auth/middlewares/auth-session.middleware'
import {authenticateToken} from '#app/modules/auth/middlewares/auth-token.middleware'

const router = Router()

/**
 * Wallet Routes
 */

router.get(
  '/balances',
  authenticateSession, authenticateToken,
  WalletController.getBalance,
)
router.post(
  '/deposits',
  authenticateSession, authenticateToken,
  WalletController.depositFunds,
)
router.post(
  '/withdrawals',
  authenticateSession, authenticateToken,
  WalletController.withdrawFunds,
)
router.post(
  '/rollbacks',
  authenticateSession,
  WalletController.rollback,
)

export default router
