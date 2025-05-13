import {AuthTokenService} from '#app/modules/auth/auth-token.service'
import {AuthSessionService} from '#app/modules/auth/auth-session.service'
import {assertField} from '#app/utils/assert.util'

export const authenticateToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] // AUTH <token>
  const sessionToken = assertField(req.query, 'token')

  if (!token || !sessionToken) {
    return res.status(401).json({message: 'No token provided'})
  }

  const session = await AuthSessionService.getSession(sessionToken)
  if (!session) {
    return res.status(403).json({message: 'Invalid session'})
  }

  const prefix = assertField(session, 'prefix')
  AuthTokenService.validateToken(prefix, req.originalUrl, token).then(isValid => {
    if (!isValid) {
      return res.status(403).json({message: 'Invalid token'})
    }

    req.token = token
    next()
  })
}
