const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function logActivity({
  sessionId,
  userId,
  adminId,
  gameIdId,
  entityType,
  entityId,
  action,
  meta,
  depositId,
  withdrawalId,
  recoveryId,
  newIdRequestId,
  supportTicketId,
  chipTransferId,
}) {
  await prisma.activityLog.create({
    data: {
      sessionId,
      userId,
      adminId,
      gameIdId,
      entityType,
      entityId,
      action,
      meta,
      depositId,
      withdrawalId,
      recoveryId,
      newIdRequestId,
      supportTicketId,
      chipTransferId,
    }
  })
}

module.exports = { logActivity }