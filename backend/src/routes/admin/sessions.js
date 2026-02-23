const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const { logActivity } = require('../../helpers/activityLog')

const prisma = new PrismaClient()

// ── GET /api/admin/sessions — all sessions
router.get('/', async (req, res) => {
  try {
    const sessions = await prisma.session.findMany({
      orderBy: { openedAt: 'desc' },
      include: {
        openedBy: { select: { id: true, username: true, firstName: true } },
        closedBy: { select: { id: true, username: true, firstName: true } },
      }
    })
    res.json(sessions)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── GET /api/admin/sessions/active
router.get('/active', async (req, res) => {
  try {
    const session = await prisma.session.findFirst({
      where: { status: 'open' },
      orderBy: { openedAt: 'desc' },
      include: {
        openedBy: { select: { id: true, username: true, firstName: true } },
      }
    })
    res.json(session || null)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── POST /api/admin/sessions/open
router.post('/open', async (req, res) => {
  const { name } = req.body
  try {
    // Check no session already open
    const existing = await prisma.session.findFirst({ where: { status: 'open' } })
    if (existing) return res.status(409).json({ error: 'A session is already open' })

    // Open new session
    const session = await prisma.session.create({
      data: {
        name: name || null,
        status: 'open',
        openedById: req.user.id,
      }
    })

    // Update system_status config
    await prisma.config.update({
      where: { key: 'system_status' },
      data: { value: 'open' }
    })

    // Reset all user session counters
    await prisma.user.updateMany({
      data: {
        currentSessionDepositCount: 0,
        currentSessionDepositAmount: 0,
        currentSessionWithdrawalCount: 0,
        currentSessionWithdrawalAmount: 0,
      }
    })

    await logActivity({
      sessionId: session.id,
      adminId: req.user.id,
      entityType: 'session',
      entityId: session.id,
      action: 'opened',
    })

    res.status(201).json(session)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── POST /api/admin/sessions/close
router.post('/close', async (req, res) => {
  try {
    const session = await prisma.session.findFirst({ where: { status: 'open' } })
    if (!session) return res.status(404).json({ error: 'No open session found' })

    const closed = await prisma.session.update({
      where: { id: session.id },
      data: {
        status: 'closed',
        closedById: req.user.id,
        closedAt: new Date(),
      }
    })

    // Update system_status config
    await prisma.config.update({
      where: { key: 'system_status' },
      data: { value: 'closed' }
    })

    await logActivity({
      sessionId: session.id,
      adminId: req.user.id,
      entityType: 'session',
      entityId: session.id,
      action: 'closed',
    })

    res.json(closed)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router