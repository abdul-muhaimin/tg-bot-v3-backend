const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Called on mini app load — get current user profile
router.get('/me', async (req, res) => {
  try {
    const user = req.user
    res.json({
      ...user,
      telegramId: user.telegramId.toString()
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get all game IDs associated with this user
router.get('/me/gameids', async (req, res) => {
  try {
    const userGameIds = await prisma.userGameId.findMany({
      where: { userId: req.user.id },
      include: { gameId: true },
      orderBy: { createdAt: 'desc' }
    })
    res.json(userGameIds.map(u => u.gameId))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get all requests for "My Requests" page
router.get('/me/requests', async (req, res) => {
  try {
    const userId = req.user.id

    const [deposits, withdrawals, recoveries, newIds, tickets, transfers] = await Promise.all([
      prisma.deposit.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, include: { gameId: true } }),
      prisma.withdrawal.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, include: { gameId: true } }),
      prisma.recovery.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, include: { gameId: true } }),
      prisma.newIdRequest.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      prisma.supportTicket.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      prisma.chipTransfer.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, include: { fromGameId: true, toGameId: true } }),
    ])

    res.json({ deposits, withdrawals, recoveries, newIds, tickets, transfers })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Accept TNC
router.post('/me/accept-tnc', async (req, res) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { tncAccepted: true, tncAcceptedAt: new Date() }
    })
    res.json({ ...user, telegramId: user.telegramId.toString() })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Update language preference
router.patch('/me/language', async (req, res) => {
  const { language } = req.body
  if (!['en', 'dv'].includes(language)) {
    return res.status(400).json({ error: 'Invalid language' })
  }
  try {
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { language }
    })
    res.json({ ...user, telegramId: user.telegramId.toString() })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Update broadcast opt-in
router.patch('/me/broadcast', async (req, res) => {
  const { broadcastOptIn } = req.body
  try {
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { broadcastOptIn: Boolean(broadcastOptIn) }
    })
    res.json({ ...user, telegramId: user.telegramId.toString() })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router