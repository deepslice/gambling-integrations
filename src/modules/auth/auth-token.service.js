import {configService} from '#app/modules/config/config.service'
import {assertField} from '#app/utils/assert.util'

export class AuthTokenService {
  /**
   * validateToken
   * @param token
   * @param originUrl
   * @returns {Promise<boolean>}
   */
  static async validateToken(originUrl, token) {
    const secretKey = await AuthTokenService.getSecretKey()

    const secret = `${secretKey}` + `${originUrl.substring(4)}`
    const secretToken = crypto.createHash('md5').update(secret).digest('hex')

    return (`AUTH ${secretToken.toUpperCase()}` === token)
  }

  /**
   * getSecretKey
   * @returns {Promise<string>}
   */
  static async getSecretKey() {
    const projectConfig = await configService.LoadConfig()
    return assertField(projectConfig, 'secretKey')
  }
}
