const router = require('express').Router()
const prisma = require('../lib/prisma')

router.get('/:id/categories', async (req, res) => {
  const categories = await prisma.category.findMany({
    where: { companyId: req.params.id },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, name: true, parentId: true, sortOrder: true }
  })
  res.json(categories)
})

module.exports = router