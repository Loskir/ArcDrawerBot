import { Bot } from './deps.deno.ts'

export const bot = new Bot(Deno.env.get('BOT_TOKEN') || '')

bot.on('message', (ctx) =>
  ctx.reply(
    `Привет! С 11 ноября 2022 года бот больше не работает 😢

Попробуй Круговорот от @FilteredInternet: fun.mishasaidov.com/krugovorot

Кстати, исходники этого бота открыты: github.com/Loskir/ArcDrawerBot, его можно поднять на своём сервере.
А ещё подпишись на мой канал: @Loskirs 😜`,
    {
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    },
  ),
)
