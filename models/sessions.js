const mongoose = require('mongoose')

// indexes:
// {user_id: 1, chat_id: 1}

const sessions = new mongoose.Schema({
  user_id: Number,
  chat_id: Number,
  data: {},
}, {versionKey: false})

module.exports = mongoose.model('sessions', sessions)
