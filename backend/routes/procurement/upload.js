// backend/routes/procurement/upload.js
const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const prisma = require('../../lib/prisma');

// Local storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const fileName = req.file.originalname;

    const session = await prisma.procurementSession.create({
      data: {
        fileName,
        fileUrl,
        userId: req.body.userId || 'anonymous',
        status: 'uploaded',
      },
    });

    res.json({ session, message: 'File uploaded successfully' });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

module.exports = router;