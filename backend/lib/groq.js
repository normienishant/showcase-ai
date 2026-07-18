// backend/lib/groq.js
const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function extractProcurementData(text) {
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
  try {
    return JSON.parse(content);
  } catch (e) {
    console.error('Failed to parse Groq response as JSON', e);
    return { error: 'AI response could not be parsed', raw: content };
  }
}

async function chatWithDocument(text, query) {
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: `You are a procurement assistant. Answer based only on this document:\n${text}` },
      { role: 'user', content: query }
    ]
  });
  return response.choices[0].message.content;
}

module.exports = { extractProcurementData, chatWithDocument };