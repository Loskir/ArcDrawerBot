import { Bot } from './deps.deno.ts'

export const bot = new Bot(Deno.env.get('BOT_TOKEN') || '')

bot.on('message', (ctx) =>
  ctx.reply(
    `Привет! С 11 ноября 2022 года бот больше не работает 😢

Исходники этого бота открыты: github.com/Loskir/ArcDrawerBot, его можно поднять на своём сервере.

А ещё можешь подписаться на мой канал: @Loskirs 😜`,
    {
      parse_mode: 'HTML',
    },
  ),
)
