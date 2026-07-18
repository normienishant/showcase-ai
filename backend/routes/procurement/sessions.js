const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  const sessions = await prisma.procurementSession.findMany({
    orderBy: { createdAt: 'desc' }
  });
  res.json(sessions);
});

router.get('/:id', async (req, res) => {
  const session = await prisma.procurementSession.findUnique({
    where: { id: req.params.id }
  });
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
});

router.post('/', async (req, res) => {
  const { fileName, fileUrl, userId } = req.body;
  const session = await prisma.procurementSession.create({
    data: {
      fileName,
      fileUrl,
      userId: userId || 'anonymous',
    }
  });
  res.json(session);
});

router.put('/:id/status', async (req, res) => {
  const { status } = req.body;
  const session = await prisma.procurementSession.update({
    where: { id: req.params.id },
    data: { status }
  });
  res.json(session);
});

module.exports = router;