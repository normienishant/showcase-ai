// backend/routes/procurement/analysis.js
const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');
const { PdfReader } = require('pdfreader');
const AdmZip = require('adm-zip');
const axios = require('axios');
const FormData = require('form-data');
const { analyzeDocumentWithGroq } = require('../../lib/groq');

// ─── OCR using OCR.space ────────────────────────────────────
async function performOCR(filePath) {
  const formData = new FormData();
  formData.append('file', fs.createReadStream(filePath));
  formData.append('apikey', process.env.OCR_SPACE_API_KEY || '');
  formData.append('OCREngine', '2');
  formData.append('scale', 'true');
  formData.append('isTable', 'true');

  try {
    const response = await axios.post('https://api.ocr.space/parse/image', formData, {
      headers: formData.getHeaders(),
      timeout: 60000,
    });
    if (response.data.OCRExitCode === 1) {
      const text = response.data.ParsedResults?.[0]?.ParsedText || '';
      console.log('✅ OCR successful, text length:', text.length);
      return text;
    } else {
      console.error('OCR error:', response.data.ErrorMessage || 'Unknown error');
      return '';
    }
  } catch (error) {
    console.error('OCR API error:', error.message);
    return '';
  }
}

// ─── Extract text from file ──────────────────────────────
async function extractTextFromFile(filePath, originalName) {
  const ext = path.extname(originalName).toLowerCase();

  if (ext === '.txt') {
    return fs.readFileSync(filePath, 'utf-8');
  }

  if (ext === '.pdf') {
    console.log('📄 PDF detected, parsing with pdfreader...');
    const buffer = fs.readFileSync(filePath);
    let text = await new Promise((resolve, reject) => {
      let t = '';
      new PdfReader().parseBuffer(buffer, (err, item) => {
        if (err) reject(err);
        else if (!item) resolve(t);
        else if (item.text) t += item.text + ' ';
      });
    });
    console.log('📄 pdfreader extracted length:', text.length);

    // Fallback to OCR if text is too short
    if (text.length < 50) {
      console.log('⚠️ Low text quality, falling back to OCR...');
      const ocrText = await performOCR(filePath);
      if (ocrText && ocrText.length > 50) {
        console.log('✅ OCR extracted length:', ocrText.length);
        return ocrText;
      }
    }
    return text;
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
          let t = await new Promise((resolve, reject) => {
            let txt = '';
            new PdfReader().parseBuffer(buf, (err, item) => {
              if (err) reject(err);
              else if (!item) resolve(txt);
              else if (item.text) txt += item.text + ' ';
            });
          });
          combined += `\n--- ${entry.entryName} ---\n` + t;
        } else if (entryExt === '.txt') {
          const text = entry.getData().toString('utf-8');
          combined += `\n--- ${entry.entryName} ---\n` + text;
        }
      }
    }
    return combined;
  }

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

// ─── Preprocess text ──────────────────────────────────────
function preprocessText(text) {
  return text.replace(/\n{3,}/g, '\n\n').trim();
}

// ─── Main analysis route ────────────────────────────────────
router.get('/:id', async (req, res) => {
  console.log('🔍 Analysis route hit for ID:', req.params.id);
  const { id } = req.params;

  try {
    const session = await prisma.procurementSession.findUnique({
      where: { id }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const hasRawText = session.extractedData?.rawText && session.extractedData.rawText.length > 50;
    const hasAnalysis = session.extractedData?.analysis && Object.keys(session.extractedData.analysis).length > 0;

    if (hasRawText && hasAnalysis && session.status === 'analysis_done') {
      console.log('✅ Using cached analysis');
      return res.json({ session, extracted: session.extractedData.analysis });
    }

    console.log('🔄 Starting fresh analysis...');
    await prisma.procurementSession.update({
      where: { id },
      data: { status: 'analyzing' }
    });

    let fileText = '';

    if (session.extractedData?.rawText && session.extractedData.rawText.length > 50) {
      fileText = session.extractedData.rawText;
      console.log('📄 Using stored rawText, length:', fileText.length);
    } else {
      const fileUrl = session.fileUrl;
      if (fileUrl.startsWith('/uploads/')) {
        const filePath = path.join(__dirname, '../..', fileUrl);
        console.log('📂 File path:', filePath);
        if (!fs.existsSync(filePath)) {
          return res.status(404).json({ error: 'Uploaded file not found' });
        }
        fileText = await extractTextFromFile(filePath, session.fileName);
        console.log('📄 Final extracted length:', fileText.length);
      } else {
        const response = await fetch(fileUrl);
        const buffer = await response.arrayBuffer();
        fileText = buffer.toString('utf-8');
      }
    }

    if (!fileText || fileText.length < 20) {
      console.error('❌ Extracted text is too short:', fileText.length);
      return res.status(400).json({
        error: 'Could not extract text. The file might be scanned, corrupted, or empty. Please upload a text-based PDF or TXT file.'
      });
    }

    const processedText = preprocessText(fileText);
    console.log('🤖 Calling Groq AI for extraction...');
    let analysisResult;
    try {
      analysisResult = await analyzeDocumentWithGroq(processedText);
      console.log('✅ AI extraction complete.');
    } catch (aiError) {
      console.error('❌ AI error:', aiError.message);
      analysisResult = {
        client: { name: 'Extraction Failed', address: 'Not specified', contact: 'Not specified' },
        scope: 'Could not extract scope. Please review document manually.',
        deadlines: { submission: 'Not specified', delivery: 'Not specified', milestones: [] },
        risks: ['AI extraction failed – please verify manually.'],
        paymentTerms: 'Not specified',
        boq: []
      };
    }

    if (!Array.isArray(analysisResult.boq)) {
      analysisResult.boq = [];
    }

    const updatedSession = await prisma.procurementSession.update({
      where: { id },
      data: {
        extractedData: {
          rawText: fileText,
          analysis: analysisResult,
          extractedAt: new Date().toISOString()
        },
        status: 'analysis_done'
      }
    });

    res.json({ session: updatedSession, extracted: analysisResult });
  } catch (error) {
    console.error('❌ Analysis error:', error);
    res.status(500).json({ error: error.message || 'Analysis failed' });
  }
});

module.exports = router;