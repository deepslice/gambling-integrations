// services/wagerPolicy.js
const BetLimit = import('@/models/HouseLimit');

export class WagerPolicy {
    static async checkBetLimits(userId, amount, provider) {
        const limits = await BetLimit.getForUser(userId);
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
