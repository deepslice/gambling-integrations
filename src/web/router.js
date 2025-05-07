import express from 'express'

const router = express.Router()

router.get('/api/v1/game-init')
router.get('/api/v1/balance')
router.post('/api/v1/bet')
router.post('/api/v1/resolve')
router.post('/api/v1/rollback')

export default router