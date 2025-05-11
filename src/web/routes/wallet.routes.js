import {Router} from 'express'
import {WalletController} from '#app/web/controllers/wallet.controller'
import {authenticateSession} from '#app/modules/auth/middlewares/auth-session.middleware'

const router = Router()

/**
 * Wallet Routes
 */
router.get('/balances', authenticateSession, WalletController.getBalance)
router.post('/deposits', authenticateSession, WalletController.depositFunds)
router.post('/withdrawals', authenticateSession, WalletController.withdrawFunds)
router.post('/rollbacks', authenticateSession, WalletController.rollback)

export default router
