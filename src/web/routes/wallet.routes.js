import {Router} from 'express'
import {WalletController} from '#app/web/controllers/wallet.controller'
import {authenticateSession} from '#app/modules/auth/middlewares/auth-session.middleware'
import {authenticateToken} from '#app/modules/auth/middlewares/auth-token.middleware'
import {withLimitsChecks} from '#app/modules/limits/wrappers/with-limits-check.wrapper'

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
  withLimitsChecks(WalletController.depositFunds),
)
router.post(
  '/withdrawals',
  authenticateSession, authenticateToken,
  withLimitsChecks(WalletController.withdrawFunds),
)
router.post(
  '/rollbacks',
  authenticateSession, authenticateToken,
  WalletController.rollback,
)

export default router
