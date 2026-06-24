const router = require('express').Router()
const prisma = require('../lib/prisma')
const verifyToken = require('../middleware/verifyToken')

router.post('/', verifyToken, async (req, res) => {
  const { name, parentId, sortOrder } = req.body
  const category = await prisma.category.create({
    data: { name, parentId: parentId || null, sortOrder: sortOrder || 0, companyId: req.admin.companyId }
  })
  res.json(category)
})

router.put('/:id', verifyToken, async (req, res) => {
  const { name, parentId, sortOrder } = req.body
  const category = await prisma.category.update({
    where: { id: req.params.id },
    data: { name, parentId: parentId || null, sortOrder: sortOrder || 0 }
  })
  res.json(category)
})

router.delete('/:id', verifyToken, async (req, res) => {
  await prisma.category.delete({ where: { id: req.params.id } })
  res.json({ success: true })
})

module.exports = router