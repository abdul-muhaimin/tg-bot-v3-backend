const express = require('express')
const router = express.Router()
const { sendBotMessage, broadcastAll } = require('../services/botNotify')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// ── POST /api/notify/confirm ─────────────────────────────────
// User confirms their own submission
// Called from frontend after any successful request
router.post('/confirm', async (req, res) => {
  const { type, data } = req.body
  const user = req.user

  try {
    const message = buildConfirmMessage(type, data, user.language || 'en')
    await sendBotMessage({ userId: user.id, message })
    res.json({ ok: true })
  } catch (err) {
    console.error('[notify/confirm]', err.message)
    res.json({ ok: false })
  }
})

// ── POST /api/notify/send ────────────────────────────────────
// Admin sends a message to a specific user
// Supports optional photoFileId
router.post('/send', async (req, res) => {
  // Must be admin
  if (!['admin', 'superadmin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const { userId, message, photoFileId } = req.body
  if (!userId || !message) {
    return res.status(400).json({ error: 'userId and message are required' })
  }

  try {
    await sendBotMessage({ userId: parseInt(userId), message, photoFileId })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── POST /api/notify/broadcast ───────────────────────────────
// Admin broadcasts to all opted-in users
// Supports optional photoFileId
router.post('/broadcast', async (req, res) => {
  if (!['admin', 'superadmin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const { message, photoFileId } = req.body
  if (!message) return res.status(400).json({ error: 'message is required' })

  try {
    const result = await broadcastAll({ message, photoFileId })
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router

// ── Message builder ──────────────────────────────────────────
function buildConfirmMessage(type, data, lang) {
  const msgs = {
    deposit: {
      en: `✅ *Deposit Received*\n\nGame ID: \`${data.gameId}\`\nAmount: *${data.amount} ${data.currency}*\n\nPending review — we'll notify you once processed.`,
      dv: `✅ *ޑިޕޮސިޓް ލިބިއްޖެ*\n\nގޭމް އައިޑީ: \`${data.gameId}\`\nއަދަދު: *${data.amount} ${data.currency}*\n\nމުރާޖިއާ ކުރެވި ނިމުމުން ދަންނަވާނަން.`,
    },
    withdrawal: {
      en: `✅ *Withdrawal Requested*\n\nGame ID: \`${data.gameId}\`\nAmount: *${data.amount}*\n\nPending review — we'll notify you once processed.`,
      dv: `✅ *ވިތުޑްރޯ ހުށަހެޅިއްޖެ*\n\nގޭމް އައިޑީ: \`${data.gameId}\`\nއަދަދު: *${data.amount}*\n\nމުރާޖިއާ ކުރެވި ނިމުމުން ދަންނަވާނަން.`,
    },
    recovery: {
      en: `✅ *Recovery Requested*\n\nGame ID: \`${data.gameId}\`\n\nOur team will process your recovery shortly.`,
      dv: `✅ *ރިކަވަރީ ހުށަހެޅިއްޖެ*\n\nގޭމް އައިޑީ: \`${data.gameId}\`\n\nވީ އެންމެ އަވަހަށް ޕްރޮސެސް ކުރެވޭނެ.`,
    },
    newid: {
      en: `✅ *New ID Requested*\n\nRequested: \`${data.requestedId}\`\n\nYou'll be notified once an admin reviews it.`,
      dv: `✅ *އައު އައިޑީ ހުށަހެޅިއްޖެ*\n\nހޯދަން ބޭނުންވާ: \`${data.requestedId}\`\n\nރިވިއު ކުރެވުމުން ދަންނަވާނަން.`,
    },
    transfer: {
      en: `✅ *Chip Transfer Requested*\n\nFrom: \`${data.fromGameId}\`\nTo: \`${data.toGameId}\`\nAmount: *${data.amount} chips*\n\nPending review.`,
      dv: `✅ *ޗިޕް ޓްރާންސްފަރ ހުށަހެޅިއްޖެ*\n\nފޮނުވި: \`${data.fromGameId}\`\nލިބޭ: \`${data.toGameId}\`\nއަދަދު: *${data.amount}*`,
    },
    support: {
      en: `✅ *Support Ticket Received*\n\nTicket ID: #${data.ticketId}\n\nOur team will get back to you as soon as possible.`,
      dv: `✅ *ސަޕޯޓް ޓިކެޓް ލިބިއްޖެ*\n\nޓިކެޓް: #${data.ticketId}\n\nވީ އެންމެ އަވަހަށް ޖަވާބު ދޭނަން.`,
    },
  }

  const set = msgs[type]
  if (!set) return `✅ Request received. We'll process it shortly.`
  return set[lang] || set['en']
}