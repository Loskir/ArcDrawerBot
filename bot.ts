import { Bot } from './deps.deno.ts'

export const bot = new Bot(Deno.env.get('BOT_TOKEN') || '')

bot.on('message', (ctx) =>
  ctx.reply(
    `Привет! С 11 ноября 2022 года бот больше не работает 😢

Попробуй <a href="https://fun.mishasaidov.com/krugovorot">Круговорот</a> от @FilteredInternet

Кстати, исходники этого бота <a href="https://github.com/Loskir/ArcDrawerBot">открыты</a>, его можно поднять на своём сервере.
А ещё подпишись на мой канал: @Loskirs 😜`,
    {
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    },
  ),
)
