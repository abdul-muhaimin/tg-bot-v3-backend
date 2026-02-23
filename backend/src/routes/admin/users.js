const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const { logActivity } = require('../../helpers/activityLog')

const prisma = new PrismaClient()

// ── GET /api/admin/users — list all users
router.get('/', async (req, res) => {
  try {
    const { search, isVip, isBanned } = req.query
    const where = {}
    if (isVip !== undefined) where.isVip = isVip === 'true'
    if (isBanned !== undefined) where.isBanned = isBanned === 'true'
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { nickname: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
      ]
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, telegramId: true, username: true, nickname: true,
        firstName: true, lastName: true, role: true, language: true,
        isBanned: true, isVip: true, tncAccepted: true,
        allTimeDepositCount: true, allTimeDepositAmount: true,
        allTimeWithdrawalCount: true, allTimeWithdrawalAmount: true,
        allTimeRecoveryCount: true,
        currentSessionDepositCount: true, currentSessionDepositAmount: true,
        currentSessionWithdrawalCount: true, currentSessionWithdrawalAmount: true,
        createdAt: true,
      }
    })

    res.json(users.map(u => ({ ...u, telegramId: u.telegramId.toString() })))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── GET /api/admin/users/:id — full user profile
router.get('/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id)
    const [user, gameIds, deposits, withdrawals, recoveries, newIds, tickets, transfers] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.userGameId.findMany({ where: { userId }, include: { gameId: true } }),
      prisma.deposit.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, include: { gameId: true, session: true } }),
      prisma.withdrawal.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, include: { gameId: true, session: true } }),
      prisma.recovery.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, include: { gameId: true, session: true } }),
      prisma.newIdRequest.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      prisma.supportTicket.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      prisma.chipTransfer.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, include: { fromGameId: true, toGameId: true } }),
    ])

    if (!user) return res.status(404).json({ error: 'User not found' })

    res.json({
      ...user,
      telegramId: user.telegramId.toString(),
      gameIds: gameIds.map(u => u.gameId),
      deposits, withdrawals, recoveries, newIds, tickets, transfers,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── GET /api/admin/users/:id/timeline
router.get('/:id/timeline', async (req, res) => {
  try {
    const logs = await prisma.activityLog.findMany({
      where: { userId: parseInt(req.params.id) },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    res.json(logs)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── PATCH /api/admin/users/:id/ban
router.patch('/:id/ban', async (req, res) => {
  try {
    const user = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: { isBanned: true }
    })
    await logActivity({ adminId: req.user.id, userId: user.id, entityType: 'user', entityId: user.id, action: 'banned' })
    res.json({ ...user, telegramId: user.telegramId.toString() })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── PATCH /api/admin/users/:id/unban
router.patch('/:id/unban', async (req, res) => {
  try {
    const user = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: { isBanned: false }
    })
    await logActivity({ adminId: req.user.id, userId: user.id, entityType: 'user', entityId: user.id, action: 'unbanned' })
    res.json({ ...user, telegramId: user.telegramId.toString() })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── PATCH /api/admin/users/:id/role
router.patch('/:id/role', async (req, res) => {
  const { role } = req.body
  if (!['user', 'admin', 'superadmin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' })
  }
  // Only superadmin can assign superadmin
  if (role === 'superadmin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Only superadmin can assign superadmin role' })
  }
  try {
    const user = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: { role }
    })
    res.json({ ...user, telegramId: user.telegramId.toString() })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── PATCH /api/admin/users/:id/vip
router.patch('/:id/vip', async (req, res) => {
  const { isVip } = req.body
  try {
    const user = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: { isVip: Boolean(isVip) }
    })
    res.json({ ...user, telegramId: user.telegramId.toString() })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router