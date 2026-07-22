// backend/routes/procurement/boq.js
const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ─── GET BOQ ──────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const session = await prisma.procurementSession.findUnique({
      where: { id }
    });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Try multiple possible locations for BOQ data
    let boqData = session.boqData || 
                  session.extractedData?.analysis?.boq || 
                  session.extractedData?.boq || 
                  [];

    // Ensure it's an array
    if (!Array.isArray(boqData)) boqData = [];

    res.json({ boqData });
  } catch (error) {
    console.error('BOQ fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch BOQ' });
  }
});

// ─── PUT (Save) BOQ ──────────────────────────────────────
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { boqData } = req.body;

  try {
    const session = await prisma.procurementSession.update({
      where: { id },
      data: {
        boqData: boqData,  // save to session.boqData
        status: 'boq_done'
      }
    });
    res.json({ session, message: 'BOQ updated successfully' });
  } catch (error) {
    console.error('BOQ update error:', error);
    res.status(500).json({ error: 'Failed to update BOQ' });
  }
});

module.exports = router;