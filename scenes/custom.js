const {Markup, Extra} = require('telegraf')
const Scene = require('telegraf/scenes/base')

const Results = require('../models/results')

const {
  catchNotModified,
} = require('../core/utils')

const {
  checkPendingByThisUser,
  getReplyTextByQueueLength,
} = require('../functions/telegram')

const modes = new Map()
  .set('default', 'Обычный')
  .set('avatar', 'На аватарку')

const colors = new Map()
  .set('white', 'белый')
  .set('black', 'чёрный')

const getKeyboard = (options) => {
  return Markup.inlineKeyboard([
    [Markup.callbackButton(`Режим: ${modes.get(options.mode)}`, 'change_mode')],
    [Markup.callbackButton(`Цвет фона: ${colors.get(options.bgColor)}`, 'change_bgcolor')],
    [Markup.callbackButton('✅ Готово', 'done')]
  ])
}

const scene = new Scene('custom')
scene.enter((ctx) => {
  ctx.scene.state.options = {
    mode: 'default',
    bgColor: 'white'
  }
  return ctx.reply(`Здесь можно изменить параметры обработки.

🔹 Режим
Обычный — 1000 пикселей, 20 секунд
На аватарку — 800×800 пикселей, 10 секунд (<a href="https://t.me/betainfo/195">подробнее</a>)
🔹 Цвет фона — белый/чёрный`, Extra.HTML().markup(getKeyboard(ctx.scene.state.options)).webPreview(false))
})

scene.action('change_mode', (ctx) => {
  ctx.answerCbQuery()
  ctx.scene.state.options.mode = ctx.scene.state.options.mode === 'default' ? 'avatar' : 'default'
  return ctx.editMessageReplyMarkup(getKeyboard(ctx.scene.state.options)).catch(catchNotModified)
})

scene.action('change_bgcolor', (ctx) => {
  ctx.answerCbQuery()
  ctx.scene.state.options.bgColor = ctx.scene.state.options.bgColor === 'white' ? 'black' : 'white'
  return ctx.editMessageReplyMarkup(getKeyboard(ctx.scene.state.options)).catch(catchNotModified)
})

scene.action('done', async (ctx) => {
  const {options} = ctx.scene.state
  return ctx.editMessageText(`Отлично!
Режим: ${modes.get(options.mode)}
Цвет фона: ${colors.get(options.bgColor)}

Теперь отправь мне картинку`)
})

scene.on('photo', checkPendingByThisUser, async (ctx) => {
  const url = await ctx.telegram.getFileLink(ctx.message.photo[ctx.message.photo.length - 1].file_id)

  const queueLength = await Results.countDocuments({status: 0})

  await Results.create({
    user_id: ctx.from.id,
    url,
    status: 0,
    as_avatar: ctx.scene.state.options.mode === 'avatar',
    background_color: ctx.scene.state.options.bgColor,
  })

  console.log(`new result from ${ctx.from.id}`)

  await ctx.reply(getReplyTextByQueueLength(queueLength))

  return ctx.scene.leave()
})

module.exports = scene
