import express from 'express'
import http from 'node:http'
import * as handlers from './handlers/index.js'
import {logger} from '../utils/logger.js'

const PORT = process.env.PORT
const app = express()

app.use(express.json())

app.use(logger)


app.get('/api/balance', handlers.middleware, handlers.getBalanceHandler)
app.post('/api/debit', handlers.middleware, handlers.debitHandler)


const server = http.createServer(app)

server.listen(PORT, () => console.log(`Aspect wallet listen at http://localhost:${PORT}/`))
