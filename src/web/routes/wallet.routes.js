import {Router} from 'express'
import {walletController} from '#app/web/controllers/wallet.controller'
import {authenticateSession} from '#app/modules/auth/middlewares/auth-session.middleware'
import {authenticateToken} from '#app/modules/auth/middlewares/auth-token.middleware'
import {withLimitsChecks} from '#app/modules/limits/wrappers/with-limits-check.wrapper'

const router = Router()

/**
 * Wallet Routes
 */

router.get('/balances', authenticateSession, walletController.getBalance)
router.post('/deposits', authenticateSession, authenticateToken, withLimitsChecks(walletController.depositFunds))
router.post('/withdrawals', authenticateSession, authenticateToken, withLimitsChecks(walletController.withdrawFunds))
router.post('/rollbacks', authenticateSession, authenticateToken, walletController.rollback)

export default router
