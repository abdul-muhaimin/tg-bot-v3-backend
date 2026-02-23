const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const { logActivity } = require('../helpers/activityLog')

const prisma = new PrismaClient()

// ── GET /api/withdrawals — user's withdrawals
router.get('/', async (req, res) => {
  try {
    const withdrawals = await prisma.withdrawal.findMany({
      where: { userId: req.user.id },
      include: { gameId: true, session: true },
      orderBy: { createdAt: 'desc' }
    })
    res.json(withdrawals)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── GET /api/withdrawals/eligible-gameids
// Only returns game IDs where user is the last interacted person
router.get('/eligible-gameids', async (req, res) => {
  try {
    const eligible = await prisma.gameId.findMany({
      where: {
        lastInteractedUserId: req.user.id,
        // Must have at least one approved deposit by this user in current session
        deposits: {
          some: {
            userId: req.user.id,
            status: 'approved',
            session: { status: 'open' }
          }
        }
      }
    })
    res.json(eligible)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── POST /api/withdrawals
router.post('/', async (req, res) => {
  const { gameId, amount } = req.body

  if (!gameId || !amount) {
    return res.status(400).json({ error: 'gameId and amount are required' })
  }

  try {
    // Check system and feature
    const [statusConfig, featureConfig] = await Promise.all([
      prisma.config.findUnique({ where: { key: 'system_status' } }),
      prisma.config.findUnique({ where: { key: 'withdrawal_enabled' } }),
    ])
    if (statusConfig?.value !== 'open') return res.status(403).json({ error: 'system_closed' })
    if (featureConfig?.value !== 'true') return res.status(403).json({ error: 'feature_disabled' })

    // Get active session
    const session = await prisma.session.findFirst({
      where: { status: 'open' },
      orderBy: { openedAt: 'desc' }
    })
    if (!session) return res.status(403).json({ error: 'No active session' })

    // Validate game ID exists
    const gameIdRecord = await prisma.gameId.findUnique({ where: { gameId } })
    if (!gameIdRecord) return res.status(404).json({ error: 'invalid_gameid' })

    // Check eligibility — user must be last interacted
    if (gameIdRecord.lastInteractedUserId !== req.user.id) {
      return res.status(403).json({ error: 'gameid_not_eligible' })
    }

    // Must have approved deposit in current session for this game ID
    const hasApprovedDeposit = await prisma.deposit.findFirst({
      where: {
        userId: req.user.id,
        gameIdId: gameIdRecord.id,
        status: 'approved',
        sessionId: session.id,
      }
    })
    if (!hasApprovedDeposit) {
      return res.status(403).json({ error: 'not_eligible' })
    }

    // Check minimum amount
    const minConfig = await prisma.config.findUnique({ where: { key: 'withdrawal_min' } })
    if (minConfig && parseFloat(amount) < parseFloat(minConfig.value)) {
      return res.status(400).json({ error: `Minimum withdrawal is ${minConfig.value}` })
    }

    const withdrawal = await prisma.withdrawal.create({
      data: {
        userId: req.user.id,
        sessionId: session.id,
        gameIdId: gameIdRecord.id,
        requestedAmount: parseFloat(amount),
      }
    })

    // Update game ID last interaction
    await prisma.gameId.update({
      where: { id: gameIdRecord.id },
      data: {
        lastInteractedUserId: req.user.id,
        lastInteractedAt: new Date(),
        lastInteractionType: 'withdrawal',
      }
    })

    await logActivity({
      sessionId: session.id,
      userId: req.user.id,
      gameIdId: gameIdRecord.id,
      entityType: 'withdrawal',
      entityId: withdrawal.id,
      action: 'created',
      withdrawalId: withdrawal.id,
    })

    res.status(201).json(withdrawal)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router