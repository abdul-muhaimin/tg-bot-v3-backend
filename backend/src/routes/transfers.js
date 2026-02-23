const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const { logActivity } = require('../helpers/activityLog')

const prisma = new PrismaClient()

// ── GET /api/transfers
router.get('/', async (req, res) => {
  try {
    const transfers = await prisma.chipTransfer.findMany({
      where: { userId: req.user.id },
      include: { fromGameId: true, toGameId: true, session: true },
      orderBy: { createdAt: 'desc' }
    })
    res.json(transfers)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── POST /api/transfers
router.post('/', async (req, res) => {
  const { fromGameId, toGameId, amount } = req.body

  if (!fromGameId || !toGameId || !amount) {
    return res.status(400).json({ error: 'fromGameId, toGameId and amount are required' })
  }
  if (fromGameId === toGameId) {
    return res.status(400).json({ error: 'Source and destination Game IDs must be different' })
  }

  try {
    const [statusConfig, featureConfig] = await Promise.all([
      prisma.config.findUnique({ where: { key: 'system_status' } }),
      prisma.config.findUnique({ where: { key: 'chiptransfer_enabled' } }),
    ])
    if (statusConfig?.value !== 'open') return res.status(403).json({ error: 'system_closed' })
    if (featureConfig?.value !== 'true') return res.status(403).json({ error: 'feature_disabled' })

    const session = await prisma.session.findFirst({
      where: { status: 'open' },
      orderBy: { openedAt: 'desc' }
    })
    if (!session) return res.status(403).json({ error: 'No active session' })

    // Validate both game IDs exist
    const [fromRecord, toRecord] = await Promise.all([
      prisma.gameId.findUnique({ where: { gameId: fromGameId } }),
      prisma.gameId.findUnique({ where: { gameId: toGameId } }),
    ])
    if (!fromRecord) return res.status(404).json({ error: 'Source Game ID not found' })
    if (!toRecord) return res.status(404).json({ error: 'Destination Game ID not found' })

    // Check eligibility on source game ID
    if (fromRecord.lastInteractedUserId !== req.user.id) {
      return res.status(403).json({ error: 'gameid_not_eligible' })
    }

    const transfer = await prisma.chipTransfer.create({
      data: {
        userId:       req.user.id,
        sessionId:    session.id,
        fromGameIdId: fromRecord.id,
        toGameIdId:   toRecord.id,
        amount:       parseFloat(amount),
      }
    })

    await logActivity({
      sessionId:     session.id,
      userId:        req.user.id,
      gameIdId:      fromRecord.id,
      entityType:    'chip_transfer',
      entityId:      transfer.id,
      action:        'created',
      chipTransferId: transfer.id,
    })

    res.status(201).json(transfer)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router