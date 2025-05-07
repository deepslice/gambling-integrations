import express from 'express'
import {connectDB} from './infrastructure/db.connection.js'
import authRouter from './src/routes/authRoutes.mjs'

const app = express()

// Middleware
app.use(express.json())

// Routes
app.use('/api/v1/auth', authRouter)

const start = async () => {
  try {
    await connectDB()
    app.listen(3000, () => console.log('Server started on port 3000'))
  } catch (err) {
    console.error('Failed to start:', err)
  }
}

start()
