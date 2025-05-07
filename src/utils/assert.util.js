import {FieldNotFoundError} from '../exceptions.mjs'

export function assertField(obj, field, context = '') {
  if (obj[field] === undefined) {
    throw new FieldNotFoundError(field, context)
  }
  return obj[field]
}
