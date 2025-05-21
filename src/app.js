import express from 'express'

import apiRoutes from '#integrations/aspect/routes/api.routes'
import walletRoutes from '#integrations/aspect/routes/wallet.routes'

const app = express()

switch (process.env.PROJECT) {
  case 'aspect':
    app.use('/aspect/api', apiRoutes)
    app.use('/aspect/wallet', walletRoutes)
    break
  default:
    throw new Error('Invalid project id')
}

app.use(express.json())
export default app

await app.listen(process.env.APP_PORT || 3000)
