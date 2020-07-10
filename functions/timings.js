const fmtMs = (v) => v[0] * 1000 + v[1] / 1e6 // ms
const fmtPrc = (v, n = 0) => fmtMs(v).toFixed(n) // ms
const hrt = (...v) => process.hrtime(...v)

module.exports = {
  fmtMs,
  fmtPrc,
  hrt,
}
