import express from 'express'

import apiRoutes from 'integrations/aspect/routes/api.routes.js'
import walletRoutes from 'integrations/aspect/routes/wallet.routes.js'

function bootstrap() {

}

const app = express()
app.use(express.json())

app.use('/api/v1/api', apiRoutes)
app.use('/api/v1/wallet', walletRoutes)

app.use(express.json())
export default app

await app.listen(process.env.APP_PORT || 3000)
