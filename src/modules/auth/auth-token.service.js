import {ConfigService} from '#app/modules/config/config.service'
import {assertField} from '#app/utils/assert.util'

export class AuthTokenService {

  constructor(configService = new ConfigService()) {
    this.configService = configService
  }

  async getSecretKey() {
    const projectConfig = await this.configService.LoadConfig()
    return assertField(projectConfig, 'secretKey')
  }

  /**
   * validateToken
   * @param token
   * @param originUrl
   * @returns {Promise<boolean>}
   */
  async validateToken(originUrl, token) {
    const secretKey = await this.getSecretKey()

    const secret = `${secretKey}` + `${originUrl.substring(4)}`
    const secretToken = crypto.createHash('md5').update(secret).digest('hex')

    return (`AUTH ${secretToken.toUpperCase()}` === token)
  }
}
