const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// GET /api/admin/dashboard
router.get('/', async (req, res) => {
  try {
    const session = await prisma.session.findFirst({
      where: { status: 'open' },
      orderBy: { openedAt: 'desc' },
    })

    const sId = session?.id

    const [
      pendingDeposits, pendingWithdrawals, pendingRecoveries,
      pendingNewIds, pendingTransfers, pendingTickets,
      totalDeposits, totalWithdrawals, totalRecoveries, activeUsers,
    ] = await Promise.all([
      prisma.deposit.count({ where: { status: 'pending', ...(sId && { sessionId: sId }) } }),
      prisma.withdrawal.count({ where: { status: 'pending', ...(sId && { sessionId: sId }) } }),
      prisma.recovery.count({ where: { status: 'pending', ...(sId && { sessionId: sId }) } }),
      prisma.newIdRequest.count({ where: { status: 'pending', ...(sId && { sessionId: sId }) } }),
      prisma.chipTransfer.count({ where: { status: 'pending', ...(sId && { sessionId: sId }) } }),
      prisma.supportTicket.count({ where: { status: 'open', ...(sId && { sessionId: sId }) } }),
      prisma.deposit.count({ where: { ...(sId && { sessionId: sId }) } }),
      prisma.withdrawal.count({ where: { ...(sId && { sessionId: sId }) } }),
      prisma.recovery.count({ where: { ...(sId && { sessionId: sId }) } }),
      prisma.deposit.groupBy({ by: ['userId'], where: { ...(sId && { sessionId: sId }) } }).then(r => r.length),
    ])

    res.json({
      session,
      stats: {
        pendingDeposits, pendingWithdrawals, pendingRecoveries,
        pendingNewIds, pendingTransfers, pendingTickets,
        totalDeposits, totalWithdrawals, totalRecoveries, activeUsers,
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/admin/dashboard/pending — for nav badge
router.get('/pending', async (req, res) => {
  try {
    const session = await prisma.session.findFirst({ where: { status: 'open' } })
    const sId = session?.id

    const counts = await Promise.all([
      prisma.deposit.count({ where: { status: 'pending', ...(sId && { sessionId: sId }) } }),
      prisma.withdrawal.count({ where: { status: 'pending', ...(sId && { sessionId: sId }) } }),
      prisma.recovery.count({ where: { status: 'pending', ...(sId && { sessionId: sId }) } }),
      prisma.newIdRequest.count({ where: { status: 'pending', ...(sId && { sessionId: sId }) } }),
      prisma.chipTransfer.count({ where: { status: 'pending', ...(sId && { sessionId: sId }) } }),
      prisma.supportTicket.count({ where: { status: 'open', ...(sId && { sessionId: sId }) } }),
    ])

    res.json({ total: counts.reduce((a, b) => a + b, 0) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/admin/dashboard/activity
router.get('/activity', async (req, res) => {
  try {
    const logs = await prisma.activityLog.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { username: true, firstName: true } },
      }
    })
    res.json(logs)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/admin/sessions/open
router.post('/sessions/open', async (req, res) => {
  try {
    const existing = await prisma.session.findFirst({ where: { status: 'open' } })
    if (existing) return res.status(400).json({ error: 'A session is already open' })

    const session = await prisma.session.create({
      data: {
        name: req.body.name || null,
        status: 'open',
        openedById: req.user.id,
        openedAt: new Date(),
      }
    })
    await prisma.config.update({ where: { key: 'system_status' }, data: { value: 'open' } })
    res.json(session)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/admin/sessions/close
router.post('/sessions/close', async (req, res) => {
  try {
    const session = await prisma.session.findFirst({ where: { status: 'open' } })
    if (!session) return res.status(400).json({ error: 'No open session' })

    const updated = await prisma.session.update({
      where: { id: session.id },
      data: { status: 'closed', closedById: req.user.id, closedAt: new Date() }
    })
    await prisma.config.update({ where: { key: 'system_status' }, data: { value: 'closed' } })
    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router