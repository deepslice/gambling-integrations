import {AppError} from '#app/utils/exceptions.util'

// Ошибка превышения лимита
export class LimitExceededError extends AppError {
  constructor(errors) {
    super('Limits validation failed', 422, {errors})
  }
}

// Ошибка превышения лимита на сумму бета
export class BetLimitExceededError extends AppError {
  constructor(errors) {
    super('Bet limits validation failed', 422, {errors})
  }
}

// Ошибка превышения ограничений
export class RestrictionExceededError extends AppError {
  constructor(errors) {
    super('Restrictions validation failed', 422, {errors})
  }
}
