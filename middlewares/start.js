const {Composer, Extra} = require('telegraf')

const Results = require('../models/results')

const composer = new Composer()
composer.start((ctx) => {
  return ctx.telegram.sendAnimation(ctx.from.id, 'CgACAgIAAxkDAAOeXwiE8peJsswPcOGc5s8LttMyoqIAAu0GAALrbUlIIccHqQNOXy0aBA', {
    caption: `Я рисую картиночки разноцветными дугами. 

Inspired by openprocessing.org/sketch/624879
Переписано на JavaScript by @Loskir
<a href="https://github.com/Loskir/ArcDrawerBot">Исходный код бота</a>
Подписывайся на мой канал: @Loskirs

Чтобы начать, отправь мне картинку (картинкой, не файлом)`,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  })
})

const pluralizeIndex = (n) => {
  if (n % 10 === 1 && n % 100 !== 11) {
    return 0
  }
  return n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2
}

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

  const word = ['картинка', 'картинки', 'картинок'][pluralizeIndex(queue)]

  return ctx.reply(`Отлично, я положил твою картинку в очередь. Перед тобой ${queue} ${word}, подожди немного. Используй команду /queue, чтобы следить за длиной очереди`)

  // return processImage(url, ctx.chat.id)
})

composer.command('queue', async (ctx) => {
  const queue = [
    ...await Results.find({status: 0}).sort({created_at: 1}),
  ]
  let indexes = []
  queue.forEach((result, i) => {
    if (result.user_id === ctx.from.id) {
      indexes.push(i)
    }
  })

  const word = ['картинка', 'картинки', 'картинок'][pluralizeIndex(queue.length)]

  return ctx.reply(
    `Всего в очереди ${queue.length} ${word}

Твои заявки: ${indexes.length > 0 ? indexes.map((v) => v + 1).map((v) => `${v}-я`).join(', ') : 'пусто'}`,
    Extra.HTML()
  )
})

module.exports = composer
