const pluralizeIndex = (n) => {
  if (n % 10 === 1 && n % 100 !== 11) {
    return 0
  }
  return n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2
}

const isNotModified = (error) => error.description && error.description.match && error.description.match(/not modified/i)
const catchNotModified = (error) => {
  if (isNotModified(error)) {
    return true
  }
  throw error
}

module.exports = {
  getUserString(from) {
    return `${from.first_name}${from.last_name ? ` ${from.last_name}` : ''}${from.username ? ` @${from.username}` : ''}`
  },
  randint: (a, b) => a + Math.floor(Math.random() * (b - a)),
  pad(num, size) {
    let s = num.toString()
    while (s.length < size) s = '0' + s
    return s
  },
  wait: (ms) => new Promise((r) => setTimeout(r, ms)),
  pluralizeIndex,

  isNotModified,
  catchNotModified,
}
