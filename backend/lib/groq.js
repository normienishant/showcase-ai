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

  // ─── Clean text: remove excessive whitespace ─────────────
  const cleanedText = documentText.replace(/\s+/g, ' ').trim();

  const prompt = `
You are an expert Procurement AI Assistant. Analyze the following RFQ/Tender/Contract document and extract structured information. The document may contain tables, bullet points, sections, and various formats. Extract the following fields:

1. **Client Details**: Full name, address, contact (if mentioned).
2. **Scope of Work**: Brief description of the work, including key deliverables.
3. **Deadlines**: Submission deadline, delivery timeline, any milestones (list them).
4. **Risks & Penalties**: Any penalty clauses, liquidated damages, risks mentioned.
5. **Payment Terms**: Payment schedule, advance, milestone payments, retention.
6. **BOQ (Bill of Quantities)**: If present, extract items with: item name, quantity, unit, rate, and any specifications. If not explicitly present, infer from the document (e.g., services, materials). If none, return an empty array.

Return the data in **strict JSON format** with the following keys:
{
  "client": { "name": "", "address": "", "contact": "" },
  "scope": "",
  "deadlines": { "submission": "", "delivery": "", "milestones": [] },
  "risks": [""],
  "paymentTerms": "",
  "boq": [ { "item": "", "qty": "", "unit": "", "rate": "", "spec": "" } ]
}

**Important Instructions:**
- If a field is not explicitly mentioned, use "Not specified" or empty array.
- For BOQ, look for tables, lists, or sections with quantities. Extract as many items as possible.
- For payment terms, if there is a table with milestones and percentages, extract them into a clear string.
- Respond **only** with valid JSON. Do not include markdown codeblocks or extra text.

Document Content:
${cleanedText.substring(0, 15000)}
`;

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'You are an expert in procurement document analysis. Respond only with valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0,
      max_tokens: 4000,
    });

    const raw = response.choices[0]?.message?.content || '{}';
    // Remove markdown code fences
    const clean = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(clean);

    // ─── Ensure all keys exist ──────────────────────────────
    const defaultKeys = {
      client: { name: 'Not specified', address: 'Not specified', contact: 'Not specified' },
      scope: 'Not specified',
      deadlines: { submission: 'Not specified', delivery: 'Not specified', milestones: [] },
      risks: [],
      paymentTerms: 'Not specified',
      boq: []
    };

    for (const key of Object.keys(defaultKeys)) {
      if (!(key in parsed) || (typeof parsed[key] !== 'object' && typeof parsed[key] !== 'string')) {
        parsed[key] = defaultKeys[key];
      }
      // If boq is not an array, make it an array
      if (key === 'boq' && !Array.isArray(parsed[key])) {
        parsed[key] = [];
      }
      // Ensure client has all sub-keys
      if (key === 'client') {
        const clientDefaults = defaultKeys.client;
        for (const subKey of Object.keys(clientDefaults)) {
          if (!(subKey in parsed.client)) {
            parsed.client[subKey] = 'Not specified';
          }
        }
      }
      // Ensure deadlines has all sub-keys
      if (key === 'deadlines') {
        const ddlDefaults = defaultKeys.deadlines;
        for (const subKey of Object.keys(ddlDefaults)) {
          if (!(subKey in parsed.deadlines)) {
            parsed.deadlines[subKey] = ddlDefaults[subKey];
          }
        }
      }
    }

    return parsed;
  } catch (error) {
    console.error('Groq API error:', error.message);
    throw new Error(`AI extraction failed: ${error.message}`);
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