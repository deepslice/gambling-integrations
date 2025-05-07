export class ResponseError {
  constructor(error, code) {
    this.error = error
    this.code = code
  }
}

export class InvalidPlayerError extends ResponseError {
  constructor(error = 'Invalid Player') {
    super(error, 1)
  }
}

export class InvalidGameError extends ResponseError {
  constructor(error = 'Invalid Game ID') {
    super(error, 1008)
  }
}

export class InsufficientFundsError extends ResponseError {
  constructor(error = 'Insufficient Funds') {
    super(error, 1003)
  }
}
