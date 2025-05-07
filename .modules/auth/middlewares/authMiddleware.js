import {TokenAuthService} from '../services/tokenAuthService'

const tokenAuthService = new TokenAuthService('aspect-initial-token')

const tokenAuthMiddleware = async (req, res, next) => {
  const token = req.query['token']

  if (!token) {
    return UnauthorizedException('No token provided')
  }

  const isValid = await tokenAuthService.validateToken(token, token)

  if (!isValid) {
    return UnauthorizedException('Invalid or expired token')
  }

  next()
}
