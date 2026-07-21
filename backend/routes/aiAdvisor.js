// backend/routes/aiAdvisor.js
const router = require('express').Router();
const prisma = require('../lib/prisma');
const { chatWithDocument } = require('../lib/groq');

console.log('✅ AI Advisor route loaded, prisma:', !!prisma);

// ─── Helper: extract product name from query ──────────────────
function extractProductName(query) {
  const lower = query.toLowerCase();
  const codePattern = /\b([A-Z]{2,4}\s*[\d\w]+)\b/i;
  const codeMatch = query.match(codePattern);
  if (codeMatch) return codeMatch[1].trim();

  const phrases = [
    /(?:details|tell me|info|specs|about|for)\s+(?:of|on|about|for)?\s*([a-zA-Z0-9\s\-]+)/i,
  ];
  for (const pattern of phrases) {
    const match = query.match(pattern);
    if (match && match[1]) {
      const maybeProduct = match[1].trim();
      const genericWords = ['office', 'computer', 'solar', 'battery', 'ups', 'inverter', 'price', 'cost', 'warranty'];
      if (!genericWords.some(w => maybeProduct.toLowerCase().includes(w))) {
        return maybeProduct;
      }
    }
  }
  return null;
}

// ─── Helper: extract product name from assistant's last message ──
function extractProductFromMessage(text) {
  const match = text.match(/[A-Z]{2,4}\s*[\d\w]+(\s*\([^)]*\))?/);
  return match ? match[0] : null;
}

// ─── Helper: check if query is a follow‑up ────────────────────
function isFollowUp(query) {
  const lower = query.toLowerCase().trim();
  return ['yes', 'no', 'ok', 'sure', 'more details', 'tell me more', 'elaborate', 'details', 'info', 'specs'].some(w => lower.includes(w));
}

// ─── Helper: get document context from session ────────────────
async function getDocumentContext(sessionId) {
  if (!sessionId) return null;
  try {
    const session = await prisma.procurementSession.findUnique({
      where: { id: sessionId }
    });
    if (!session) return null;

    const data = session.extractedData || {};
    let context = '';

    if (data.rawText) {
      context = `Document Content:\n${data.rawText}`;
    } else {
      context = `
Client Details: ${JSON.stringify(data.client || {})}
Scope of Work: ${data.scope || 'N/A'}
BOQ Items: ${JSON.stringify(data.boq || [])}
Deadlines: ${JSON.stringify(data.deadlines || {})}
Risks: ${JSON.stringify(data.risks || [])}
Payment Terms: ${data.paymentTerms || 'N/A'}
`;
    }
    return context;
  } catch (e) {
    console.error('Error fetching document context:', e);
    return null;
  }
}

