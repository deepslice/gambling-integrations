import zlib from 'node:zlib'
import util from 'node:util'

const gzip = util.promisify(zlib.gzip)
const gunzip = util.promisify(zlib.gunzip)

export async function gzipJSON(object) {
  return gzip(Buffer.from(JSON.stringify(object), 'utf-8'))
}

export async function gunzipJSON(value) {
  if (!value) {
    return null
  }
  const payload = await gunzip(value)
  return JSON.parse(payload.toString())
}
