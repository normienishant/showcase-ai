// backend/routes/procurement/upload.js
const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');   // ✅ changed back
const AdmZip = require('adm-zip');
const prisma = require('../../lib/prisma');

// ─── Storage ────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// ─── File filter ────────────────────────────────────────────
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowed = ['.pdf', '.txt', '.docx', '.doc', '.zip'];
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Allowed: PDF, TXT, DOCX, DOC, ZIP'), false);
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 25 * 1024 * 1024 } });

// ─── Extract text from uploaded file ────────────────────────
async function extractTextFromFile(filePath, originalName) {
  const ext = path.extname(originalName).toLowerCase();

  if (ext === '.txt') {
    return fs.readFileSync(filePath, 'utf-8');
  }

  if (ext === '.pdf') {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);  // ✅ fixed
    console.log('📄 PDF parsed, text length:', data.text.length);
    return data.text;
  }

  if (ext === '.zip') {
    const zip = new AdmZip(filePath);
    const entries = zip.getEntries();
    let combined = '';
    for (const entry of entries) {
      if (!entry.isDirectory) {
        const entryExt = path.extname(entry.entryName).toLowerCase();
        if (entryExt === '.pdf') {
          const buf = entry.getData();
          const parsed = await pdfParse(buf);
          combined += `\n--- ${entry.entryName} ---\n` + parsed.text;
        } else if (entryExt === '.txt') {
          const text = entry.getData().toString('utf-8');
          combined += `\n--- ${entry.entryName} ---\n` + text;
        }
      }
    }
    return combined;
  }

  // Fallback for DOCX/DOC
  if (ext === '.docx' || ext === '.doc') {
    try {
      const mammoth = require('mammoth');
      const buffer = fs.readFileSync(filePath);
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch {
      return fs.readFileSync(filePath, 'utf-8');
    }
  }

  throw new Error(`Unsupported file type: ${ext}`);
}

// ─── Upload route ────────────────────────────────────────────
router.post('/', upload.single('file'), async (req, res) => {
  console.log('📤 Upload route hit, file:', req.file);

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    let extractedText = '';
    try {
      extractedText = await extractTextFromFile(req.file.path, req.file.originalname);
      console.log('✅ Extraction successful, text length:', extractedText.length);
    } catch (extractErr) {
      console.warn('⚠️ Text extraction warning:', extractErr.message);
      extractedText = '';
    }

    const textFilePath = req.file.path + '.txt';
    fs.writeFileSync(textFilePath, extractedText, 'utf-8');

    const session = await prisma.procurementSession.create({
      data: {
        fileName: req.file.originalname,
        fileUrl: `/uploads/${req.file.filename}`,
        userId: req.body.userId || 'anonymous',
        status: 'uploaded',
        extractedData: {
          rawText: extractedText,
          extractedAt: new Date().toISOString()
        }
      }
    });

    res.json({
      session,
      message: 'File uploaded and text extracted successfully',
      textLength: extractedText.length
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({ error: 'Upload failed', details: error.message });
  }
});

module.exports = router;