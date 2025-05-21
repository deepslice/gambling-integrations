import {limitsRepository} from '#app/repositories/limits/limits.model'
import {restrictsRepository} from '#app/repositories/restrictions/restrictions.model'
import {
  BetLimitExceededError,
  LimitExceededError,
  RestrictionExceededError,
} from '#app/modules/limits/limits.exceptions'

export class LimitsService {
  static async checkLimits(data) {
    const limits = await limitsRepository.getLimits(data)
    if (!limits || limits.betLimit < 0) {
      throw new LimitExceededError(limits)
    }
  }

  static async checkBetLimits(data) {
    const betLimits = await limitsRepository.getBetLimits(data)
    if (!betLimits || betLimits < data.convertedAmount) {
      throw new BetLimitExceededError(betLimits)
    }
  }

  static async checkRestrictions(data) {
    const restrictions = await restrictsRepository.getRestrictions(data)
    if (!restrictions || restrictions.ggr < data.amount || restrictions.difference <= 0) {
      throw new RestrictionExceededError(restrictions)
    }
  }
}
