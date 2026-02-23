const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// GET /api/config
router.get('/', async (req, res) => {
  try {
    const configs = await prisma.config.findMany()
    const result = {}
    configs.forEach(c => result[c.key] = c.value)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/config/banners — public, no auth
router.get('/banners', async (req, res) => {
  try {
    const banners = await prisma.banner.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }]
    })
    res.json(banners)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
