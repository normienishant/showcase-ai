const router = require('express').Router()
const prisma = require('../lib/prisma')

router.get('/:id', async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    select: { id: true, name: true, description: true, images: true, specs: true, categoryId: true, isVisible: true }
  })
  if (!product) return res.status(404).json({ error: 'Product not found' })
  res.json(product)
})

module.exports = router