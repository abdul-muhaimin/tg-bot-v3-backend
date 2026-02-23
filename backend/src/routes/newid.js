const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const { logActivity } = require('../helpers/activityLog')

const prisma = new PrismaClient()

// ── GET /api/newid
router.get('/', async (req, res) => {
  try {
    const requests = await prisma.newIdRequest.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    })
    res.json(requests)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── POST /api/newid
router.post('/', async (req, res) => {
  const { requestedGameId } = req.body

  if (!requestedGameId) {
    return res.status(400).json({ error: 'requestedGameId is required' })
  }

  try {
    const [statusConfig, featureConfig] = await Promise.all([
      prisma.config.findUnique({ where: { key: 'system_status' } }),
      prisma.config.findUnique({ where: { key: 'newid_enabled' } }),
    ])
    if (statusConfig?.value !== 'open') return res.status(403).json({ error: 'system_closed' })
    if (featureConfig?.value !== 'true') return res.status(403).json({ error: 'feature_disabled' })

    const session = await prisma.session.findFirst({
      where: { status: 'open' },
      orderBy: { openedAt: 'desc' }
    })
    if (!session) return res.status(403).json({ error: 'No active session' })

    // Check if game ID already exists
    const existing = await prisma.gameId.findUnique({
      where: { gameId: requestedGameId }
    })
    if (existing) {
      return res.status(409).json({ error: 'That Game ID already exists' })
    }

    // Check no pending request for same ID
    const pendingRequest = await prisma.newIdRequest.findFirst({
      where: { requestedGameId, status: 'pending' }
    })
    if (pendingRequest) {
      return res.status(409).json({ error: 'A request for that Game ID is already pending' })
    }

    const request = await prisma.newIdRequest.create({
      data: {
        userId: req.user.id,
        sessionId: session.id,
        requestedGameId,
      }
    })

    await logActivity({
      sessionId: session.id,
      userId: req.user.id,
      entityType: 'newid',
      entityId: request.id,
      action: 'created',
      newIdRequestId: request.id,
    })

    res.status(201).json(request)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router