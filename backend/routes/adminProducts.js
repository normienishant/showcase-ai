const router = require('express').Router()
const prisma = require('../lib/prisma')
const verifyToken = require('../middleware/verifyToken')

router.post('/', verifyToken, async (req, res) => {
  const { name, description, specs, images, documents, categoryId, isVisible } = req.body
  const product = await prisma.product.create({
    data: { name, description, specs, images, documents, categoryId, isVisible: isVisible ?? true, companyId: req.admin.companyId }
  })
  res.json(product)
})

router.put('/:id', verifyToken, async (req, res) => {
  const { name, description, specs, images, documents, categoryId, isVisible } = req.body
  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: { name, description, specs, images, documents, categoryId, isVisible }
  })
  res.json(product)
})

router.delete('/:id', verifyToken, async (req, res) => {
  await prisma.product.delete({ where: { id: req.params.id } })
  res.json({ success: true })
})

module.exports = router