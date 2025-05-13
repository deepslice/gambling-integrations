import {AuthSessionService} from '#app/modules/auth/auth-session.service'
import {assertField} from '#app/utils/assert.util'

export const authenticateSession = (req, res, next) => {
  const token = assertField(req.query, 'token') // Session token

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
