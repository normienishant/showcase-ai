require('dotenv').config()
require('express-async-errors')
const express = require('express')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/auth', require('./routes/auth'))
app.use('/api/company', require('./routes/company'))
app.use('/api/companies', require('./routes/categories'))
app.use('/api/admin/categories', require('./routes/adminCategories'))
app.use('/api/companies', require('./routes/products'))
app.use('/api/products', require('./routes/productById'))
app.use('/api/admin/products', require('./routes/adminProducts'))
app.use('/api/upload', require('./routes/upload'))
app.use('/api/companies', require('./routes/leads'))
app.use('/api/admin', require('./routes/adminLeads'))

app.get('/api/health', (req, res) => res.json({ ok: true }))

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: err.message })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))

