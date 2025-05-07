import express from 'express'
import jwt from 'jsonwebtoken'

const app = express()
const SECRET_KEY = 'your-secret-key'

// Middleware для проверки JWT
const authenticateSessionToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] // Bearer <token>

  if (!token) {
    return res.status(401).json({message: 'No token provided'})
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({message: 'Invalid token'})
    }
    req.user = user // Сохраняем данные пользователя в запросе
    next()
  })
}

const authenticatePersistentToken = (req, res, next) => {

}
