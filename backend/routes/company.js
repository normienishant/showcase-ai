const router = require('express').Router()
const prisma = require('../lib/prisma')
const verifyToken = require('../middleware/verifyToken')

// GET /api/company/:slug — public, used by frontend to load branding
router.get('/:slug', async (req, res) => {
  const company = await prisma.company.findUnique({
    where: { slug: req.params.slug },
    select: { id: true, name: true, primaryColor: true, logoUrl: true, whatsappNumber: true, websiteUrl: true }
  })
  if (!company) return res.status(404).json({ error: 'Company not found' })
  res.json(company)
})

// PUT /api/admin/company — update branding (admin only)
router.put('/admin/company', verifyToken, async (req, res) => {
  const { name, primaryColor, logoUrl, whatsappNumber, websiteUrl } = req.body
  const company = await prisma.company.update({
    where: { id: req.admin.companyId },
    data: { name, primaryColor, logoUrl, whatsappNumber, websiteUrl }
  })
  res.json(company)
})

module.exports = router