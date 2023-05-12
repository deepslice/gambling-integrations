import http from 'node:http'
import express from 'express'
import {gameInitHandler} from './game-init.handler.js'
import {logger} from '../utils/logger.js'

const app = express()

app.use(express.json())
app.use(logger)

app.post('/api/game-init', gameInitHandler)

// app.use(errorHandler)

const server = http.createServer(app)

const PORT = Number(process.env.PORT)

server.listen(PORT, () => console.log(`Aspect ms listens at http://localhost:${PORT}`))
