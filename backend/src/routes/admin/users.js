const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const userSelect = {
  id: true, username: true, firstName: true, lastName: true,
  telegramId: true, role: true, language: true,
  broadcastOptIn: true, tncAccepted: true, createdAt: true,
}

function serialize(data) {
  return JSON.parse(JSON.stringify(data, (_, v) =>
    typeof v === 'bigint' ? v.toString() : v
  ))
}

// GET /api/admin/users?q=
router.get('/', async (req, res) => {
  const { q } = req.query
  try {
    const where = q ? {
      OR: [
        { username: { contains: q, mode: 'insensitive' } },
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
      ]
    } : {}

    const users = await prisma.user.findMany({
      where,
      select: userSelect,
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    res.json(serialize(users))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/admin/users/:id  — full profile with stats + gameIds
router.get('/:id', async (req, res) => {
  const userId = parseInt(req.params.id)
  try {
    const [user, gameIds, depStats, withStats, recCount, newIdCount, ticketCount] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: userSelect }),

      prisma.gameId.findMany({
        where: { userGameIds: { some: { userId } } },
        orderBy: { lastInteractedAt: 'desc' },
        select: { id: true, gameId: true, createdAt: true, lastInteractedUserId: true, lastInteractedAt: true },
      }),

      prisma.deposit.aggregate({
        where: { userId },
        _count: { id: true },
        _sum: { approvedAmount: true },
      }),

      prisma.withdrawal.aggregate({
        where: { userId },
        _count: { id: true },
        _sum: { requestedAmount: true },
      }),

      prisma.recovery.count({ where: { userId } }),
      prisma.newIdRequest.count({ where: { userId } }),
      prisma.supportTicket.count({ where: { userId } }),
    ])

    if (!user) return res.status(404).json({ error: 'User not found' })

    res.json(serialize({
      user,
      gameIds,
      stats: {
        totalDeposits: depStats._count.id,
        totalDepositAmount: depStats._sum.approvedAmount,
        totalWithdrawals: withStats._count.id,
        totalWithdrawalAmount: withStats._sum.requestedAmount,
        totalRecoveries: recCount,
        totalNewIds: newIdCount,
        totalTickets: ticketCount,
      }
    }))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/admin/users/:id/requests?sessionId=
router.get('/:id/requests', async (req, res) => {
  const userId = parseInt(req.params.id)
  const sessionId = req.query.sessionId ? parseInt(req.query.sessionId) : undefined
  const sf = sessionId ? { sessionId } : {}

  try {
    const [deposits, withdrawals, recoveries, newIds, transfers, tickets] = await Promise.all([
      prisma.deposit.findMany({
        where: { userId, ...sf }, orderBy: { createdAt: 'desc' },
        select: {
          id: true, status: true, createdAt: true, requestedAmount: true, currency: true,
          gameId: { select: { gameId: true } }
        },
      }),
      prisma.withdrawal.findMany({
        where: { userId, ...sf }, orderBy: { createdAt: 'desc' },
        select: {
          id: true, status: true, createdAt: true, requestedAmount: true,
          gameId: { select: { gameId: true } }
        },
      }),
      prisma.recovery.findMany({
        where: { userId, ...sf }, orderBy: { createdAt: 'desc' },
        select: {
          id: true, status: true, createdAt: true,
          gameId: { select: { gameId: true } }
        },
      }),
      prisma.newIdRequest.findMany({
        where: { userId, ...sf }, orderBy: { createdAt: 'desc' },
        select: { id: true, status: true, createdAt: true, requestedGameId: true },
      }),
      prisma.chipTransfer.findMany({
        where: { userId, ...sf }, orderBy: { createdAt: 'desc' },
        select: {
          id: true, status: true, createdAt: true, amount: true,
          fromGameId: { select: { gameId: true } }, toGameId: { select: { gameId: true } }
        },
      }),
      prisma.supportTicket.findMany({
        where: { userId, ...sf }, orderBy: { createdAt: 'desc' },
        select: { id: true, status: true, createdAt: true, message: true },
      }),
    ])

    const all = [
      ...deposits.map(r => ({ type: 'deposit', ...r, amount: r.requestedAmount, gameId: r.gameId?.gameId })),
      ...withdrawals.map(r => ({ type: 'withdrawal', ...r, amount: r.requestedAmount, gameId: r.gameId?.gameId })),
      ...recoveries.map(r => ({ type: 'recovery', ...r, gameId: r.gameId?.gameId })),
      ...newIds.map(r => ({ type: 'newid', ...r, gameId: r.requestedGameId })),
      ...transfers.map(r => ({ type: 'transfer', ...r, gameId: `${r.fromGameId?.gameId} → ${r.toGameId?.gameId}` })),
      ...tickets.map(r => ({ type: 'ticket', ...r })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    res.json(serialize(all))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/admin/users/:id/timeline?sessionId=
router.get('/:id/timeline', async (req, res) => {
  const userId = parseInt(req.params.id)
  const sessionId = req.query.sessionId ? parseInt(req.query.sessionId) : undefined

  try {
    const logs = await prisma.activityLog.findMany({
      where: { userId, ...(sessionId ? { sessionId } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    res.json(serialize(logs))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router