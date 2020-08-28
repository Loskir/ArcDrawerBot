const {Composer, Extra, Markup} = require('telegraf')

const Results = require('../models/results')

const {
  checkPendingByThisUser,
} = require('../functions/telegram')

const {
  catchNotModified,
  pluralizeIndex,
} = require('../core/utils')

const getMode = (options) => options.asAvatar ? 'На аватарку' : 'Обычный'
const getColor = (options) => options.blackBg ? 'чёрный' : 'белый'

const getKeyboard = (options) => {
  return Markup.inlineKeyboard([
    [Markup.callbackButton(`Режим: ${getMode(options)}`, 'change_mode')],
    [Markup.callbackButton(`Цвет фона: ${getColor(options)}`, 'change_bgcolor')],
    [Markup.callbackButton('✅ Готово', 'custom_done')]
  ])
}

const getReplyTextByQueueLength = (queueLength, options) => {
  if (queueLength === 0) {
    return `🎉 Отлично, я начал рисовать твою картинку, подожди минутку

Режим: ${getMode(options)}
Цвет фона: ${getColor(options)}`
  }

  const word = ['картинка', 'картинки', 'картинок'][pluralizeIndex(queueLength)]

  return `🎉 Отлично, я положил твою картинку в очередь. Перед тобой ${queueLength} ${word}, подожди немного. 
  
Режим: ${getMode(options)}
Цвет фона: ${getColor(options)}

Используй команду /queue, чтобы следить за длиной очереди`
}

const composer = new Composer()

composer.on('photo', checkPendingByThisUser, async (ctx) => {
  const url = await ctx.telegram.getFileLink(ctx.message.photo[ctx.message.photo.length - 1].file_id)

  const queueLength = await Results.countDocuments({status: 0})

  await Results.create({
    user_id: ctx.from.id,
    url,
    status: 0,
    as_avatar: ctx.session.asAvatar,
    background_color: ctx.session.blackBg ? 'black' : 'white',
  })

  console.log(`new result from ${ctx.from.id}`)

  return ctx.reply(getReplyTextByQueueLength(queueLength, ctx.session))
})

composer.command('custom', (ctx) => {
  return ctx.reply(`🔧 Здесь можно изменить параметры обработки.

🔹 Режим
Обычный — 1000 пикселей, 20 секунд
На аватарку — 800×800 пикселей, 10 секунд (<a href="https://t.me/betainfo/195">подробнее</a>)
🔹 Цвет фона — белый/чёрный`, Extra.HTML().markup(getKeyboard(ctx.session)).webPreview(false))
})

composer.action('change_mode', (ctx) => {
  ctx.answerCbQuery()
  ctx.session.asAvatar = !ctx.session.asAvatar
  return ctx.editMessageReplyMarkup(getKeyboard(ctx.session)).catch(catchNotModified)
})

composer.action('change_bgcolor', (ctx) => {
  ctx.answerCbQuery()
  ctx.session.blackBg = !ctx.session.blackBg
  return ctx.editMessageReplyMarkup(getKeyboard(ctx.session)).catch(catchNotModified)
})

composer.action('custom_done', async (ctx) => {
  return ctx.editMessageText(`👌🏻 <b>Настройки сохранены!</b>
  
Режим: ${getMode(ctx.session)}
Цвет фона: ${getColor(ctx.session)}`, Extra.HTML())
})

module.exports = composer
