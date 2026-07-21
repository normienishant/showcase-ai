// backend/lib/groq.js
const Groq = require('groq-sdk');

// ─── Lazy initialization ──────────────────────────────────
let groq = null;
try {
  const apiKey = process.env.GROQ_API_KEY;
  if (apiKey && apiKey.trim() !== '') {
    groq = new Groq({ apiKey });
  }
} catch (e) {
  console.warn('Groq initialization failed:', e.message);
}

// ─── Fallback sample data ──────────────────────────────────
const FALLBACK_DATA = {
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

async function extractProcurementData(text) {
  if (!groq) {
    console.warn('GROQ_API_KEY not set – using fallback data.');
    return FALLBACK_DATA;
  }

  const prompt = `
You are a procurement expert. Extract the following information from the RFQ/Tender document:

1. **Client Details**: Client name, address, contact person (if available)
2. **Project/Scope**: Brief description of what is being procured
3. **BOQ (Bill of Quantities)**: List of items with:
   - Item name/description
   - Quantity
   - Unit (nos, kg, meters, etc.)
   - Estimated cost/rate (if available)
   - Any specifications or notes
4. **Deadlines**: Submission deadline, delivery timeline, milestones
5. **Risks & Penalties**: Any identified risks, penalty clauses, liquidated damages
6. **Payment Terms**: Payment schedule, advance, milestones

Return the data in this exact JSON format:
{
  "client": { "name": "", "address": "", "contact": "" },
  "scope": "",
  "boq": [ { "item": "", "qty": "", "unit": "", "rate": "", "spec": "" } ],
  "deadlines": { "submission": "", "delivery": "", "milestones": [] },
  "risks": [""],
  "paymentTerms": ""
}
`;

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: `Document Content:\n${text}` }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    return JSON.parse(content);
  } catch (error) {
    console.error('Groq API error, using fallback:', error.message);
    return FALLBACK_DATA;
  }
}

async function chatWithDocument(context, query, history = []) {
  if (!groq) {
    console.warn('GROQ_API_KEY not set – falling back to static response.');
    return "I'm sorry, the AI assistant is not fully configured. Please contact support.";
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
    return "I'm sorry, I couldn't process your query right now. Please try again later.";
  }
}

module.exports = { extractProcurementData, chatWithDocument };