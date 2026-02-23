const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// ── Shared user select ────────────────────────────────────────
const userSelect = {
  id: true,
  username: true,
  firstName: true,
  lastName: true,
  telegramId: true,
}

// ── Helpers ───────────────────────────────────────────────────
function statusFilter(type, status) {
  if (status === 'all') return {}
  if (type === 'tickets') {
    const map = { pending: 'open', approved: 'closed', rejected: 'closed' }
    return { status: map[status] || status }
  }
  return { status: status || 'pending' }
}

async function getActiveSession() {
  return prisma.session.findFirst({ where: { status: 'open' } })
}

async function logActivity({ sessionId, userId, adminId, gameIdId, entityType, entityId, action, meta }) {
  try {
    await prisma.activityLog.create({
      data: {
        sessionId,
        userId,
        adminId,
        gameIdId,
        entityType,
        entityId,
        action,
        meta: meta || {},
      }
    })
  } catch (err) {
    console.error('[activityLog] failed:', err.message)
  }
}

async function sendBotNotification(telegramId, message) {
  try {
    const { bot } = require('../../bot')
    await bot.api.sendMessage(telegramId.toString(), message, { parse_mode: 'Markdown' })
  } catch (err) {
    console.error('[notify] failed:', err.message)
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/admin/requests/:type
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.get('/:type', async (req, res) => {
  const { type } = req.params
  const { status = 'pending' } = req.query

  try {
    let data

    switch (type) {

      case 'deposits':
        data = await prisma.deposit.findMany({
          where: statusFilter(type, status),
          orderBy: { createdAt: 'desc' },
          take: 100,
          include: {
            user: { select: userSelect },
            gameId: { select: { id: true, gameId: true } },
          }
        })
        break

      case 'withdrawals':
        data = await prisma.withdrawal.findMany({
          where: statusFilter(type, status),
          orderBy: { createdAt: 'desc' },
          take: 100,
          include: {
            user: { select: userSelect },
            gameId: { select: { id: true, gameId: true } },
          }
        })
        break

      case 'recoveries':
        data = await prisma.recovery.findMany({
          where: statusFilter(type, status),
          orderBy: { createdAt: 'desc' },
          take: 100,
          include: {
            user: { select: userSelect },
            gameId: { select: { id: true, gameId: true } },
          }
        })
        break

      case 'newids':
        data = await prisma.newIdRequest.findMany({
          where: statusFilter(type, status),
          orderBy: { createdAt: 'desc' },
          take: 100,
          include: {
            user: { select: userSelect },
            gameId: { select: { id: true, gameId: true } },
          }
        })
        break

      case 'transfers':
        data = await prisma.chipTransfer.findMany({
          where: statusFilter(type, status),
          orderBy: { createdAt: 'desc' },
          take: 100,
          include: {
            user: { select: userSelect },
            fromGameId: { select: { id: true, gameId: true } },
            toGameId: { select: { id: true, gameId: true } },
          }
        })
        break

      case 'tickets':
        data = await prisma.supportTicket.findMany({
          where: statusFilter(type, status),
          orderBy: { createdAt: 'desc' },
          take: 100,
          include: {
            user: { select: userSelect },
          }
        })
        break

      default:
        return res.status(400).json({ error: 'Unknown request type' })
    }

    // Serialize BigInt telegramId
    const serialized = JSON.parse(JSON.stringify(data, (_, v) =>
      typeof v === 'bigint' ? v.toString() : v
    ))

    res.json(serialized)

  } catch (err) {
    console.error(`[admin/requests/${type}] GET error:`, err.message)
    res.status(500).json({ error: err.message })
  }
})

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/admin/requests/:type/:id/approve
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.post('/:type/:id/approve', async (req, res) => {
  const { type, id } = req.params
  const { note, approvedAmount } = req.body
  const adminId = req.user.id

  try {
    const session = await getActiveSession()

    switch (type) {

      // ── Deposits ──────────────────────────────────────────
      case 'deposits': {
        const deposit = await prisma.deposit.findUnique({
          where: { id: parseInt(id) },
          include: { user: true, gameId: true },
        })
        if (!deposit) return res.status(404).json({ error: 'Not found' })
        if (deposit.status !== 'pending') return res.status(400).json({ error: 'Already actioned' })

        const finalAmount = approvedAmount != null ? parseFloat(approvedAmount) : deposit.requestedAmount

        await prisma.$transaction([
          // Update deposit
          prisma.deposit.update({
            where: { id: deposit.id },
            data: {
              status: 'approved',
              approvedAmount: finalAmount,
              adminNote: note || null,
              adminId,
              actionedAt: new Date(),
            }
          }),
          // Update gameId last interacted
          prisma.gameId.update({
            where: { id: deposit.gameIdId },
            data: {
              lastInteractedUserId: deposit.userId,
              lastInteractedAt: new Date(),
            }
          }),
        ])

        await logActivity({
          sessionId: session?.id,
          userId: deposit.userId,
          adminId,
          gameIdId: deposit.gameIdId,
          entityType: 'deposit',
          entityId: deposit.id,
          action: 'approved',
          meta: { requestedAmount: deposit.requestedAmount, approvedAmount: finalAmount },
        })

        // Bot notify user
        const amountStr = finalAmount !== deposit.requestedAmount
          ? `${finalAmount.toLocaleString()} ${deposit.currency} _(adjusted from ${deposit.requestedAmount.toLocaleString()})_`
          : `${finalAmount.toLocaleString()} ${deposit.currency}`

        await sendBotNotification(
          deposit.user.telegramId,
          `✅ *Deposit Approved*\n\nGame ID: \`${deposit.gameId.gameId}\`\nAmount: ${amountStr}${note ? `\n\nNote: ${note}` : ''}`
        )

        return res.json({ success: true })
      }

      // ── Withdrawals ───────────────────────────────────────
      case 'withdrawals': {
        const withdrawal = await prisma.withdrawal.findUnique({
          where: { id: parseInt(id) },
          include: { user: true, gameId: true },
        })
        if (!withdrawal) return res.status(404).json({ error: 'Not found' })
        if (withdrawal.status !== 'pending') return res.status(400).json({ error: 'Already actioned' })

        await prisma.withdrawal.update({
          where: { id: withdrawal.id },
          data: {
            status: 'approved',
            approvedAmount: approvedAmount ? parseFloat(approvedAmount) : withdrawal.requestedAmount,
            adminNote: note || null,
            adminId,
            actionedAt: new Date(),
          }
        })

        await logActivity({
          sessionId: session?.id,
          userId: withdrawal.userId,
          adminId,
          gameIdId: withdrawal.gameIdId,
          entityType: 'withdrawal',
          entityId: withdrawal.id,
          action: 'approved',
        })

        await sendBotNotification(
          withdrawal.user.telegramId,
          `✅ *Withdrawal Approved*\n\nGame ID: \`${withdrawal.gameId.gameId}\`\nAmount: ${withdrawal.requestedAmount.toLocaleString()}${note ? `\n\nNote: ${note}` : ''}`
        )

        return res.json({ success: true })
      }

      // ── Recoveries ────────────────────────────────────────
      case 'recoveries': {
        const recovery = await prisma.recovery.findUnique({
          where: { id: parseInt(id) },
          include: { user: true, gameId: true },
        })
        if (!recovery) return res.status(404).json({ error: 'Not found' })
        if (recovery.status !== 'pending') return res.status(400).json({ error: 'Already actioned' })

        await prisma.$transaction([
          prisma.recovery.update({
            where: { id: recovery.id },
            data: {
              status: 'approved',
              adminNote: note || null,
              adminId,
              actionedAt: new Date(),
            }
          }),
          prisma.gameId.update({
            where: { id: recovery.gameIdId },
            data: {
              lastInteractedUserId: recovery.userId,
              lastInteractedAt: new Date(),
            }
          }),
        ])

        await logActivity({
          sessionId: session?.id,
          userId: recovery.userId,
          adminId,
          gameIdId: recovery.gameIdId,
          entityType: 'recovery',
          entityId: recovery.id,
          action: 'approved',
        })

        await sendBotNotification(
          recovery.user.telegramId,
          `✅ *Recovery Approved*\n\nGame ID: \`${recovery.gameId.gameId}\`${note ? `\n\nNote: ${note}` : ''}`
        )

        return res.json({ success: true })
      }

      // ── New IDs ───────────────────────────────────────────
      case 'newids': {
        const request = await prisma.newIdRequest.findUnique({
          where: { id: parseInt(id) },
          include: { user: true },
        })
        if (!request) return res.status(404).json({ error: 'Not found' })
        if (request.status !== 'pending') return res.status(400).json({ error: 'Already actioned' })

        // Check if gameId already exists
        const existing = await prisma.gameId.findUnique({
          where: { gameId: request.requestedGameId }
        })
        if (existing) return res.status(400).json({ error: 'Game ID already exists' })

        // Create the gameId and associate with user
        const newGameId = await prisma.gameId.create({
          data: {
            gameId: request.requestedGameId,
            lastInteractedUserId: request.userId,
            lastInteractedAt: new Date(),
          }
        })

        await prisma.$transaction([
          // Link user to gameId
          prisma.userGameId.create({
            data: { userId: request.userId, gameIdId: newGameId.id }
          }),
          // Update request
          prisma.newIdRequest.update({
            where: { id: request.id },
            data: {
              status: 'approved',
              gameIdId: newGameId.id,
              adminNote: note || null,
              adminId,
              actionedAt: new Date(),
            }
          }),
        ])

        await logActivity({
          sessionId: session?.id,
          userId: request.userId,
          adminId,
          gameIdId: newGameId.id,
          entityType: 'newid',
          entityId: request.id,
          action: 'approved',
        })

        await sendBotNotification(
          request.user.telegramId,
          `✅ *New ID Approved*\n\nYour Game ID \`${request.requestedGameId}\` is now active.${note ? `\n\nNote: ${note}` : ''}`
        )

        return res.json({ success: true })
      }

      // ── Transfers ─────────────────────────────────────────
      case 'transfers': {
        const transfer = await prisma.chipTransfer.findUnique({
          where: { id: parseInt(id) },
          include: { user: true, fromGameId: true, toGameId: true },
        })
        if (!transfer) return res.status(404).json({ error: 'Not found' })
        if (transfer.status !== 'pending') return res.status(400).json({ error: 'Already actioned' })

        await prisma.chipTransfer.update({
          where: { id: transfer.id },
          data: {
            status: 'approved',
            adminNote: note || null,
            adminId,
            actionedAt: new Date(),
          }
        })

        await logActivity({
          sessionId: session?.id,
          userId: transfer.userId,
          adminId,
          entityType: 'transfer',
          entityId: transfer.id,
          action: 'approved',
        })

        await sendBotNotification(
          transfer.user.telegramId,
          `✅ *Chip Transfer Approved*\n\nFrom: \`${transfer.fromGameId.gameId}\`\nTo: \`${transfer.toGameId.gameId}\`\nAmount: ${transfer.amount.toLocaleString()} chips${note ? `\n\nNote: ${note}` : ''}`
        )

        return res.json({ success: true })
      }

      // ── Support Tickets ───────────────────────────────────
      case 'tickets': {
        const ticket = await prisma.supportTicket.findUnique({
          where: { id: parseInt(id) },
          include: { user: true },
        })
        if (!ticket) return res.status(404).json({ error: 'Not found' })

        await prisma.supportTicket.update({
          where: { id: ticket.id },
          data: {
            status: 'closed',
            adminNote: note || null,
            adminId,
            actionedAt: new Date(),
          }
        })

        await logActivity({
          sessionId: session?.id,
          userId: ticket.userId,
          adminId,
          entityType: 'ticket',
          entityId: ticket.id,
          action: 'closed',
        })

        if (note) {
          await sendBotNotification(
            ticket.user.telegramId,
            `🎫 *Support Ticket Closed*\n\n${note}`
          )
        }

        return res.json({ success: true })
      }

      default:
        return res.status(400).json({ error: 'Unknown type' })
    }

  } catch (err) {
    console.error(`[admin/requests/${type}/${id}/approve] error:`, err.message)
    res.status(500).json({ error: err.message })
  }
})

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/admin/requests/:type/:id/reject
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
router.post('/:type/:id/reject', async (req, res) => {
  const { type, id } = req.params
  const { note } = req.body
  const adminId = req.user.id

  if (!note?.trim()) {
    return res.status(400).json({ error: 'A reason note is required to reject' })
  }

  try {
    const session = await getActiveSession()

    const modelMap = {
      deposits: { model: prisma.deposit, statusField: 'status', entityType: 'deposit' },
      withdrawals: { model: prisma.withdrawal, statusField: 'status', entityType: 'withdrawal' },
      recoveries: { model: prisma.recovery, statusField: 'status', entityType: 'recovery' },
      newids: { model: prisma.newIdRequest, statusField: 'status', entityType: 'newid' },
      transfers: { model: prisma.chipTransfer, statusField: 'status', entityType: 'transfer' },
      tickets: { model: prisma.supportTicket, statusField: 'status', entityType: 'ticket' },
    }

    const cfg = modelMap[type]
    if (!cfg) return res.status(400).json({ error: 'Unknown type' })

    // Fetch with user for notification
    const item = await cfg.model.findUnique({
      where: { id: parseInt(id) },
      include: { user: true },
    })
    if (!item) return res.status(404).json({ error: 'Not found' })

    const currentStatus = item.status
    if (['approved', 'rejected', 'closed'].includes(currentStatus)) {
      return res.status(400).json({ error: 'Already actioned' })
    }

    // Reject
    await cfg.model.update({
      where: { id: parseInt(id) },
      data: {
        status: 'rejected',
        adminNote: note.trim(),
        adminId,
        actionedAt: new Date(),
      }
    })

    await logActivity({
      sessionId: session?.id,
      userId: item.userId,
      adminId,
      entityType: cfg.entityType,
      entityId: parseInt(id),
      action: 'rejected',
      meta: { note },
    })

    // Bot messages per type
    const msgMap = {
      deposits: `❌ *Deposit Rejected*\n\nReason: ${note}`,
      withdrawals: `❌ *Withdrawal Rejected*\n\nReason: ${note}`,
      recoveries: `❌ *Recovery Rejected*\n\nReason: ${note}`,
      newids: `❌ *New ID Request Rejected*\n\nReason: ${note}`,
      transfers: `❌ *Chip Transfer Rejected*\n\nReason: ${note}`,
      tickets: `🎫 *Support Ticket Closed*\n\n${note}`,
    }

    await sendBotNotification(item.user.telegramId, msgMap[type])

    res.json({ success: true })

  } catch (err) {
    console.error(`[admin/requests/${type}/${id}/reject] error:`, err.message)
    res.status(500).json({ error: err.message })
  }
})

module.exports = router