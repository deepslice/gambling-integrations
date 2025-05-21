import {Router} from 'express'
import {walletController} from 'integrations/aspect/controllers/wallet.controller.js'
import {authenticateSession} from '#app/modules/auth/middlewares/auth-session.middleware'
import {authenticateToken} from '#app/modules/auth/middlewares/auth-token.middleware'
import {withLimitsChecks} from '#app/modules/limits/wrappers/with-limits-check.wrapper'

const router = Router()

/**
 * Wallet Routes
 */

router.get('/balances', authenticateSession, walletController.getBalance)
router.post('/deposits', authenticateSession, authenticateToken, withLimitsChecks(walletController.debit))
router.post('/withdrawals', authenticateSession, authenticateToken, withLimitsChecks(walletController.credit))
router.post('/rollbacks', authenticateSession, authenticateToken, walletController.rollback)

export default router
