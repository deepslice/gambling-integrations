import express from 'express'
import cors from 'cors'
import http from 'node:http'
import * as handlers from './handlers/index.js'
import * as v2 from './v2/index.js'
import * as maxWin from './max-win-handlers/index.js'
import {logger} from '../utils/logger.js'

const PORT = process.env.PORT
const app = express()

app.use(cors())
app.use(express.json())
app.use(logger)


app.get('/api/authenticate', handlers.middleware, handlers.authenticateHandler, v2.authenticateHandler)
app.get('/api/balance', handlers.middleware, handlers.getBalanceHandler, v2.getBalanceHandler)
app.post('/api/debit', handlers.middleware, handlers.debitHandler, v2.debitHandler, maxWin.debitHandler)
app.post('/api/credit', handlers.middleware, handlers.creditHandler, v2.creditHandler, maxWin.creditHandler)
app.post('/api/rollback', handlers.middleware, handlers.rollbackHandler, v2.rollbackHandler)


const server = http.createServer(app)

server.listen(PORT, () => console.log(`Aspect wallet listen at http://localhost:${PORT}/`))
