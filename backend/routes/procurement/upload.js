const router = require('express').Router();
const { upload } = require('../../lib/cloudinary');
const prisma = require('../../lib/prisma');

router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUrl = req.file.secure_url;
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