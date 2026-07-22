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

async function analyzeDocumentWithGroq(documentText) {
  if (!groq) {
    throw new Error('GROQ_API_KEY not set. Please check .env');
  }

  const cleanedText = documentText.replace(/\s+/g, ' ').trim();

  const prompt = `
You are an AI specializing in extracting structured data from **any type of procurement/tender document** – including RFQs, RFP, contracts, etc. The document may contain tables, bullet points, numbered lists, plain paragraphs, or mixed formats.

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
${cleanedText.substring(0, 15000)}
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

    // ─── Post-processing to ensure complete data ────────────
    // 1. Ensure client has all fields
    const clientDefaults = { name: 'Not specified', address: 'Not specified', contact: 'Not specified' };
    for (const key of Object.keys(clientDefaults)) {
      if (!parsed.client || !(key in parsed.client)) {
        if (!parsed.client) parsed.client = {};
        parsed.client[key] = clientDefaults[key];
      }
    }

    // 2. Ensure deadlines have all fields
    const ddlDefaults = { submission: 'Not specified', delivery: 'Not specified', milestones: [] };
    for (const key of Object.keys(ddlDefaults)) {
      if (!parsed.deadlines || !(key in parsed.deadlines)) {
        if (!parsed.deadlines) parsed.deadlines = {};
        parsed.deadlines[key] = ddlDefaults[key];
      }
    }

    // 3. Ensure boq is an array, not empty
    if (!Array.isArray(parsed.boq) || parsed.boq.length === 0) {
      // Try to infer from scope
      if (parsed.scope && parsed.scope !== 'Not specified') {
        parsed.boq = [{
          item: parsed.scope.substring(0, 60) + (parsed.scope.length > 60 ? '...' : ''),
          qty: '1',
          unit: 'Lot',
          rate: 'Not specified',
          spec: 'As per tender scope'
        }];
      } else {
        parsed.boq = [{
          item: 'Procurement work',
          qty: '1',
          unit: 'Lot',
          rate: 'Not specified',
          spec: 'As per document'
        }];
      }
    }

    // 4. Ensure paymentTerms is not empty
    if (!parsed.paymentTerms || parsed.paymentTerms === 'Not specified') {
      // If scope mentions payment, infer
      if (parsed.scope && parsed.scope.toLowerCase().includes('payment')) {
        parsed.paymentTerms = 'Refer to document for payment details.';
      }
    }

    // 5. Ensure scope is not empty
    if (!parsed.scope || parsed.scope === 'Not specified') {
      parsed.scope = 'Procurement of goods/services as per tender.';
    }

    // 6. Ensure risks is an array
    if (!Array.isArray(parsed.risks)) parsed.risks = [];

    return parsed;
  } catch (error) {
    console.error('Groq API error:', error.message);
    // Return a structured fallback
    return {
      client: { name: 'Extraction Failed', address: 'Not specified', contact: 'Not specified' },
      scope: 'AI extraction failed. Please review document manually.',
      deadlines: { submission: 'Not specified', delivery: 'Not specified', milestones: [] },
      risks: ['AI extraction failed – verify manually.'],
      paymentTerms: 'Not specified',
      boq: [{ item: 'Extraction Failed', qty: '1', unit: 'Lot', rate: 'Not specified', spec: 'Manual review needed' }]
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