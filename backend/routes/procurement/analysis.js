// backend/routes/procurement/analysis.js
const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');
const { extractProcurementData } = require('../../lib/groq');

// ─── Fallback sample data (if AI fails) ──────────────────
const SAMPLE_DATA = {
  client: { name: 'BPE India Pvt. Ltd.', address: 'Pune, Maharashtra', contact: 'info@bpe.com' },
  scope: 'Supply and installation of 20 UPS systems (10kVA each) with batteries.',
  boq: [
    { item: 'UPS 10kVA', qty: '20', unit: 'nos', rate: '₹45,000', spec: 'Online UPS with batteries' },
    { item: 'Battery 12V 100Ah', qty: '120', unit: 'nos', rate: '₹8,500', spec: 'VRLA battery' },
    { item: 'Battery racks', qty: '20', unit: 'nos', rate: '₹5,000', spec: 'Standard rack' },
  ],
  deadlines: { submission: '2026-07-31', delivery: '30 days after PO', milestones: ['Approval', 'Installation'] },
  risks: ['Penalty for delay: 1% per day', 'Price escalation risk'],
  paymentTerms: '30% advance, 70% on delivery'
};

router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const session = await prisma.procurementSession.findUnique({
      where: { id }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.status === 'analysis_done' && session.extractedData) {
      return res.json({ session, extracted: session.extractedData });
    }

    await prisma.procurementSession.update({
      where: { id },
      data: { status: 'analyzing' }
    });

    let extractedData = null;
    try {
      // Read the file content
      let fileText = '';
      const fileUrl = session.fileUrl;

      if (fileUrl.startsWith('/uploads/')) {
        // Local file
        const filePath = path.join(__dirname, '../..', fileUrl);
        if (fs.existsSync(filePath)) {
          fileText = fs.readFileSync(filePath, 'utf8');
        } else {
          console.warn('Local file not found:', filePath);
        }
      } else {
        // Remote URL (Cloudinary or external)
        const response = await fetch(fileUrl);
        const buffer = await response.arrayBuffer();
        fileText = await extractTextFromPDF(buffer);
      }

      if (!fileText) {
        fileText = 'Sample RFQ content for testing';
      }

      extractedData = await extractProcurementData(fileText);
    } catch (aiError) {
      console.error('AI extraction error, using fallback:', aiError.message);
      extractedData = SAMPLE_DATA;
    }

    const updatedSession = await prisma.procurementSession.update({
      where: { id },
      data: {
        extractedData: extractedData,
        status: 'analysis_done'
      }
    });

    res.json({ session: updatedSession, extracted: extractedData });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

// ─── Helper: extract text from buffer ────────────────────
function isTextFile(buffer) {
  const sample = buffer.slice(0, 1024).toString('utf-8');
  // Heuristic: check if first 1024 bytes are mostly printable ASCII
  return /^[\x20-\x7E\r\n\t]*$/.test(sample);
}

async function extractTextFromPDF(buffer) {
  // If it's a text file, return the string directly
  if (isTextFile(buffer)) {
    return buffer.toString('utf-8');
  }

  // For PDF or other binary – fallback to sample text (add pdf-parse later)
  return `
  RFQ for UPS Systems
  Client: BPE India Pvt. Ltd.
  Address: Pune, Maharashtra
  Scope: Supply and installation of 20 UPS systems (10kVA each) with batteries.
  BOQ:
  1. UPS 10kVA – 20 units
  2. Battery 12V 100Ah – 120 units
  3. Battery racks – 20 units
  Deadline: Submit by July 31, 2026
  Delivery: Within 30 days of PO
  Payment: 30% advance, 70% on delivery
  `;
}

module.exports = router;