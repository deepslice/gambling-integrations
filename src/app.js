import express from 'express'
import {databaseConnection} from '#app/infrastructure/database/connection'
import walletRoutes from '#app/web/routes/wallet.routes'

// TODO: Make DI Cointainer
async function bootstrap() {
  await databaseConnection.connect()

}

const app = express()

app.use('/api/v1/wallet', walletRoutes)

app.use(express.json())
export default app


await app.listen(process.env.APP_PORT || 3000)
