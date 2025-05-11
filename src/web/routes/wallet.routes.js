import {Router} from 'express'
import {WalletController} from '@/web/controllers/wallet.controller.js'
import {authenticateSession} from '@/modules/auth/middlewares/auth-session.middleware.js'

const router = Router()

/**
 * Wallet Routes
 */
router.get('/balances', authenticateSession, WalletController.getBalance)
router.post('/deposits', authenticateSession, WalletController.depositFunds)
router.post('/withdrawals', authenticateSession, WalletController.withdrawFunds)
router.post('/rollbacks', authenticateSession, WalletController.rollback)

export default router
