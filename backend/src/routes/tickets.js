const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const { upload } = require('../services/cloudinary')
const { logActivity } = require('../helpers/activityLog')

const prisma = new PrismaClient()

// ── GET /api/tickets
router.get('/', async (req, res) => {
  try {
    const tickets = await prisma.supportTicket.findMany({
      where: { userId: req.user.id },
      include: { session: true },
      orderBy: { createdAt: 'desc' }
    })
    res.json(tickets)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── POST /api/tickets
router.post('/', upload.single('photo'), async (req, res) => {
  const { message } = req.body

  if (!message) return res.status(400).json({ error: 'message is required' })

  try {
    const [statusConfig, featureConfig] = await Promise.all([
      prisma.config.findUnique({ where: { key: 'system_status' } }),
      prisma.config.findUnique({ where: { key: 'support_enabled' } }),
    ])
    if (statusConfig?.value !== 'open') return res.status(403).json({ error: 'system_closed' })
    if (featureConfig?.value !== 'true') return res.status(403).json({ error: 'feature_disabled' })

    const session = await prisma.session.findFirst({
      where: { status: 'open' },
      orderBy: { openedAt: 'desc' }
    })
    if (!session) return res.status(403).json({ error: 'No active session' })

    const photoUrl = req.file?.path || null

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: req.user.id,
        sessionId: session.id,
        message,
        photoUrl,
      }
    })

    // Increment session support count
    await prisma.session.update({
      where: { id: session.id },
      data: { totalSupportCount: { increment: 1 } }
    })

    await logActivity({
      sessionId: session.id,
      userId: req.user.id,
      entityType: 'ticket',
      entityId: ticket.id,
      action: 'created',
      supportTicketId: ticket.id,
    })

    res.status(201).json(ticket)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router