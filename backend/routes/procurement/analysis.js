// backend/routes/procurement/analysis.js
const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');   // ✅ fixed
const AdmZip = require('adm-zip');
const { analyzeDocumentWithGroq } = require('../../lib/groq');

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

    const hasRawText = session.extractedData?.rawText && session.extractedData.rawText.length > 20;
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

    if (session.extractedData?.rawText && session.extractedData.rawText.length > 20) {
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
        console.log('📄 Fresh extraction, length:', fileText.length);
      } else {
        const response = await fetch(fileUrl);
        const buffer = await response.arrayBuffer();
        fileText = buffer.toString('utf-8');
      }
    }

    if (!fileText || fileText.length < 20) {
      return res.status(400).json({
        error: 'Could not extract text. Please upload a text-based PDF or TXT file.'
      });
    }

    console.log('🤖 Calling Groq AI for extraction...');
    let analysisResult;
    try {
      analysisResult = await analyzeDocumentWithGroq(fileText);
      console.log('✅ AI extraction complete.');
    } catch (aiError) {
      console.error('❌ AI error:', aiError.message);
      analysisResult = {
        client: { name: 'Extraction Failed', address: '', contact: '' },
        scope: 'Could not extract scope.',
        boq: [],
        deadlines: { submission: '', delivery: '', milestones: [] },
        risks: ['AI extraction failed – please review manually.'],
        paymentTerms: 'N/A'
      };
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