// ─── Main route ────────────────────────────────────────────────
router.post('/advisor', async (req, res) => {
  const { query, visitorId, sessionId, history, productId } = req.body;

  try {
    let productDetails = null;
    let productContext = '';
    let documentContext = null;

    // ── PRIORITY 1: If sessionId provided, use procurement document context ──
    if (sessionId) {
      documentContext = await getDocumentContext(sessionId);
      if (documentContext) {
        // Use chatWithDocument with the document context
        try {
          const reply = await chatWithDocument(documentContext, query, history || []);
          return res.json({ reply });
        } catch (error) {
          console.error('Document chat error:', error);
          // Fall through to product context if document chat fails
        }
      }
    }

    // ── PRIORITY 2: Product context (existing logic) ──────────

    // 1. Try to extract product name from the user's query
    let productName = extractProductName(query);

    // 2. If query is a follow‑up, look in the last assistant message
    if (!productName && isFollowUp(query) && history && history.length > 0) {
      for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].role === 'assistant') {
          const extracted = extractProductFromMessage(history[i].content);
          if (extracted) {
            productName = extracted;
            break;
          }
        }
      }
    }

    // 3. If product name found, fetch product from database
    if (productName) {
      try {
        const product = await prisma.product.findFirst({
          where: {
            OR: [
              { name: { contains: productName, mode: 'insensitive' } },
              { id: productName },
            ],
          },
          select: { name: true, description: true, specs: true },
        });
        if (product) {
          productDetails = product;
          productContext = `Product: ${product.name}. Description: ${product.description || 'N/A'}. Specifications: ${JSON.stringify(product.specs || {})}. `;
        }
      } catch (e) {
        // ignore
      }
    }

    // 4. If no product from query, use current productId (user on product page)
    if (!productDetails && productId) {
      try {
        const product = await prisma.product.findUnique({
          where: { id: productId },
          select: { name: true, description: true, specs: true },
        });
        if (product) {
          productDetails = product;
          productContext = `Current product being viewed: ${product.name}. Description: ${product.description || 'N/A'}. Specifications: ${JSON.stringify(product.specs || {})}. `;
        }
      } catch (e) {
        // ignore
      }
    }

    // ─── Generate reply ──────────────────────────────────────
    const lower = query.toLowerCase().trim();
    let reply = '';

    // Follow‑up queries (details, yes, etc.)
    if (isFollowUp(query) && productDetails) {
      reply = `Here are the details for ${productDetails.name}:\n` +
        `Description: ${productDetails.description || 'N/A'}\n` +
        `Specifications:\n${Object.entries(productDetails.specs || {}).map(([k,v]) => `  ${k}: ${v}`).join('\n')}\n` +
        `Would you like to compare it with another product?`;
    }
    // Product‑specific query (e.g., "bp650v specs")
    else if (productDetails && !isFollowUp(query)) {
      reply = `Here are the details for ${productDetails.name}:\n` +
        `Description: ${productDetails.description || 'N/A'}\n` +
        `Specifications:\n${Object.entries(productDetails.specs || {}).map(([k,v]) => `  ${k}: ${v}`).join('\n')}\n` +
        `Would you like more information?`;
    }
    // Office / computer queries
    else if (lower.includes('computer') || lower.includes('office') || lower.includes('pc') || lower.includes('desktop')) {
      reply = 'For office computers, I recommend our single‑phase UPS like BP1000 (1kVA) or MFP series. They provide reliable backup for 3‑5 computers each. For larger setups (e.g., 20 computers), you might need a 10‑15kVA UPS like the EPX+ 10kVA or a modular system like PS15 12kVA. Would you like more details?';
    }
    // Industrial
    else if (lower.includes('industrial') || lower.includes('factory') || lower.includes('plant') || lower.includes('heavy')) {
      reply = 'For industrial applications, our HPX series or GTP‑InfiniteX series are ideal. They offer robust performance with high efficiency and are designed for harsh environments. What load capacity do you need?';
    }
    // Solar / BESS
    else if (lower.includes('solar') || lower.includes('renewable') || lower.includes('pv') || lower.includes('bess')) {
      reply = 'Our NRGX and ESS series are perfect for solar and renewable energy storage. They come with Li‑ion batteries and support peak shaving and load shifting. Do you need a specific capacity or installation type?';
    }
    // Data center
    else if (lower.includes('data center') || lower.includes('server') || lower.includes('rack')) {
      reply = 'For data centers, we recommend our GTP‑InfiniteX or HPX series with high power density and N+1 redundancy. Also check our Smart Rack Solutions for integrated cooling and power. Would you like to see some options?';
    }
    // Price
    else if (lower.includes('price') || lower.includes('cost') || lower.includes('quote')) {
      reply = 'Pricing depends on configuration, capacity, and optional features. Please submit a quote request via our contact form and our sales team will provide a detailed quotation. Would you like a link?';
    }
    // Warranty
    else if (lower.includes('warranty') || lower.includes('guarantee') || lower.includes('support')) {
      reply = 'Our products come with a standard 1‑year warranty, with extended warranty options available. For solar panels, we offer 25‑year performance warranty. Do you want to know more?';
    }
    // Hello
    else if (lower.match(/^(hi|hello|hey|greetings)/i)) {
      reply = 'Hello! How can I assist you with our product range today? Feel free to ask about UPS, solar, industrial power, or data center solutions.';
    }
    // Help / guide
    else if (lower.includes('help') || lower.includes('how to') || lower.includes('guide')) {
      reply = 'I can help you find the right product, compare specifications, or provide technical details. Just describe what you need (e.g., "UPS for 20 computers" or "solar battery for home").';
    }
    // Fallback – if product context exists but not matched above
    else if (productContext) {
      reply = `I see you're interested in ${productDetails ? productDetails.name : 'some products'}. Could you tell me more about your requirements? For example, load capacity, runtime, or application type.`;
    }
    // Generic fallback
    else {
      reply = "I'm here to help you find the right product. Could you describe your power requirements or application? For example, 'UPS for office computers' or 'solar battery storage for home'.";
    }

    if (!reply) reply = "I'm sorry, I didn't understand that. Could you please rephrase?";
    res.json({ reply });
  } catch (error) {
    console.error('❌ AI Advisor error:', error);
    res.status(200).json({ reply: "I'm having a small glitch. Could you please rephrase your question? I'll do my best to help." });
  }
});

module.exports = router;