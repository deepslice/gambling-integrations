import axios from 'axios'
import {AuthSessionService} from '#app/modules/auth/auth-session.service'
import {randomBytes} from 'node:crypto'
import {configService} from '#app/modules/config/config.service'

export class ApiService {
  async gameInit(data) {
    const {gameId, userId, prefix, wageringBalanceId} = data

    const config = await configService.loadConfig(prefix)
    const projectId = config?.id
    const operatorId = config?.operatorId
    const token = randomBytes(36).toString('hex')

    await AuthSessionService.setSession(`aspect-initial-token:${token}`,
      JSON.stringify({userId, projectId, prefix, wageringBalanceId}),
      30 * 60 * 60,
    )

    try {
      const resp = await axios.get(`https://eu.agp.xyz/agp-launcher/${gameId}/?token=${token}&operatorId=${operatorId}&language=en-US`)
      return resp.config?.url
    } catch (e) {
      console.error('error', e)
      return null
    }
  }
}
