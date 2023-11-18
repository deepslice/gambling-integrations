import crypto from 'node:crypto'
import {gzipJSON} from './compress.js'

export async function getPrData(type, month, user, data) {
  const str = `${user.prefix}:${user.id}:${user.currency}`

  const md5Hash = crypto.createHash('md5').update(str).digest('hex')
  let sumResult = 0

  for (let i = 0; i < md5Hash.length; i++) {
    sumResult += parseInt(md5Hash[i], 16)
  }

  const uuid = (sumResult % 64).toString().padStart(4, '0')
  const payload = {type, user, month, ...data}
  const buffer = await gzipJSON(payload)

  return {
    uuid,
    payload,
    buffer,
  }
}
