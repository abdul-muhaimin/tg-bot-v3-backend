const { Bot, InlineKeyboard } = require('grammy')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const bot = new Bot(process.env.BOT_TOKEN)

// ── Helper: get bot message from DB ──────────────────────
async function msg(key, language = 'en', replacements = {}) {
  const record = await prisma.botMessage.findFirst({
    where: {
      messageKey: key,
      language,
    }
  })
  // fallback to english
  const fallback = record || await prisma.botMessage.findFirst({
    where: { messageKey: key, language: 'en' }
  })

  if (!fallback) return `[${key}]`

  let text = fallback.content
  for (const [k, v] of Object.entries(replacements)) {
    text = text.replaceAll(`{${k}}`, v)
  }
  return text
}

// ── Helper: get or create user ────────────────────────────
async function getOrCreateUser(telegramUser) {
  const existing = await prisma.user.findUnique({
    where: { telegramId: BigInt(telegramUser.id) }
  })
  if (existing) return { user: existing, isNew: false }

  const created = await prisma.user.create({
    data: {
      telegramId: BigInt(telegramUser.id),
      username: telegramUser.username || null,
      nickname: telegramUser.username || telegramUser.first_name || null,
      firstName: telegramUser.first_name || null,
      lastName: telegramUser.last_name || null,
      role: 'user',
      language: 'en',
    }
  })
  return { user: created, isNew: true }
}

// ── Helper: check system status ──────────────────────────
async function isSystemOpen() {
  const config = await prisma.config.findUnique({
    where: { key: 'system_status' }
  })
  return config?.value === 'open'
}

// ── /start ───────────────────────────────────────────────
bot.command('start', async (ctx) => {
  const telegramUser = ctx.from
  const { user, isNew } = await getOrCreateUser(telegramUser)

  // Banned check
  if (user.isBanned) {
    const text = await msg('banned', user.language)
    return ctx.reply(text)
  }

  const open = await isSystemOpen()
  const appUrl = process.env.MINI_APP_URL

  // New user — send welcome + open mini app button
  if (isNew || !user.tncAccepted) {
    const text = await msg('welcome', user.language)
    const keyboard = new InlineKeyboard()
      .webApp('📋 View Terms & Open App', appUrl)

    return ctx.reply(text, { reply_markup: keyboard })
  }

  // Returning user — system closed
  if (!open) {
    const text = await msg('system_closed', user.language)
    return ctx.reply(text)
  }

  // Returning user — system open, show main menu
  const name = user.nickname || user.firstName || 'there'
  const keyboard = new InlineKeyboard()
    .webApp('🚀 Open App', appUrl)

  return ctx.reply(
    `👋 Welcome back, ${name}!\n\nTap below to open the app.`,
    { reply_markup: keyboard }
  )
})

// ── /menu ────────────────────────────────────────────────
bot.command('menu', async (ctx) => {
  const telegramUser = ctx.from
  const user = await prisma.user.findUnique({
    where: { telegramId: BigInt(telegramUser.id) }
  })

  if (!user) {
    return ctx.reply('Please send /start first.')
  }

  if (user.isBanned) {
    const text = await msg('banned', user.language)
    return ctx.reply(text)
  }

  const open = await isSystemOpen()
  if (!open) {
    const text = await msg('system_closed', user.language)
    return ctx.reply(text)
  }

  const appUrl = process.env.MINI_APP_URL
  const keyboard = new InlineKeyboard()
    .webApp('🚀 Open App', appUrl)

  return ctx.reply('Tap below to open the app.', { reply_markup: keyboard })
})

// ── /status ──────────────────────────────────────────────
bot.command('status', async (ctx) => {
  const open = await isSystemOpen()
  const session = await prisma.session.findFirst({
    where: { status: 'open' },
    orderBy: { openedAt: 'desc' }
  })

  if (open && session) {
    return ctx.reply(
      `✅ System is *OPEN*\n\n` +
      `📋 Session: ${session.name || `#${session.id}`}\n` +
      `🕐 Since: ${session.openedAt.toUTCString()}`,
      { parse_mode: 'Markdown' }
    )
  }

  return ctx.reply('🔴 System is currently *CLOSED*', { parse_mode: 'Markdown' })
})

// ── Error handler ─────────────────────────────────────────
bot.catch((err) => {
  console.error('[Bot Error]', err)
})

module.exports = bot