const crypto = require('crypto')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

function validateInitData(initData, botToken) {
  const params = new URLSearchParams(initData)
  const hash = params.get('hash')
  params.delete('hash')

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n')

  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest()

  const expectedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex')

  return expectedHash === hash
}

module.exports = async (req, res, next) => {
  const initData = req.headers['x-init-data']

  if (!initData) return res.status(401).json({ error: 'Missing init data' })

  const isValid = validateInitData(initData, process.env.BOT_TOKEN)
  if (!isValid) return res.status(401).json({ error: 'Invalid init data' })

  const params = new URLSearchParams(initData)
  const telegramUser = JSON.parse(params.get('user'))

  // Load full user from DB
  const user = await prisma.user.findUnique({
    where: { telegramId: BigInt(telegramUser.id) }
  })

  if (!user) return res.status(401).json({ error: 'User not found. Please start the bot first.' })
  if (user.isBanned) return res.status(403).json({ error: 'banned' })

  req.user = user
  next()
}