const router = require('express').Router()
const prisma = require('../lib/prisma')

// GET /api/companies/:id/products?search=xxx&categoryId=xxx
router.get('/:id/products', async (req, res) => {
  const { search, categoryId } = req.query
  const products = await prisma.product.findMany({
    where: {
      companyId: req.params.id,
      isVisible: true,
      ...(categoryId && { categoryId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      })
    },
    select: { id: true, name: true, description: true, images: true, specs: true, categoryId: true, isVisible: true }
  })
  res.json(products)
})

module.exports = router