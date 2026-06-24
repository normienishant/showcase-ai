const router = require('express').Router()
const prisma = require('../lib/prisma')

// POST /api/companies/:id/leads — public, customer submits inquiry
router.post('/:id/leads', async (req, res) => {
  const { name, email, phone, message, wishlist_snapshot } = req.body
  const lead = await prisma.lead.create({
    data: { name, email, phone, message, wishlistSnapshot: wishlist_snapshot, companyId: req.params.id }
  })
  res.json({ id: lead.id, createdAt: lead.createdAt, status: lead.status })
})

module.exports = router