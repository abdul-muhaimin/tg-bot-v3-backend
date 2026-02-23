const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Public — no auth — called on mini app startup
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

module.exports = router