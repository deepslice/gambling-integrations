import {AuthSessionService} from '#app/modules/auth/auth-session.service'

export const authenticateSession = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] // AUTH <token>

  if (!token) {
    return res.status(401).json({message: 'No token provided'})
  }

  AuthSessionService.validateSessionToken(token).then(isValid => {
    if (!isValid) {
      return res.status(403).json({message: 'Invalid token'})
    }

    req.token = token
    next()
  })
}
