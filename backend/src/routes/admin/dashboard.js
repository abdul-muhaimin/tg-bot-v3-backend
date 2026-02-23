const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

router.get('/', async (req, res) => {
  try {
    const session = await prisma.session.findFirst({
      where: { status: 'open' },
      orderBy: { openedAt: 'desc' }
    })

    const [
      pendingDeposits,
      pendingWithdrawals,
      pendingRecoveries,
      pendingNewIds,
      openTickets,
      pendingTransfers,
      totalUsers,
      recentLogs,
    ] = await Promise.all([
      prisma.deposit.count({ where: { status: 'pending' } }),
      prisma.withdrawal.count({ where: { status: 'pending' } }),
      prisma.recovery.count({ where: { status: 'pending' } }),
      prisma.newIdRequest.count({ where: { status: 'pending' } }),
      prisma.supportTicket.count({ where: { status: { not: 'closed' } } }),
      prisma.chipTransfer.count({ where: { status: 'pending' } }),
      prisma.user.count(),
      prisma.activityLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          user: { select: { username: true, nickname: true } },
          admin: { select: { username: true, nickname: true } },
        }
      }),
    ])

    res.json({
      session,
      pending: {
        deposits: pendingDeposits,
        withdrawals: pendingWithdrawals,
        recoveries: pendingRecoveries,
        newIds: pendingNewIds,
        tickets: openTickets,
        transfers: pendingTransfers,
        total: pendingDeposits + pendingWithdrawals + pendingRecoveries + pendingNewIds + pendingTransfers,
      },
      totalUsers,
      recentLogs,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router