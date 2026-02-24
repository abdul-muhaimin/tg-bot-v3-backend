const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

function serialize(data) {
  return JSON.parse(JSON.stringify(data, (_, v) =>
    typeof v === 'bigint' ? v.toString() : v
  ))
}

// GET /api/admin/gameids/:id
router.get('/:id', async (req, res) => {
  const gameIdId = parseInt(req.params.id)

  try {
    const gameIdRecord = await prisma.gameId.findUnique({
      where: { id: gameIdId },
      include: {
        lastInteractedUser: {
          select: { id: true, username: true, firstName: true, lastName: true, telegramId: true }
        },
        userGameIds: {
          include: {
            user: {
              select: { id: true, username: true, firstName: true, lastName: true, telegramId: true }
            }
          }
        }
      }
    })

    if (!gameIdRecord) return res.status(404).json({ error: 'Game ID not found' })

    const allUsers = gameIdRecord.userGameIds.map(ug => ug.user)

    const [deposits, withdrawals, recoveries, newIds, transfers] = await Promise.all([
      prisma.deposit.findMany({
        where: { gameIdId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, status: true, createdAt: true,
          requestedAmount: true, currency: true,
          user: { select: { id: true, username: true, firstName: true } }
        }
      }),
      prisma.withdrawal.findMany({
        where: { gameIdId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, status: true, createdAt: true, requestedAmount: true,
          user: { select: { id: true, username: true, firstName: true } }
        }
      }),
      prisma.recovery.findMany({
        where: { gameIdId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, status: true, createdAt: true,
          user: { select: { id: true, username: true, firstName: true } }
        }
      }),
      prisma.newIdRequest.findMany({
        where: { gameIdId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, status: true, createdAt: true, requestedGameId: true,
          user: { select: { id: true, username: true, firstName: true } }
        }
      }),
      prisma.chipTransfer.findMany({
        where: { OR: [{ fromGameIdId: gameIdId }, { toGameIdId: gameIdId }] },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, status: true, createdAt: true, amount: true,
          fromGameId: { select: { gameId: true } },
          toGameId: { select: { gameId: true } },
          user: { select: { id: true, username: true, firstName: true } }
        }
      }),
    ])

    const history = [
      ...deposits.map(r => ({ type: 'deposit', ...r, amount: r.requestedAmount, gameId: gameIdRecord.gameId })),
      ...withdrawals.map(r => ({ type: 'withdrawal', ...r, amount: r.requestedAmount, gameId: gameIdRecord.gameId })),
      ...recoveries.map(r => ({ type: 'recovery', ...r, gameId: gameIdRecord.gameId })),
      ...newIds.map(r => ({ type: 'newid', ...r, gameId: r.requestedGameId })),
      ...transfers.map(r => ({ type: 'transfer', ...r, gameId: `${r.fromGameId?.gameId} → ${r.toGameId?.gameId}` })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    res.json(serialize({
      gameId: gameIdRecord.gameId,
      currentOwner: gameIdRecord.lastInteractedUser,
      allUsers,
      history,
    }))

  } catch (err) {
    console.error(`[admin/gameids/${gameIdId}] error:`, err.message)
    res.status(500).json({ error: err.message })
  }
})

module.exports = router