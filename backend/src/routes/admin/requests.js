const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const { logActivity } = require('../../helpers/activityLog')
const { upload } = require('../../services/cloudinary')

const prisma = new PrismaClient()

// Helper — increment session and user counters on approval
async function incrementCounters(prisma, type, sessionId, userId, amount = 0) {
  const sessionUpdate = {}
  const userAllTime = {}
  const userSession = {}

  if (type === 'deposit') {
    sessionUpdate.totalDepositCount = { increment: 1 }
    sessionUpdate.totalDepositAmount = { increment: amount }
    userAllTime.allTimeDepositCount = { increment: 1 }
    userAllTime.allTimeDepositAmount = { increment: amount }
    userSession.currentSessionDepositCount = { increment: 1 }
    userSession.currentSessionDepositAmount = { increment: amount }
  } else if (type === 'withdrawal') {
    sessionUpdate.totalWithdrawalCount = { increment: 1 }
    sessionUpdate.totalWithdrawalAmount = { increment: amount }
    userAllTime.allTimeWithdrawalCount = { increment: 1 }
    userAllTime.allTimeWithdrawalAmount = { increment: amount }
    userSession.currentSessionWithdrawalCount = { increment: 1 }
    userSession.currentSessionWithdrawalAmount = { increment: amount }
  } else if (type === 'recovery') {
    sessionUpdate.totalRecoveryCount = { increment: 1 }
    userAllTime.allTimeRecoveryCount = { increment: 1 }
  } else if (type === 'newid') {
    sessionUpdate.totalNewIdCount = { increment: 1 }
  } else if (type === 'chip_transfer') {
    sessionUpdate.totalChipTransferCount = { increment: 1 }
  }

  await Promise.all([
    prisma.session.update({ where: { id: sessionId }, data: sessionUpdate }),
    prisma.user.update({ where: { id: userId }, data: { ...userAllTime, ...userSession } }),
  ])
}

// ── DEPOSITS ────────────────────────────────────────────────

