const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const { logActivity } = require('../helpers/activityLog')

const prisma = new PrismaClient()

// ── GET /api/recoveries
router.get('/', async (req, res) => {
  try {
    const recoveries = await prisma.recovery.findMany({
      where: { userId: req.user.id },
      include: { gameId: true, session: true },
      orderBy: { createdAt: 'desc' }
    })
    res.json(recoveries)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── GET /api/recoveries/eligible-gameids
router.get('/eligible-gameids', async (req, res) => {
  try {
    const session = await prisma.session.findFirst({
      where: { status: 'open' },
      orderBy: { openedAt: 'desc' }
    })
    if (!session) return res.json([])

    // Must have at least one approved deposit in current session
    const approvedDeposits = await prisma.deposit.findMany({
      where: {
        userId: req.user.id,
        status: 'approved',
        sessionId: session.id,
      },
      select: { gameIdId: true }
    })

    const gameIdIds = [...new Set(approvedDeposits.map(d => d.gameIdId))]
    if (gameIdIds.length === 0) return res.json([])

    const gameIds = await prisma.gameId.findMany({
      where: { id: { in: gameIdIds } }
    })

    res.json(gameIds)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── POST /api/recoveries
router.post('/', async (req, res) => {
  const { gameId } = req.body

  if (!gameId) return res.status(400).json({ error: 'gameId is required' })

  try {
    const [statusConfig, featureConfig] = await Promise.all([
      prisma.config.findUnique({ where: { key: 'system_status' } }),
      prisma.config.findUnique({ where: { key: 'recovery_enabled' } }),
    ])
    if (statusConfig?.value !== 'open') return res.status(403).json({ error: 'system_closed' })
    if (featureConfig?.value !== 'true') return res.status(403).json({ error: 'feature_disabled' })

    const session = await prisma.session.findFirst({
      where: { status: 'open' },
      orderBy: { openedAt: 'desc' }
    })
    if (!session) return res.status(403).json({ error: 'No active session' })

    const gameIdRecord = await prisma.gameId.findUnique({ where: { gameId } })
    if (!gameIdRecord) return res.status(404).json({ error: 'invalid_gameid' })

    // Must have approved deposit in current session
    const hasApprovedDeposit = await prisma.deposit.findFirst({
      where: {
        userId: req.user.id,
        gameIdId: gameIdRecord.id,
        status: 'approved',
        sessionId: session.id,
      }
    })
    if (!hasApprovedDeposit) return res.status(403).json({ error: 'not_eligible' })

    const recovery = await prisma.recovery.create({
      data: {
        userId: req.user.id,
        sessionId: session.id,
        gameIdId: gameIdRecord.id,
        type: 'recovery',
      }
    })

    await logActivity({
      sessionId: session.id,
      userId: req.user.id,
      gameIdId: gameIdRecord.id,
      entityType: 'recovery',
      entityId: recovery.id,
      action: 'created',
      recoveryId: recovery.id,
    })

    res.status(201).json(recovery)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router