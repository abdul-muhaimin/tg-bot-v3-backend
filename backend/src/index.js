require('dotenv').config()
const express = require('express')
const cors = require('cors')

const path = require('path')
const telegramAuth = require('./middleware/telegramAuth')
const configRouter = require('./routes/config')
const usersRouter = require('./routes/users')
const depositsRouter = require('./routes/deposits')
const withdrawalsRouter = require('./routes/withdrawals')
const recoveriesRouter = require('./routes/recoveries')
const newidRouter = require('./routes/newid')
const transfersRouter = require('./routes/transfers')
const ticketsRouter = require('./routes/tickets')
const adminBannersRouter = require('./routes/admin/banners')
const adminAuth = require('./middleware/adminAuth')
const bot = require('./bot/index')

const app = express()

app.use(cors())
app.use(express.json())
app.use('/docs', express.static(path.join(__dirname, '../public')))

// ── Public ──
app.use('/api/config', configRouter)

// ── Protected ──
app.use('/api/users', telegramAuth, usersRouter)
app.use('/api/deposits', telegramAuth, depositsRouter)
app.use('/api/withdrawals', telegramAuth, withdrawalsRouter)
app.use('/api/recoveries', telegramAuth, recoveriesRouter)
app.use('/api/newid', telegramAuth, newidRouter)
app.use('/api/transfers', telegramAuth, transfersRouter)
app.use('/api/tickets', telegramAuth, ticketsRouter)
app.use('/api/admin/banners', telegramAuth, adminAuth, adminBannersRouter)

app.get('/health', (req, res) => res.json({ ok: true }))

bot.start()
console.log('✔ Bot started')

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`✔ Server running on port ${PORT}`))