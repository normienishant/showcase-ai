// backend/routes/procurement/po.js
const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.post('/:id', async (req, res) => {
  const { id } = req.params;
  const { vendor } = req.body;

  try {
    const session = await prisma.procurementSession.findUnique({
      where: { id }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Get BOQ data – prefer boqData, fallback to extractedData.boq
    let boq = session.boqData || session.extractedData?.boq || [];
    // Ensure it's an array
    if (!Array.isArray(boq)) boq = [];

    // Calculate total
    const totalAmount = boq.reduce((sum, item) => {
      const rate = parseFloat(String(item.rate).replace(/[₹,]/g, '')) || 0;
      const qty = parseFloat(String(item.qty)) || 0;
      return sum + (rate * qty);
    }, 0);

    // ✅ FIX: Convert Date.now() to string before slice
    const poNumber = `PO-${String(Date.now()).slice(-6)}`;

    const poData = {
      poNumber,
      vendor: vendor || 'Vendor',
      items: boq,
      totalAmount,
      date: new Date().toISOString(),
      status: 'draft'
    };

    // Update session status
    await prisma.procurementSession.update({
      where: { id },
      data: { status: 'po_created' }
    });

    res.json({ poData, message: 'PO created successfully' });
  } catch (error) {
    console.error('❌ PO creation error:', error);
    // Send back the error details for debugging
    res.status(500).json({ error: 'Failed to create PO', details: error.message });
  }
});

module.exports = router;