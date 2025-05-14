// BetLimit/BetLimitService.js
import {LimitStore} from './limits.store'

export class LimitChecker {
  static async checkBetLimits(userId, amount, provider) {
    const limits = await LimitStore.getForUser(userId)
    if (amount > limits[provider]) {
      throw new BetLimitExceededError(provider)
    }
  }

  static async checkRestrictions(userId, provider) {
    const restrictions = await LimitStore.getForUser(userId)
    if (restrictions.blockedProviders.includes(provider)) {
      throw new RestrictedProviderError(provider)
    }
  }
}
