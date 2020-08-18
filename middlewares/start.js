const {Composer, Extra} = require('telegraf')

const Results = require('../models/results')

const {
  pluralizeIndex,
} = require('../core/utils')

const composer = new Composer()
composer.start((ctx) => {
  return ctx.telegram.sendAnimation(ctx.from.id, 'CgACAgIAAxkDAAOeXwiE8peJsswPcOGc5s8LttMyoqIAAu0GAALrbUlIIccHqQNOXy0aBA', {
    caption: `Я рисую картиночки разноцветными дугами. 

Inspired by openprocessing.org/sketch/624879
Переписано на JavaScript by @Loskir
<a href="https://github.com/Loskir/ArcDrawerBot">Исходный код бота</a>
Подписывайся на мой канал: @Loskirs

Чтобы начать, отправь мне картинку (картинкой, не файлом)

Чтобы настроить параметры обработки, зайди в /custom
Например, там можно сделать себе новую <a href="https://t.me/betainfo/195">видеоаватарку</a> 😏`,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  })
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
