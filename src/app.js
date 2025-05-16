import express from 'express'

import apiRoutes from '#app/web/routes/api.routes'
import walletRoutes from '#app/web/routes/wallet.routes'

function bootstrap() {

}

const app = express()
app.use(express.json())

app.use('/api/v1/api', apiRoutes)
app.use('/api/v1/wallet', walletRoutes)

app.use(express.json())
export default app

await app.listen(process.env.APP_PORT || 3000)
