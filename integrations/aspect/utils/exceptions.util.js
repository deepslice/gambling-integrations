/**
 * Aspect's error codes
 * See: https://docs.aspectgaming.dev/s/2er3IFONC#ErrorCode
 */
const InvalidPlayerErrorCode = 1001
const InvalidTokenErrorCode = 1002
const InvalidGameIdErrorCode = 1008
const GameUnavailableErrorCode = 1012
const InsufficientFundsErrorCode = 1003
const DuplicateTransactionKeyErrorCode = 1028
const AmountCannotBeNegativeErrorCode = 1026
const NoDebitBeforeCreditErrorCode = 1023
const TransactionNotFoundErrorCode = 1029
const RoundHasBeenCanceledErrorCode = 1030
const CouldNotRollbackAfterCreditErrorCode = 1024
const NoDebitTransactionToRollbackErrorCode = 1025

export class ResponseError {
  constructor(error, code) {
    this.error = error
    this.code = code
  }
}

export class InvalidPlayerError extends ResponseError {
  constructor(error = 'Invalid Player') {
    super(error, InvalidPlayerErrorCode)
  }
}

export class InvalidGameIdError extends ResponseError {
  constructor(error = 'Invalid Game ID') {
    super(error, InvalidGameIdErrorCode)
  }
}

export class InsufficientFundsError extends ResponseError {
  constructor(error = 'Insufficient Funds') {
    super(error, InsufficientFundsErrorCode)
  }
}
