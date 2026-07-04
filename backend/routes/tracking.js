// backend/routes/tracking.js
const router = require('express').Router();
const prisma = require('../lib/prisma');

console.log('✅ Tracking route loaded, prisma:', !!prisma); // Debug log

// POST /api/track/event
router.post('/event', async (req, res) => {
  const { visitorId, sessionId, eventType, productId, categoryId, data, timestamp } = req.body;

  if (!visitorId || !sessionId || !eventType) {
    return res.status(400).json({ error: 'Missing required fields: visitorId, sessionId, eventType' });
  }

  try {
    // 1. Upsert session
    await prisma.visitorSession.upsert({
      where: { sessionId },
      update: { lastActivity: new Date() },
      create: {
        visitorId,
        sessionId,
        startedAt: new Date(),
        lastActivity: new Date(),
        ipAddress: req.ip || req.headers['x-forwarded-for'] || '',
        userAgent: req.headers['user-agent'] || '',
        referrer: req.headers.referer || '',
      },
    });

    // 2. Create event
    await prisma.visitorEvent.create({
      data: {
        visitorId,
        sessionId,
        eventType,
        productId: productId || null,
        categoryId: categoryId || null,
        eventData: data || {},
        createdAt: timestamp ? new Date(timestamp) : undefined,
      },
    });

    // 3. Update intent score – only for key actions, and only once per (visitor, eventType, productId)
    const weights = {
      product_view: 5,
      wishlist_add: 10,
      wishlist_remove: -5,
      pdf_download: 15,
      ai_chat: 8,
      lead_submit: 20,
    };
    const scoreChange = weights[eventType] || 0;
    if (scoreChange !== 0) {
      // Check if this exact event type + productId has already been scored for this visitor
      let shouldScore = true;
      if (productId) {
        // For events with a productId, check if the visitor already has an event of the same type and productId
        const existing = await prisma.visitorEvent.findFirst({
          where: {
            visitorId,
            eventType,
            productId,
          },
        });
        if (existing) {
          shouldScore = false; // Already scored this product for this event type
        }
      } else {
        // For events without productId (e.g., ai_chat), check if the event type already happened in this session
        // We'll use sessionId to avoid scoring the same event type multiple times in one session
        const existing = await prisma.visitorEvent.findFirst({
          where: {
            sessionId,
            eventType,
          },
        });
        if (existing) {
          shouldScore = false;
        }
      }

      if (shouldScore) {
        const current = await prisma.intentScore.findUnique({ where: { visitorId } });
        const newScore = Math.max(0, (current?.score || 0) + scoreChange);
        await prisma.intentScore.upsert({
          where: { visitorId },
          update: {
            score: newScore,
            lastUpdated: new Date(),
            categoryId: categoryId || undefined,
            productId: productId || undefined,
          },
          create: {
            visitorId,
            score: Math.max(0, scoreChange),
            categoryId: categoryId || undefined,
            productId: productId || undefined,
          },
        });
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Tracking error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// GET /api/track/visitor/:visitorId
router.get('/visitor/:visitorId', async (req, res) => {
  const { visitorId } = req.params;
  try {
    const events = await prisma.visitorEvent.findMany({
      where: { visitorId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    const score = await prisma.intentScore.findUnique({
      where: { visitorId },
    });
    const lead = await prisma.lead.findFirst({
      where: { visitorId },
    });
    res.json({ events, score, lead });
  } catch (error) {
    console.error('❌ Visitor detail error:', error);
    res.status(500).json({ error: 'Failed to fetch visitor data' });
  }
});

// GET /api/track/session/:sessionId
router.get('/session/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  try {
    const session = await prisma.visitorSession.findUnique({
      where: { sessionId },
    });
    const events = await prisma.visitorEvent.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ session, events });
  } catch (error) {
    console.error('❌ Session error:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// GET /api/track/sessions – list recent sessions
router.get('/sessions', async (req, res) => {
  try {
    const sessions = await prisma.visitorSession.findMany({
      orderBy: { lastActivity: 'desc' },
      take: 20,
      include: {
        events: true,
      },
    });
    const visitorIds = sessions.map(s => s.visitorId);
    const scores = await prisma.intentScore.findMany({
      where: { visitorId: { in: visitorIds } },
    });
    const scoreMap = scores.reduce((acc, s) => { acc[s.visitorId] = s.score; return acc; }, {});
    const result = sessions.map(s => ({
      ...s,
      intentScore: scoreMap[s.visitorId] || 0,
      eventCount: s.events.length,
    }));
    res.json({ sessions: result });
  } catch (error) {
    console.error('❌ Sessions list error:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

module.exports = router;