// BetLimit/BetLimitService.js
import { BetLimitModel } from "./BetLimitModel";

export class BetLimitService {
    static async checkBetLimits(userId, amount, provider) {
        const limits = await BetLimitModel.getForUser(userId);
        if (amount > limits[provider]) {
            throw new BetLimitExceededError(provider);
        }
    }

    static async checkRestrictions(userId, provider) {
        const restrictions = await RestrictionModel.getForUser(userId);
        if (restrictions.blockedProviders.includes(provider)) {
            throw new RestrictedProviderError(provider);
        }
    }
}