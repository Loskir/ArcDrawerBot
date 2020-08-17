const Telegraf = require('telegraf')
const mongoose = require('mongoose')
require('dotenv').config()

const log = require('./core/logs')

const MongooseSession = require('./core/session')

const {Stage} = Telegraf

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.use(new MongooseSession())

bot.use(require('./users'))

bot.use(require('./middlewares/start'))

bot.use(require('./middlewares/main'))

void (async () => {
  await mongoose.connect(process.env.MONGO_URL, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })

  bot.catch((error) => {
    log.error('Error: ', error)
    console.error(error.stack)
  })

  await bot.launch()

  log.info(`@${bot.options.username} is running`)
})()
