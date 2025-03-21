import express from 'express'
import cors from 'cors'
import http from 'node:http'
import * as v2 from './v2/index.js'
import {logger} from '../utils/logger.js'

const PORT = process.env.PORT
const app = express()

app.use(cors())
app.use(express.json())
app.use(logger)


app.get('/api/authenticate', v2.middleware, v2.authenticateHandler)
app.get('/api/balance', v2.middleware, v2.getBalanceHandler)
app.post('/api/debit', v2.middleware, v2.debitHandler)
app.post('/api/credit', v2.middleware, v2.creditHandler)
app.post('/api/rollback', v2.middleware, v2.rollbackHandler)


const server = http.createServer(app)

server.listen(PORT, () => console.log(`Aspect wallet listen at http://localhost:${PORT}/`))
