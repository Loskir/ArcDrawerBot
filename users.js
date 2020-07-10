const mongoose = require('mongoose')

// unique indexes:
// {user_id: 1}

const users = new mongoose.Schema({
  user_id: Number,

  username: String,
  first_name: String,
  last_name: String,

  language_code: String,

  is_disabled: {
    type: Boolean,
    default: false
  },

  created_at: Date,
})

const Users = mongoose.model('users', users)

module.exports = async (ctx, next) => {
  // игнорить при не приватных апдейтах
  if (!(ctx.chat && ctx.chat.type === 'private')) {
    return next()
  }

  let user
  try {
    user = await Users.findOne({user_id: ctx.from.id})
    let params = {
      user_id: ctx.from.id,
      first_name: ctx.from.first_name,
      last_name: ctx.from.last_name,
      username: ctx.from.username,
      language_code: ctx.from.language_code,
      created_at: new Date(),
    }

    if (!user) {
      user = await Users.create(params)

      void ctx.telegram.sendMessage(89307233, `New user: <a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}${ctx.from.last_name ? ' '+ctx.from.last_name : ''}</a>`, {parse_mode: 'HTML'})
      console.log(ctx.from.id, 'new')
    } else {
      user = await Users.findByIdAndUpdate(user._id, {$set: {is_disabled: false}}, {new: true})
    }
  } catch (error) {
    console.error('Error user', error)
  }
  ctx.user = user || {}
  return next()
}
