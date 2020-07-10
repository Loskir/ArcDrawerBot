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
  wait: (ms) => new Promise((r) => setTimeout(r, ms))
}
