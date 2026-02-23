const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const { upload } = require('../services/cloudinary')
const { logActivity } = require('../helpers/activityLog')

const prisma = new PrismaClient()

// ── GET /api/deposits
router.get('/', async (req, res) => {
  try {
    const deposits = await prisma.deposit.findMany({
      where: { userId: req.user.id },
      include: { gameId: true, session: true },
      orderBy: { createdAt: 'desc' }
    })
    res.json(deposits)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── GET /api/deposits/payment-accounts
router.get('/payment-accounts', async (req, res) => {
  try {
    const accounts = await prisma.paymentAccount.findMany({
      where: { isActive: true },
      orderBy: { currency: 'asc' }
    })
    res.json(accounts)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── POST /api/deposits
router.post('/', upload.single('slip'), async (req, res) => {
  const { gameId, currency, amount } = req.body

  if (!gameId || !currency || !amount) {
    return res.status(400).json({ error: 'gameId, currency and amount are required' })
  }

  try {
    // Check system is open
    const [statusConfig, depositConfig] = await Promise.all([
      prisma.config.findUnique({ where: { key: 'system_status' } }),
      prisma.config.findUnique({ where: { key: 'deposit_enabled' } }),
    ])
    if (statusConfig?.value !== 'open') return res.status(403).json({ error: 'system_closed' })
    if (depositConfig?.value !== 'true') return res.status(403).json({ error: 'feature_disabled' })

    // Get active session
    const session = await prisma.session.findFirst({
      where: { status: 'open' },
      orderBy: { openedAt: 'desc' }
    })
    if (!session) return res.status(403).json({ error: 'No active session' })

    // Find or create game ID
    let gameIdRecord = await prisma.gameId.findUnique({ where: { gameId } })
    if (!gameIdRecord) {
      gameIdRecord = await prisma.gameId.create({ data: { gameId } })
    }

    // Link user to game ID
    await prisma.userGameId.upsert({
      where: { userId_gameIdId: { userId: req.user.id, gameIdId: gameIdRecord.id } },
      update: {},
      create: { userId: req.user.id, gameIdId: gameIdRecord.id }
    })

    // Cloudinary URL from uploaded file
    const slipImageUrl = req.file?.path || null

    // Create deposit — OCR always skipped for now
    const deposit = await prisma.deposit.create({
      data: {
        userId: req.user.id,
        sessionId: session.id,
        gameIdId: gameIdRecord.id,
        currency,
        requestedAmount: parseFloat(amount),
        slipImageUrl,
        ocrStatus: 'skipped',
      }
    })

    // Update game ID last interaction
    await prisma.gameId.update({
      where: { id: gameIdRecord.id },
      data: {
        lastInteractedUserId: req.user.id,
        lastInteractedAt: new Date(),
        lastInteractionType: 'deposit',
      }
    })

    // Log activity
    await logActivity({
      sessionId: session.id,
      userId: req.user.id,
      gameIdId: gameIdRecord.id,
      entityType: 'deposit',
      entityId: deposit.id,
      action: 'created',
      depositId: deposit.id,
    })

    res.status(201).json(deposit)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router