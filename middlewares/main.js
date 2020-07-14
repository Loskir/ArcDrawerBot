const {Composer} = require('telegraf')

const Results = require('../models/results')

const {
  checkPendingByThisUser,
  getReplyTextByQueueLength,
} = require('../functions/telegram')

const composer = new Composer()

composer.on('photo', checkPendingByThisUser, async (ctx) => {
  const url = await ctx.telegram.getFileLink(ctx.message.photo[ctx.message.photo.length - 1].file_id)

  const queueLength = await Results.countDocuments({status: 0})

  await Results.create({
    user_id: ctx.from.id,
    url,
    status: 0,
  })

  console.log(`new result from ${ctx.from.id}`)

  return ctx.reply(getReplyTextByQueueLength(queueLength))
})

module.exports = composer
