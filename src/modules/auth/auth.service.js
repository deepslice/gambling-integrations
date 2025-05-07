// BetLimit/BetLimitService.js
import {AuthStore} from './auth.store.js'

export class AuthService {
  static async validateSessionToken(userId, amount, provider) {
    const limits = await AuthStore.getForUser(userId)
    if (amount > limits[provider]) {
      throw new BetLimitExceededError(provider)
    }
  }

  static async validatePersistentToken(userId, provider) {
    const restrictions = await AuthStore.getForUser(userId)
    if (restrictions.blockedProviders.includes(provider)) {
      throw new RestrictedProviderError(provider)
    }
  }
}
