const router = require('express').Router()
const { upload } = require('../lib/cloudinary')
const verifyToken = require('../middleware/verifyToken')

router.post('/', verifyToken, upload.single('image'), (req, res) => {
  res.json({ url: req.file.secure_url })
})

module.exports = router