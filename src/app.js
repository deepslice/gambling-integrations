import express from 'express'

import walletRoutes from '#app/web/routes/wallet.routes'

const app = express()

app.use('/api/v1/wallet', walletRoutes)

app.use(express.json())
export default app

await app.listen(process.env.APP_PORT || 3000)
