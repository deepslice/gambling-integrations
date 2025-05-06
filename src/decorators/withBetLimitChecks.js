// decorators/withBetLimitChecks.js
import { BetLimitService } from "@/BetLimit/BetLimitService";

export function withBetLimitChecks(handler) {
    return async (req, res, next) => {
        try {
            await BetLimitService.checkBetLimits(req.user.id, req.body.amount, req.params.provider);
            await BetLimitService.checkRestrictions(req.user.id, req.params.provider);
            return handler(req, res, next);
        } catch (err) {
            next(err);
        }
    }
}
