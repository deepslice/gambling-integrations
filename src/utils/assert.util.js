import {FieldNotFoundError} from './exceptions.util.js'

export function assertField(obj, field, context = '') {
  if (obj[field] === undefined) {
    throw new FieldNotFoundError(field, context)
  }
  return obj[field]
}
