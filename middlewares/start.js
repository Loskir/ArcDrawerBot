const {Composer} = require('telegraf')

const Results = require('../models/results')

const composer = new Composer()
composer.start((ctx) => {
  return ctx.replyWithVideo({source: './demo.mp4'}, {
    caption: `Я рисую картиночки разноцветными дугами. 

Inspired by openprocessing.org/sketch/624879
Переписано на JavaScript by @Loskir
<a href="https://github.com/Loskir/ArcDrawerBot">Исходный код бота</a>
Подписывайтесь на мой канал: @Loskirs`,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  })
})

composer.on('photo', async (ctx) => {
  const url = await ctx.telegram.getFileLink(ctx.message.photo[ctx.message.photo.length - 1].file_id)

  const queue = (await Promise.all([
    Results.countDocuments({status: 0}),
    // Results.countDocuments({status: 1}),
  ])).reduce((a, v) => a+v, 0)

  await Results.create({
    user_id: ctx.from.id,
    url,
    status: 0,
  })

  console.log(`new result from ${ctx.from.id}`)

  if (queue === 0) {
    return ctx.reply(`Отлично, я начал рисовать твою картинку, подожди минутку`)
  }

  return ctx.reply(`Отлично, я положил твою картинку в очередь. Перед тобой ${queue} картинок, подожди немного.`)

  // return processImage(url, ctx.chat.id)
})

module.exports = composer
