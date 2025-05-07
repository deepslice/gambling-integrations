// Базовый класс исключения
export class AppError extends Error {
  constructor(message, statusCode = 400, details = null) {
    super(message)
    this.name = this.constructor.name
    this.statusCode = statusCode
    this.details = details
    Error.captureStackTrace(this, this.constructor)
  }
}

// Для отсутствующих полей
export class FieldNotFoundError extends AppError {
  constructor(fieldName, context = '') {
    super(`Required field '${fieldName}' not found${context ? ` in ${context}` : ''}`, 400)
    this.field = fieldName
  }
}

// Для валидации
export class ValidationError extends AppError {
  constructor(errors) {
    super('Validation failed', 422, {errors})
  }
}

// Для 404
export class NotFoundError extends AppError {
  constructor(resource) {
    super(`${resource || 'Resource'} not found`, 404)
  }
}

// Для авторизации
export class AuthError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401)
  }
}

// Для доступа
export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403)
  }
}
