-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "telegramId" BIGINT NOT NULL,
    "username" TEXT,
    "nickname" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "language" TEXT NOT NULL DEFAULT 'en',
    "broadcastOptIn" BOOLEAN NOT NULL DEFAULT true,
    "tncAccepted" BOOLEAN NOT NULL DEFAULT false,
    "tncAcceptedAt" TIMESTAMP(3),
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "isVip" BOOLEAN NOT NULL DEFAULT false,
    "allTimeDepositCount" INTEGER NOT NULL DEFAULT 0,
    "allTimeDepositAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "allTimeWithdrawalCount" INTEGER NOT NULL DEFAULT 0,
    "allTimeWithdrawalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "allTimeRecoveryCount" INTEGER NOT NULL DEFAULT 0,
    "currentSessionDepositCount" INTEGER NOT NULL DEFAULT 0,
    "currentSessionDepositAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currentSessionWithdrawalCount" INTEGER NOT NULL DEFAULT 0,
    "currentSessionWithdrawalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "openedById" INTEGER NOT NULL,
    "closedById" INTEGER,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "totalDepositCount" INTEGER NOT NULL DEFAULT 0,
    "totalDepositAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalWithdrawalCount" INTEGER NOT NULL DEFAULT 0,
    "totalWithdrawalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalRecoveryCount" INTEGER NOT NULL DEFAULT 0,
    "totalNewIdCount" INTEGER NOT NULL DEFAULT 0,
    "totalSupportCount" INTEGER NOT NULL DEFAULT 0,
    "totalChipTransferCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameId" (
    "id" SERIAL NOT NULL,
    "gameId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastInteractedUserId" INTEGER,
    "lastInteractedAt" TIMESTAMP(3),
    "lastInteractionType" TEXT,

    CONSTRAINT "GameId_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserGameId" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "gameIdId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserGameId_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deposit" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "gameIdId" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "requestedAmount" DOUBLE PRECISION NOT NULL,
    "approvedAmount" DOUBLE PRECISION,
    "slipImageUrl" TEXT,
    "ocrStatus" TEXT NOT NULL DEFAULT 'pending',
    "ocrData" JSONB,
    "ocrAmountMatch" BOOLEAN,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "adminNote" TEXT,
    "adminId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actionedAt" TIMESTAMP(3),

    CONSTRAINT "Deposit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Withdrawal" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "gameIdId" INTEGER NOT NULL,
    "requestedAmount" DOUBLE PRECISION NOT NULL,
    "approvedAmount" DOUBLE PRECISION,
    "slipImageUrl" TEXT,
    "extraField1" TEXT,
    "adminNote" TEXT,
    "adminId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actionedAt" TIMESTAMP(3),

    CONSTRAINT "Withdrawal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recovery" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "gameIdId" INTEGER NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'recovery',
    "createdByAdminId" INTEGER,
    "slipImageUrl" TEXT,
    "extraField1" TEXT,
    "adminNote" TEXT,
    "adminId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actionedAt" TIMESTAMP(3),

    CONSTRAINT "Recovery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewIdRequest" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "gameIdId" INTEGER,
    "requestedGameId" TEXT NOT NULL,
    "adminNote" TEXT,
    "adminId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actionedAt" TIMESTAMP(3),

    CONSTRAINT "NewIdRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "photoUrl" TEXT,
    "adminNote" TEXT,
    "adminId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actionedAt" TIMESTAMP(3),

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChipTransfer" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "fromGameIdId" INTEGER NOT NULL,
    "toGameIdId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "adminNote" TEXT,
    "adminId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actionedAt" TIMESTAMP(3),

    CONSTRAINT "ChipTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentAccount" (
    "id" SERIAL NOT NULL,
    "currency" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "accountNumber" TEXT,
    "accountName" TEXT,
    "walletAddress" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Config" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BotMessage" (
    "id" SERIAL NOT NULL,
    "messageKey" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BotMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" SERIAL NOT NULL,
    "sessionId" INTEGER,
    "userId" INTEGER,
    "adminId" INTEGER,
    "gameIdId" INTEGER,
    "entityType" TEXT NOT NULL,
    "entityId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "depositId" INTEGER,
    "withdrawalId" INTEGER,
    "recoveryId" INTEGER,
    "newIdRequestId" INTEGER,
    "supportTicketId" INTEGER,
    "chipTransferId" INTEGER,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");

-- CreateIndex
CREATE UNIQUE INDEX "GameId_gameId_key" ON "GameId"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "UserGameId_userId_gameIdId_key" ON "UserGameId"("userId", "gameIdId");

-- CreateIndex
CREATE UNIQUE INDEX "Config_key_key" ON "Config"("key");

-- CreateIndex
CREATE UNIQUE INDEX "BotMessage_messageKey_language_key" ON "BotMessage"("messageKey", "language");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_openedById_fkey" FOREIGN KEY ("openedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameId" ADD CONSTRAINT "GameId_lastInteractedUserId_fkey" FOREIGN KEY ("lastInteractedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGameId" ADD CONSTRAINT "UserGameId_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGameId" ADD CONSTRAINT "UserGameId_gameIdId_fkey" FOREIGN KEY ("gameIdId") REFERENCES "GameId"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deposit" ADD CONSTRAINT "Deposit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deposit" ADD CONSTRAINT "Deposit_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deposit" ADD CONSTRAINT "Deposit_gameIdId_fkey" FOREIGN KEY ("gameIdId") REFERENCES "GameId"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deposit" ADD CONSTRAINT "Deposit_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Withdrawal" ADD CONSTRAINT "Withdrawal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Withdrawal" ADD CONSTRAINT "Withdrawal_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Withdrawal" ADD CONSTRAINT "Withdrawal_gameIdId_fkey" FOREIGN KEY ("gameIdId") REFERENCES "GameId"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Withdrawal" ADD CONSTRAINT "Withdrawal_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recovery" ADD CONSTRAINT "Recovery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recovery" ADD CONSTRAINT "Recovery_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recovery" ADD CONSTRAINT "Recovery_gameIdId_fkey" FOREIGN KEY ("gameIdId") REFERENCES "GameId"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recovery" ADD CONSTRAINT "Recovery_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recovery" ADD CONSTRAINT "Recovery_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewIdRequest" ADD CONSTRAINT "NewIdRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewIdRequest" ADD CONSTRAINT "NewIdRequest_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewIdRequest" ADD CONSTRAINT "NewIdRequest_gameIdId_fkey" FOREIGN KEY ("gameIdId") REFERENCES "GameId"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewIdRequest" ADD CONSTRAINT "NewIdRequest_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChipTransfer" ADD CONSTRAINT "ChipTransfer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChipTransfer" ADD CONSTRAINT "ChipTransfer_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChipTransfer" ADD CONSTRAINT "ChipTransfer_fromGameIdId_fkey" FOREIGN KEY ("fromGameIdId") REFERENCES "GameId"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChipTransfer" ADD CONSTRAINT "ChipTransfer_toGameIdId_fkey" FOREIGN KEY ("toGameIdId") REFERENCES "GameId"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChipTransfer" ADD CONSTRAINT "ChipTransfer_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_gameIdId_fkey" FOREIGN KEY ("gameIdId") REFERENCES "GameId"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_depositId_fkey" FOREIGN KEY ("depositId") REFERENCES "Deposit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_withdrawalId_fkey" FOREIGN KEY ("withdrawalId") REFERENCES "Withdrawal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_recoveryId_fkey" FOREIGN KEY ("recoveryId") REFERENCES "Recovery"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_newIdRequestId_fkey" FOREIGN KEY ("newIdRequestId") REFERENCES "NewIdRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_supportTicketId_fkey" FOREIGN KEY ("supportTicketId") REFERENCES "SupportTicket"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_chipTransferId_fkey" FOREIGN KEY ("chipTransferId") REFERENCES "ChipTransfer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
