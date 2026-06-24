const router = require('express').Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const prisma = require('../lib/prisma')

router.post('/login', async (req, res) => {
  const { email, password } = req.body
  const admin = await prisma.admin.findUnique({ where: { email } })
  if (!admin) return res.status(401).json({ error: 'Invalid credentials' })

  const valid = await bcrypt.compare(password, admin.password)
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

  const token = jwt.sign(
    { id: admin.id, email: admin.email, companyId: admin.companyId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )

  res.json({ token, user: { id: admin.id, name: admin.name, email: admin.email } })
})

module.exports = router