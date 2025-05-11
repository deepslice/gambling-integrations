import express from 'express'
import walletRoutes from '@/web/routes/wallet.routes.js'

const app = express()

app.use('/api/v1/wallet', walletRoutes)

app.use(express.json())
export default app
