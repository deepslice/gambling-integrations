export function fixNumber(number) {
  const num = number.toString()
  const index = num.indexOf('.')
  if (index === -1) {
    return number
  }


  return Number(num.substring(0, index + 3))
}