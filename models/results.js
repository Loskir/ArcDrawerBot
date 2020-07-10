const mongoose = require('mongoose')

const results = new mongoose.Schema({
  user_id: Number,

  url: String,

  status: {
    type: Number,
    default: 0,
  },
  // 0 - не готов
  // 1 - готовится
  // 2 - готов

  created_at: Date,
  updated_at: Date,
})
results.pre('save', function (next) {
  if (this.created_at === undefined) {
    this.created_at = new Date()
  }
  this.updated_at = new Date()
  return next()
})

module.exports = mongoose.model('results', results)
