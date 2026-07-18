// backend/lib/gemini.js
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ✅ Use a model that is definitely available
const EXTRACTION_MODEL = 'gemini-2.0-flash';   // ← try this
const CHAT_MODEL = 'gemini-2.0-flash';

// Extraction prompt template
const EXTRACTION_PROMPT = `
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

// Extract structured data from text
async function extractProcurementData(text) {
  const model = genAI.getGenerativeModel({ model: EXTRACTION_MODEL });
  const prompt = `${EXTRACTION_PROMPT}\n\nDocument Content:\n${text}`;
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const content = response.text();

  // Try to parse JSON from the response
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to parse AI response as JSON', e);
  }

  return { error: 'AI response could not be parsed', raw: content };
}

// Chat with AI about the document (for AI Copilot)
async function chatWithDocument(text, query) {
  const model = genAI.getGenerativeModel({ model: CHAT_MODEL });
  const prompt = `
You are a procurement assistant. You have been given the following tender/RFQ document.

DOCUMENT CONTENT:
${text}

USER QUERY: ${query}

Answer the user's question based only on the document content. If the answer is not in the document, say so.
`;
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

module.exports = { extractProcurementData, chatWithDocument };