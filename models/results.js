const mongoose = require('mongoose')

const results = new mongoose.Schema({
  user_id: Number,

  url: String,
  as_avatar: {
    type: Boolean,
    default: false,
  },
  background_color: {
    type: String,
    default: 'white',
  },

  status: {
    type: Number,
    default: 0,
  },
  // 0 - не готов
  // 1 - готовится
  // 2 - готов
  // 3 - ошибка
  error: String,

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