// GET /api/admin/requests/deposits
router.get('/deposits', async (req, res) => {
  try {
    const { status, sessionId } = req.query
    const where = {}
    if (status) where.status = status
    if (sessionId) where.sessionId = parseInt(sessionId)

    const deposits = await prisma.deposit.findMany({
      where,
      include: {
        user: { select: { id: true, username: true, nickname: true, firstName: true } },
        gameId: true,
        session: true,
        admin: { select: { id: true, username: true, firstName: true } },
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json(deposits)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/admin/requests/deposits/:id/approve
router.post('/deposits/:id/approve', upload.single('slip'), async (req, res) => {
  const { approvedAmount, adminNote } = req.body
  try {
    const deposit = await prisma.deposit.findUnique({ where: { id: parseInt(req.params.id) } })
    if (!deposit) return res.status(404).json({ error: 'Deposit not found' })
    if (deposit.status !== 'pending') return res.status(400).json({ error: 'Already actioned' })

    const finalAmount = approvedAmount ? parseFloat(approvedAmount) : deposit.requestedAmount
    const slipUrl = req.file?.path || deposit.slipImageUrl

    const updated = await prisma.deposit.update({
      where: { id: deposit.id },
      data: {
        status: 'approved',
        approvedAmount: finalAmount,
        slipImageUrl: slipUrl,
        adminNote: adminNote || null,
        adminId: req.user.id,
        actionedAt: new Date(),
        ocrStatus: deposit.ocrStatus === 'pending' ? 'skipped' : deposit.ocrStatus,
      }
    })

    await incrementCounters(prisma, 'deposit', deposit.sessionId, deposit.userId, finalAmount)

    await logActivity({
      sessionId: deposit.sessionId,
      adminId: req.user.id,
      userId: deposit.userId,
      gameIdId: deposit.gameIdId,
      entityType: 'deposit',
      entityId: deposit.id,
      action: 'approved',
      depositId: deposit.id,
      meta: approvedAmount ? { requestedAmount: deposit.requestedAmount, approvedAmount: finalAmount } : null,
    })

    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/admin/requests/deposits/:id/reject
router.post('/deposits/:id/reject', async (req, res) => {
  const { adminNote } = req.body
  if (!adminNote) return res.status(400).json({ error: 'Rejection reason is required' })

  try {
    const deposit = await prisma.deposit.findUnique({ where: { id: parseInt(req.params.id) } })
    if (!deposit) return res.status(404).json({ error: 'Deposit not found' })
    if (deposit.status !== 'pending') return res.status(400).json({ error: 'Already actioned' })

    const updated = await prisma.deposit.update({
      where: { id: deposit.id },
      data: {
        status: 'rejected',
        adminNote,
        adminId: req.user.id,
        actionedAt: new Date(),
      }
    })

    await logActivity({
      sessionId: deposit.sessionId,
      adminId: req.user.id,
      userId: deposit.userId,
      entityType: 'deposit',
      entityId: deposit.id,
      action: 'rejected',
      depositId: deposit.id,
    })

    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── WITHDRAWALS ─────────────────────────────────────────────

router.get('/withdrawals', async (req, res) => {
  try {
    const { status, sessionId } = req.query
    const where = {}
    if (status) where.status = status
    if (sessionId) where.sessionId = parseInt(sessionId)

    const withdrawals = await prisma.withdrawal.findMany({
      where,
      include: {
        user: { select: { id: true, username: true, nickname: true, firstName: true } },
        gameId: true,
        session: true,
        admin: { select: { id: true, username: true, firstName: true } },
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json(withdrawals)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/withdrawals/:id/approve', upload.single('slip'), async (req, res) => {
  const { approvedAmount, adminNote } = req.body
  try {
    const record = await prisma.withdrawal.findUnique({ where: { id: parseInt(req.params.id) } })
    if (!record) return res.status(404).json({ error: 'Withdrawal not found' })
    if (record.status !== 'pending') return res.status(400).json({ error: 'Already actioned' })

    const finalAmount = approvedAmount ? parseFloat(approvedAmount) : record.requestedAmount
    const slipUrl = req.file?.path || null

    const updated = await prisma.withdrawal.update({
      where: { id: record.id },
      data: {
        status: 'approved',
        approvedAmount: finalAmount,
        slipImageUrl: slipUrl,
        adminNote: adminNote || null,
        adminId: req.user.id,
        actionedAt: new Date(),
      }
    })

    await incrementCounters(prisma, 'withdrawal', record.sessionId, record.userId, finalAmount)

    await logActivity({
      sessionId: record.sessionId,
      adminId: req.user.id,
      userId: record.userId,
      gameIdId: record.gameIdId,
      entityType: 'withdrawal',
      entityId: record.id,
      action: 'approved',
      withdrawalId: record.id,
      meta: approvedAmount ? { requestedAmount: record.requestedAmount, approvedAmount: finalAmount } : null,
    })

    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/withdrawals/:id/reject', async (req, res) => {
  const { adminNote } = req.body
  if (!adminNote) return res.status(400).json({ error: 'Rejection reason is required' })

  try {
    const record = await prisma.withdrawal.findUnique({ where: { id: parseInt(req.params.id) } })
    if (!record) return res.status(404).json({ error: 'Withdrawal not found' })
    if (record.status !== 'pending') return res.status(400).json({ error: 'Already actioned' })

    const updated = await prisma.withdrawal.update({
      where: { id: record.id },
      data: { status: 'rejected', adminNote, adminId: req.user.id, actionedAt: new Date() }
    })

    await logActivity({
      sessionId: record.sessionId,
      adminId: req.user.id,
      userId: record.userId,
      entityType: 'withdrawal',
      entityId: record.id,
      action: 'rejected',
      withdrawalId: record.id,
    })

    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── RECOVERIES ──────────────────────────────────────────────

router.get('/recoveries', async (req, res) => {
  try {
    const { status, sessionId } = req.query
    const where = {}
    if (status) where.status = status
    if (sessionId) where.sessionId = parseInt(sessionId)

    const recoveries = await prisma.recovery.findMany({
      where,
      include: {
        user: { select: { id: true, username: true, nickname: true, firstName: true } },
        gameId: true,
        session: true,
        admin: { select: { id: true, username: true, firstName: true } },
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json(recoveries)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/recoveries/:id/approve', upload.single('slip'), async (req, res) => {
  const { adminNote } = req.body
  try {
    const record = await prisma.recovery.findUnique({ where: { id: parseInt(req.params.id) } })
    if (!record) return res.status(404).json({ error: 'Recovery not found' })
    if (record.status !== 'pending') return res.status(400).json({ error: 'Already actioned' })

    const slipUrl = req.file?.path || null

    const updated = await prisma.recovery.update({
      where: { id: record.id },
      data: {
        status: 'approved',
        slipImageUrl: slipUrl,
        adminNote: adminNote || null,
        adminId: req.user.id,
        actionedAt: new Date(),
      }
    })

    await incrementCounters(prisma, 'recovery', record.sessionId, record.userId)

    await logActivity({
      sessionId: record.sessionId,
      adminId: req.user.id,
      userId: record.userId,
      gameIdId: record.gameIdId,
      entityType: 'recovery',
      entityId: record.id,
      action: 'approved',
      recoveryId: record.id,
    })

    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/recoveries/:id/reject', async (req, res) => {
  const { adminNote } = req.body
  if (!adminNote) return res.status(400).json({ error: 'Rejection reason is required' })

  try {
    const record = await prisma.recovery.findUnique({ where: { id: parseInt(req.params.id) } })
    if (!record) return res.status(404).json({ error: 'Recovery not found' })
    if (record.status !== 'pending') return res.status(400).json({ error: 'Already actioned' })

    const updated = await prisma.recovery.update({
      where: { id: record.id },
      data: { status: 'rejected', adminNote, adminId: req.user.id, actionedAt: new Date() }
    })

    await logActivity({
      sessionId: record.sessionId,
      adminId: req.user.id,
      userId: record.userId,
      entityType: 'recovery',
      entityId: record.id,
      action: 'rejected',
      recoveryId: record.id,
    })

    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── NEW ID ──────────────────────────────────────────────────

router.get('/newid', async (req, res) => {
  try {
    const { status, sessionId } = req.query
    const where = {}
    if (status) where.status = status
    if (sessionId) where.sessionId = parseInt(sessionId)

    const requests = await prisma.newIdRequest.findMany({
      where,
      include: {
        user: { select: { id: true, username: true, nickname: true, firstName: true } },
        session: true,
        admin: { select: { id: true, username: true, firstName: true } },
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json(requests)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/newid/:id/approve', async (req, res) => {
  const { adminNote } = req.body
  try {
    const record = await prisma.newIdRequest.findUnique({ where: { id: parseInt(req.params.id) } })
    if (!record) return res.status(404).json({ error: 'Request not found' })
    if (record.status !== 'pending') return res.status(400).json({ error: 'Already actioned' })

    // Create the game ID
    const gameIdRecord = await prisma.gameId.create({
      data: { gameId: record.requestedGameId }
    })

    // Link user to game ID
    await prisma.userGameId.create({
      data: { userId: record.userId, gameIdId: gameIdRecord.id }
    })

    const updated = await prisma.newIdRequest.update({
      where: { id: record.id },
      data: {
        status: 'approved',
        gameIdId: gameIdRecord.id,
        adminNote: adminNote || null,
        adminId: req.user.id,
        actionedAt: new Date(),
      }
    })

    await incrementCounters(prisma, 'newid', record.sessionId, record.userId)

    await logActivity({
      sessionId: record.sessionId,
      adminId: req.user.id,
      userId: record.userId,
      gameIdId: gameIdRecord.id,
      entityType: 'newid',
      entityId: record.id,
      action: 'approved',
      newIdRequestId: record.id,
    })

    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/newid/:id/reject', async (req, res) => {
  const { adminNote } = req.body
  if (!adminNote) return res.status(400).json({ error: 'Rejection reason is required' })

  try {
    const record = await prisma.newIdRequest.findUnique({ where: { id: parseInt(req.params.id) } })
    if (!record) return res.status(404).json({ error: 'Request not found' })
    if (record.status !== 'pending') return res.status(400).json({ error: 'Already actioned' })

    const updated = await prisma.newIdRequest.update({
      where: { id: record.id },
      data: { status: 'rejected', adminNote, adminId: req.user.id, actionedAt: new Date() }
    })

    await logActivity({
      sessionId: record.sessionId,
      adminId: req.user.id,
      userId: record.userId,
      entityType: 'newid',
      entityId: record.id,
      action: 'rejected',
      newIdRequestId: record.id,
    })

    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── SUPPORT TICKETS ─────────────────────────────────────────

router.get('/tickets', async (req, res) => {
  try {
    const { status, sessionId } = req.query
    const where = {}
    if (status) where.status = status
    if (sessionId) where.sessionId = parseInt(sessionId)

    const tickets = await prisma.supportTicket.findMany({
      where,
      include: {
        user: { select: { id: true, username: true, nickname: true, firstName: true } },
        session: true,
        admin: { select: { id: true, username: true, firstName: true } },
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json(tickets)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.patch('/tickets/:id/status', async (req, res) => {
  const { status, adminNote } = req.body
  if (!['open', 'in_progress', 'closed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' })
  }

  try {
    const updated = await prisma.supportTicket.update({
      where: { id: parseInt(req.params.id) },
      data: { status, adminNote: adminNote || null, adminId: req.user.id, actionedAt: new Date() }
    })

    await logActivity({
      adminId: req.user.id,
      entityType: 'ticket',
      entityId: updated.id,
      action: status === 'closed' ? 'closed' : 'updated',
      supportTicketId: updated.id,
    })

    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── CHIP TRANSFERS ──────────────────────────────────────────

router.get('/transfers', async (req, res) => {
  try {
    const { status, sessionId } = req.query
    const where = {}
    if (status) where.status = status
    if (sessionId) where.sessionId = parseInt(sessionId)

    const transfers = await prisma.chipTransfer.findMany({
      where,
      include: {
        user: { select: { id: true, username: true, nickname: true, firstName: true } },
        fromGameId: true,
        toGameId: true,
        session: true,
        admin: { select: { id: true, username: true, firstName: true } },
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json(transfers)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/transfers/:id/approve', async (req, res) => {
  const { adminNote } = req.body
  try {
    const record = await prisma.chipTransfer.findUnique({ where: { id: parseInt(req.params.id) } })
    if (!record) return res.status(404).json({ error: 'Transfer not found' })
    if (record.status !== 'pending') return res.status(400).json({ error: 'Already actioned' })

    const updated = await prisma.chipTransfer.update({
      where: { id: record.id },
      data: { status: 'approved', adminNote: adminNote || null, adminId: req.user.id, actionedAt: new Date() }
    })

    await incrementCounters(prisma, 'chip_transfer', record.sessionId, record.userId)

    await logActivity({
      sessionId: record.sessionId,
      adminId: req.user.id,
      userId: record.userId,
      entityType: 'chip_transfer',
      entityId: record.id,
      action: 'approved',
      chipTransferId: record.id,
    })

    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/transfers/:id/reject', async (req, res) => {
  const { adminNote } = req.body
  if (!adminNote) return res.status(400).json({ error: 'Rejection reason is required' })

  try {
    const record = await prisma.chipTransfer.findUnique({ where: { id: parseInt(req.params.id) } })
    if (!record) return res.status(404).json({ error: 'Transfer not found' })
    if (record.status !== 'pending') return res.status(400).json({ error: 'Already actioned' })

    const updated = await prisma.chipTransfer.update({
      where: { id: record.id },
      data: { status: 'rejected', adminNote, adminId: req.user.id, actionedAt: new Date() }
    })

    await logActivity({
      sessionId: record.sessionId,
      adminId: req.user.id,
      userId: record.userId,
      entityType: 'chip_transfer',
      entityId: record.id,
      action: 'rejected',
      chipTransferId: record.id,
    })

    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router