export const getCurrentDatetime = () => {

  let timestamp = Date.now() + 4 * 60 * 60 * 1000
  const date = new Date(timestamp)

  const ms = timestamp % 1000
  timestamp = parseInt((timestamp - ms) / 1000)

  const s = timestamp % 60
  timestamp = parseInt((timestamp - s) / 60)

  const m = timestamp % 60
  timestamp = parseInt((timestamp - m) / 60)

  const h = timestamp % 24
  timestamp = parseInt((timestamp - h) / 24)

  const d = date.getDate()
  const M = date.getMonth() + 1
  const y = date.getFullYear()

  return `${n2s(y, 4)}/${n2s(M)}/${n2s(d)} ${n2s(h)}:${n2s(m)}:${n2s(s)}.${n2s(ms, 3, false)}`
}


function n2s(n, d = 2, start = true) {
  if (start) {
    return n.toString().padStart(d, '0')
  }

  return n.toString().padEnd(d, '0')
}
