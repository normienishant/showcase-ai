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

  const prompt = `
You are an expert Procurement AI Assistant. Analyze the following RFQ/Tender document and extract data into strict JSON format with these keys:
- client: { name, address, contact }
- scope (string)
- boq: [ { item, qty, unit, rate, spec } ]
- deadlines: { submission, delivery, milestones: [] }
- risks: [ string ]
- paymentTerms (string)

Return ONLY valid JSON. Do NOT include markdown codeblocks or extra text.

Document:
${documentText.substring(0, 15000)}
`;

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'You respond strictly in valid raw JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0,
      max_tokens: 4000,
    });

    const raw = response.choices[0]?.message?.content || '{}';
    // Remove markdown code fences
    const clean = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(clean);
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