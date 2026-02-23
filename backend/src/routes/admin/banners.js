const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const { upload, cloudinary } = require('../../services/cloudinary')

const prisma = new PrismaClient()

// GET /api/admin/banners
router.get('/', async (req, res) => {
  try {
    const banners = await prisma.banner.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }]
    })
    res.json(banners)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/admin/banners — upload new banner
router.post('/', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Image is required' })

  try {
    const banner = await prisma.banner.create({
      data: {
        imageUrl: req.file.path,
        linkUrl: req.body.linkUrl || null,
        isActive: true,
        sortOrder: parseInt(req.body.sortOrder) || 0,
      }
    })
    res.status(201).json(banner)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/admin/banners/:id — update image or settings
router.patch('/:id', upload.single('image'), async (req, res) => {
  try {
    const existing = await prisma.banner.findUnique({
      where: { id: parseInt(req.params.id) }
    })
    if (!existing) return res.status(404).json({ error: 'Banner not found' })

    const data = {}

    // New image uploaded — delete old from Cloudinary
    if (req.file) {
      // Extract public_id from old URL and delete
      try {
        const parts = existing.imageUrl.split('/')
        const filename = parts[parts.length - 1]
        const publicId = `banners/${filename.split('.')[0]}`
        await cloudinary.uploader.destroy(publicId)
      } catch { }
      data.imageUrl = req.file.path
    }

    if (req.body.linkUrl !== undefined) data.linkUrl = req.body.linkUrl || null
    if (req.body.isActive !== undefined) data.isActive = req.body.isActive === 'true'
    if (req.body.sortOrder !== undefined) data.sortOrder = parseInt(req.body.sortOrder)

    const updated = await prisma.banner.update({
      where: { id: parseInt(req.params.id) },
      data,
    })
    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/admin/banners/:id
router.delete('/:id', async (req, res) => {
  try {
    const existing = await prisma.banner.findUnique({
      where: { id: parseInt(req.params.id) }
    })
    if (!existing) return res.status(404).json({ error: 'Banner not found' })

    // Delete from Cloudinary
    try {
      const parts = existing.imageUrl.split('/')
      const filename = parts[parts.length - 1]
      const publicId = `banners/${filename.split('.')[0]}`
      await cloudinary.uploader.destroy(publicId)
    } catch { }

    await prisma.banner.delete({ where: { id: parseInt(req.params.id) } })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router