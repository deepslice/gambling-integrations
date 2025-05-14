import {BetLimitService} from '#app/BetLimit/BetLimitService'

export function withLimitsChecks(handler) {
  return async (req, res, next) => {
    try {
      await BetLimitService.checkLimits(req.user.id, req.body.amount, req.params.provider)
      await BetLimitService.checkBetLimits(req.user.id, req.body.amount, req.params.provider)
      await BetLimitService.checkRestrictions(req.user.id, req.params.provider)
      return handler(req, res, next)
    } catch (err) {
      next(err)
    }
  }
}
