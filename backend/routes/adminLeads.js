const router = require('express').Router()
const prisma = require('../lib/prisma')
const verifyToken = require('../middleware/verifyToken')

// GET /api/admin/companies/:id/leads
router.get('/companies/:id/leads', verifyToken, async (req, res) => {
  const leads = await prisma.lead.findMany({
    where: { companyId: req.params.id },
    orderBy: { createdAt: 'desc' }
  })
  res.json(leads)
})

// PUT /api/admin/leads/:id/status
router.put('/leads/:id/status', verifyToken, async (req, res) => {
  const { status } = req.body
  await prisma.lead.update({ where: { id: req.params.id }, data: { status } })
  res.json({ success: true })
})

module.exports = router