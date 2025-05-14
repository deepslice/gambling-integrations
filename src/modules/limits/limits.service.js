import {LimitsModel} from '#app/repositories/limits/limits.model'
import {RestrictsModel} from '#app/repositories/restrictions/restrictions.model'

export class LimitService {

  constructor(
    limitsRepository = new LimitsModel(),
    restrictsRepository = new RestrictsModel(),
  ) {
    this.limitsRepository = limitsRepository
    this.restrictsRepository = restrictsRepository
  }

  async checkLimits(data) {
    const limits = await this.limitsRepository.getLimits(data)
    if (!limits || limits.betLimit < 0) {
      throw new LimitExceededError(limits)
    }
  }

  async checkBetLimits(data) {
    const betLimits = await this.limitsRepository.getBetLimits(data)
    if (!betLimits || betLimits < data.convertedAmount) {
      throw new BetLimitExceededError(betLimits)
    }
  }

  async checkRestrictions(data) {
    const restrictions = await this.restrictsRepository.getRestrictions(data)
    if (!restrictions || restrictions.ggr < data.amount || restrictions.difference <= 0) {
      throw new RestrictionExceededError(restrictions)
    }
  }
}
