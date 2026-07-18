// backend/server.js
require('dotenv').config();
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const path = require('path');  // ← ADDED

const app = express();

// ✅ CORS – allow all origins (for development)
app.use(cors());
app.use(express.json());

// Optional: cache headers for static assets
app.use((req, res, next) => {
  res.header('Cache-Control', 'public, max-age=300');
  next();
});

// ─── Existing routes ──────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/company', require('./routes/company'));
app.use('/api/companies', require('./routes/categories'));
app.use('/api/admin/categories', require('./routes/adminCategories'));
app.use('/api/companies', require('./routes/products'));
app.use('/api/products', require('./routes/productById'));
app.use('/api/admin/products', require('./routes/adminProducts'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/companies', require('./routes/leads'));
app.use('/api/admin', require('./routes/adminLeads'));

// ─── PROCUREMENT ROUTES ──────────────────────────────────
app.use('/api/procurement/sessions', require('./routes/procurement/sessions'));
app.use('/api/procurement/upload', require('./routes/procurement/upload'));
app.use('/api/procurement/analysis', require('./routes/procurement/analysis'));
app.use('/api/procurement/boq', require('./routes/procurement/boq'));
app.use('/api/procurement/po', require('./routes/procurement/po'));

// ─── STATIC FILES FOR LOCAL UPLOADS ──────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── TRACKING & AI ROUTES ──────────────────────────────────
app.use('/api/track', require('./routes/tracking'));
app.use('/api/ai', require('./routes/aiAdvisor'));

// ─── Health check ────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ ok: true }));

// ─── Error handler ───────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));