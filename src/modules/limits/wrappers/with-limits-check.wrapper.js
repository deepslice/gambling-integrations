import {LimitsService} from '#app/modules/limits/limits.service'

export function withLimitsChecks(handler) {
  return async (req, res, next) => {
    try {
      await LimitsService.checkLimits(req.user.id, req.body.amount, req.params.provider)
      await LimitsService.checkBetLimits(req.user.id, req.body.amount, req.params.provider)
      await LimitsService.checkRestrictions(req.user.id, req.params.provider)
      return handler(req, res, next)
    } catch (err) {
      next(err)
    }
  }
}
