import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const JUDGE0_URL = (process.env.JUDGE0_URL || '').replace(/\/+$/, '');
const JUDGE0_KEY = process.env.JUDGE0_KEY;
const RAPIDAPI_HOST = process.env.JUDGE0_RAPIDAPI_HOST;

function buildHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (JUDGE0_KEY) {
    if (RAPIDAPI_HOST) { headers['X-RapidAPI-Key'] = JUDGE0_KEY; headers['X-RapidAPI-Host'] = RAPIDAPI_HOST; }
    else { headers['X-Auth-Token'] = JUDGE0_KEY; }
  }
  return headers;
}

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', message: 'Server is running' }));

// Judge0: submit code
app.post('/api/submissions', async (req, res) => {
  try {
    const { source_code, language_id, stdin } = req.body;
    if (!source_code || !language_id) return res.status(400).json({ error: 'Missing required fields' });
    if (!JUDGE0_URL) return res.status(500).json({ error: 'Judge0 URL not configured' });

    const sourceBase64 = Buffer.from(source_code).toString('base64');
    const stdinBase64 = stdin ? Buffer.from(stdin).toString('base64') : '';

    const submitRes = await fetch(`${JUDGE0_URL}/submissions?base64_encoded=true&wait=false`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ source_code: sourceBase64, language_id, stdin: stdinBase64 }),
    });

    if (!submitRes.ok) throw new Error(await submitRes.text());
    const { token } = await submitRes.json();
    if (!token) throw new Error('No token returned from Judge0');
    res.json({ token });
  } catch (err) { res.status(500).json({ error: err.message || 'Failed to submit code' }); }
});

// Judge0: get result
app.get('/api/submissions/:token', async (req, res) => {
  try {
    const { token } = req.params;
    if (!JUDGE0_URL) return res.status(500).json({ error: 'Judge0 URL not configured' });

    const resultRes = await fetch(`${JUDGE0_URL}/submissions/${token}?base64_encoded=true`, { headers: buildHeaders() });
    if (!resultRes.ok) throw new Error(await resultRes.text());
    const result = await resultRes.json();
    ['stdout','stderr','compile_output','message'].forEach(k => { if (result[k]) result[k] = Buffer.from(result[k], 'base64').toString('utf-8'); });
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message || 'Failed to fetch result' }); }
});

// Judge0: get languages
app.get('/api/languages', async (req, res) => {
  try {
    if (!JUDGE0_URL) return res.status(500).json({ error: 'Judge0 URL not configured' });
    const langRes = await fetch(`${JUDGE0_URL}/languages`, { headers: buildHeaders() });
    if (!langRes.ok) throw new Error('Failed to fetch languages');
    res.json(await langRes.json());
  } catch (err) { res.status(500).json({ error: err.message || 'Failed to fetch languages' }); }
});

// Chat with streaming support
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, code, output, language, stream } = req.body;
    if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: 'Messages array required' });
    if (!process.env.GROQ_API_KEY) return res.status(500).json({ error: 'Groq API key not configured' });

    const systemPrompt = `You are an experienced technical interviewer. Current code:\n${code ? code : ''}\nOutput:\n${output ? output : ''}`;
    
    if (stream) {
      // Set up SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const completion = await groq.chat.completions.create({
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 1024,
        stream: true,
      });

      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }
      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      const completion = await groq.chat.completions.create({
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 1024,
      });
      res.json({ message: completion.choices[0]?.message?.content || 'No response' });
    }
  } catch (err) { 
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || 'Failed to get AI response' }); 
    }
  }
});

// Generate question with test cases
app.post('/api/generate-question', async (req, res) => {
  try {
    const { topic, difficulty } = req.body;
    if (!process.env.GROQ_API_KEY) return res.status(500).json({ error: 'Groq API key not configured' });

    const prompt = `
You are a technical interviewer creating a coding problem.
- Generate a problem description for topic: ${topic || 'general'} and difficulty: ${difficulty || 'medium'}.
- Include: problem statement, example input/output, and constraints.
- STRICTLY DO NOT provide the solution, hints, or explanation.
- Format as markdown with sections: **Question Title**, **Problem**, **Example**, **Constraints**.

After the problem, provide 3-5 test cases in the following JSON format:
\`\`\`json
{
  "testCases": [
    {"input": "example input", "expectedOutput": "expected output"},
    {"input": "edge case input", "expectedOutput": "edge case output"}
  ]
}
\`\`\`
    `.trim();

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a technical interviewer creating coding problems with test cases.' },
        { role: 'user', content: prompt }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.8,
      max_tokens: 1200,
    });

    const response = completion.choices[0]?.message?.content || 'Failed to generate question';
    
    // Try to extract test cases from the response
    let testCases = [];
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        testCases = parsed.testCases || [];
      } catch (e) {
        console.error('Failed to parse test cases:', e);
      }
    }

    res.json({ question: response, testCases });
  } catch (err) { 
    res.status(500).json({ error: err.message || 'Failed to generate question' }); 
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`Judge0 URL: ${JUDGE0_URL || 'NOT CONFIGURED'}`);
  console.log(`LLM: ${process.env.GROQ_API_KEY ? 'Groq ✓' : 'NOT CONFIGURED'}`);
});