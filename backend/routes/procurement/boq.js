// backend/routes/procurement/boq.js
const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// PUT /api/procurement/boq/:id
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { boqData } = req.body;

  try {
    const session = await prisma.procurementSession.update({
      where: { id },
      data: {
        boqData,
        status: 'boq_done'
      }
    });
    res.json({ session, message: 'BOQ updated successfully' });
  } catch (error) {
    console.error('BOQ update error:', error);
    res.status(500).json({ error: 'Failed to update BOQ' });
  }
});

// GET /api/procurement/boq/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const session = await prisma.procurementSession.findUnique({
      where: { id }
    });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json({ boqData: session.boqData || session.extractedData?.boq || [] });
  } catch (error) {
    console.error('BOQ fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch BOQ' });
  }
});

module.exports = router;