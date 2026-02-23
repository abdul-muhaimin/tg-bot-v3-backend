const bot = require('../bot/index')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

/**
 * Send a bot message to a user
 * @param {Object} options
 * @param {number}  options.userId      - DB user id
 * @param {string}  options.message     - Markdown text
 * @param {string}  [options.photoFileId] - Telegram file_id for photo
 * @param {string}  [options.parseMode]   - 'Markdown' | 'HTML' (default Markdown)
 */
async function sendBotMessage({ userId, message, photoFileId, parseMode = 'Markdown' }) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error('User not found')

  const telegramId = user.telegramId.toString()

  if (photoFileId) {
    await bot.api.sendPhoto(telegramId, photoFileId, {
      caption: message,
      parse_mode: parseMode,
    })
  } else {
    await bot.api.sendMessage(telegramId, message, {
      parse_mode: parseMode,
    })
  }

  return { ok: true }
}

/**
 * Send to multiple users at once
 * @param {number[]} userIds
 * @param {string}   message
 * @param {string}   [photoFileId]
 */
async function broadcastBotMessage({ userIds, message, photoFileId, parseMode = 'Markdown' }) {
  const results = await Promise.allSettled(
    userIds.map(userId => sendBotMessage({ userId, message, photoFileId, parseMode }))
  )
  const failed = results.filter(r => r.status === 'rejected').length
  const success = results.filter(r => r.status === 'fulfilled').length
  return { success, failed }
}

/**
 * Broadcast to ALL opted-in users
 */
async function broadcastAll({ message, photoFileId, parseMode = 'Markdown' }) {
  const users = await prisma.user.findMany({
    where: { broadcastOptIn: true, isBanned: false },
    select: { id: true }
  })
  return broadcastBotMessage({
    userIds: users.map(u => u.id),
    message,
    photoFileId,
    parseMode,
  })
}

module.exports = { sendBotMessage, broadcastBotMessage, broadcastAll }