// backend/lib/groq.js
const Groq = require('groq-sdk');

let groq = null;
try {
  const apiKey = process.env.GROQ_API_KEY;
  if (apiKey && apiKey.trim() !== '') {
    groq = new Groq({ apiKey });
  }
} catch (e) {
  console.warn('Groq init failed:', e.message);
}

// ─── Section-anchored extraction ──────────────────────────────
// Instead of blindly truncating, find key sections anywhere in the doc
// and prioritize them, so late-appearing sections (Payment Terms, BOQ, etc.)
// don't get cut off.
function extractKeySections(text, maxChars = 60000) {
  const keywordPatterns = [
    /payment\s*terms?/i,
    /payment\s*schedule/i,
    /bill\s*of\s*quantit/i,
    /\bBOQ\b/i,
    /scope\s*of\s*work/i,
    /submission\s*deadline|bid\s*due\s*date|last\s*date\s*of\s*(bid\s*)?submission/i,
    /penalty|liquidated\s*damages|\bLD\b|blacklist/i,
    /milestone/i,
    /delivery\s*(schedule|timeline|period)/i,
  ];

  const excerpts = [];
  const seenRanges = [];
  const CONTEXT_WINDOW = 2500; // chars before/after each match

  for (const pattern of keywordPatterns) {
    const regex = new RegExp(pattern, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      const start = Math.max(0, match.index - 500);
      const end = Math.min(text.length, match.index + CONTEXT_WINDOW);

      // avoid duplicate/overlapping excerpts
      const overlaps = seenRanges.some(r => start < r.end && end > r.start);
      if (!overlaps) {
        excerpts.push(text.substring(start, end));
        seenRanges.push({ start, end });
      }
    }
  }

  // Always include the beginning (client details, scope intro usually here)
  const intro = text.substring(0, 4000);

  const combined = [intro, ...excerpts].join('\n\n---\n\n');

  return combined.length > maxChars
    ? combined.substring(0, maxChars)
    : combined;
}

async function analyzeDocumentWithGroq(documentText) {
  if (!groq) {
    throw new Error('GROQ_API_KEY not set. Please check .env');
  }

  const cleanedText = documentText.replace(/\s+/g, ' ').trim();

  // If doc is small, just send it whole. If large, use targeted sections.
  const inputText = cleanedText.length <= 60000
    ? cleanedText
    : extractKeySections(cleanedText, 60000);

  console.log(`📄 Sending to AI: ${inputText.length} chars (${(inputText.length/4).toFixed(0)} tokens approx)`);

  const prompt = `
You are an AI specializing in extracting structured data from **any type of procurement/tender document** – including RFQs, RFP, contracts, etc. The document may contain tables, bullet points, numbered lists, plain paragraphs, or mixed formats.
The text below may be the full document, OR a set of relevant excerpts (separated by "---") pulled from a larger document — sections may not be in original order.

Extract the following fields accurately, even if the data is scattered:

1. **Client Details**: Full name of the issuing authority, complete address, contact person (if any).
2. **Scope of Work**: A concise summary of what is to be delivered, including any key deliverables and quantities if mentioned.
3. **Deadlines**: 
   - Submission deadline (exact date if given, else "Not specified").
   - Delivery timeline (number of days or date).
   - Any important milestones (list them).
4. **Risks & Penalties**:
   - Look for keywords: "penalty", "liquidated damages", "LD", "risk", "blacklisting", "insolvency".
   - Extract all distinct risks/penalty clauses.
5. **Payment Terms**:
   - Look for any section named "Payment Terms", "Payment Schedule", "Milestones", "Financial Terms".
   - Extract the payment breakdown in a clear, readable string (e.g., "10% advance, 40% on delivery, 30% on installation, 15% on commissioning, 5% retention").
   - If a table is present, convert it to a text string with percentages and events.
6. **BOQ (Bill of Quantities)**:
   - If a table with item, quantity, unit, rate exists, extract all rows.
   - If no explicit table, infer the main deliverables from the scope. Create at least one item per major deliverable (e.g., "Smart Classroom Setup", "Annual Maintenance", "Hardware Supply").
   - Always include at least one item if the document describes any work.

Return a JSON object with the following keys:
{
  "client": { "name": "", "address": "", "contact": "" },
  "scope": "",
  "deadlines": { "submission": "", "delivery": "", "milestones": [] },
  "risks": [],
  "paymentTerms": "",
  "boq": [ { "item": "", "qty": "", "unit": "", "rate": "", "spec": "" } ]
}

**Important Rules:**
- Never use "Not specified" for all fields – try to infer from context.
- For payment terms, if there are multiple milestones, concatenate them with commas.
- For BOQ, if the document is for services, use "1 Lot" as quantity.
- Respond ONLY with valid JSON. No markdown, no extra text.

Document Content:
${inputText}
`;

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'You extract structured data from procurement documents in any format. Respond only with valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 4000,
    });

    const raw = response.choices[0]?.message?.content || '{}';
    const clean = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(clean);

    // ─── Post-processing (ensure all fields exist) ──────────
    const clientDefaults = { name: 'Not specified', address: 'Not specified', contact: 'Not specified' };
    for (const key of Object.keys(clientDefaults)) {
      if (!parsed.client || !(key in parsed.client)) {
        if (!parsed.client) parsed.client = {};
        parsed.client[key] = clientDefaults[key];
      }
    }
    const ddlDefaults = { submission: 'Not specified', delivery: 'Not specified', milestones: [] };
    for (const key of Object.keys(ddlDefaults)) {
      if (!parsed.deadlines || !(key in parsed.deadlines)) {
        if (!parsed.deadlines) parsed.deadlines = {};
        parsed.deadlines[key] = ddlDefaults[key];
      }
    }
    if (!Array.isArray(parsed.risks)) parsed.risks = [];
    if (!Array.isArray(parsed.boq) || parsed.boq.length === 0) {
      parsed.boq = [ { item: 'Procurement work', qty: '1', unit: 'Lot', rate: 'Not specified', spec: '' } ];
    }
    if (!parsed.paymentTerms || parsed.paymentTerms === 'Not specified') {
      parsed.paymentTerms = 'Refer to document for payment details.';
    }
    if (!parsed.scope || parsed.scope === 'Not specified') {
      parsed.scope = 'Procurement as per tender document.';
    }

    return parsed;
  } catch (error) {
    console.error('Groq API error:', error.message);
    return {
      client: { name: 'Extraction Failed', address: 'Not specified', contact: 'Not specified' },
      scope: 'AI extraction failed. Please review manually.',
      deadlines: { submission: 'Not specified', delivery: 'Not specified', milestones: [] },
      risks: ['AI extraction failed – verify manually.'],
      paymentTerms: 'Refer to document.',
      boq: [ { item: 'Smart Classroom Setup', qty: '1', unit: 'Lot', rate: 'Not specified', spec: '' } ]
    };
  }
}

async function chatWithDocument(context, query, history = []) {
  if (!groq) {
    throw new Error('GROQ_API_KEY not set.');
  }
  try {
    const messages = [
      { role: 'system', content: context },
      ...history,
      { role: 'user', content: query }
    ];
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.3,
      max_tokens: 500,
    });
    return response.choices[0].message.content;
  } catch (error) {
    console.error('Chat API error:', error.message);
    throw new Error(`AI chat failed: ${error.message}`);
  }
}

module.exports = { analyzeDocumentWithGroq, chatWithDocument };