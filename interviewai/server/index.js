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
    if (RAPIDAPI_HOST) { 
      headers['X-RapidAPI-Key'] = JUDGE0_KEY; 
      headers['X-RapidAPI-Host'] = RAPIDAPI_HOST; 
    }
    else { 
      headers['X-Auth-Token'] = JUDGE0_KEY; 
    }
  }
  return headers;
}

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', message: 'Server is running' }));

// Judge0: submit code
app.post('/api/submissions', async (req, res) => {
  try {
    const { source_code, language_id, stdin } = req.body;
    
    console.log('📝 Submission request received:', { language_id, code_length: source_code?.length });
    
    if (!source_code || !language_id) {
      console.error('❌ Missing required fields');
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (!JUDGE0_URL) {
      console.error('❌ Judge0 URL not configured');
      return res.status(500).json({ error: 'Judge0 URL not configured' });
    }

    const sourceBase64 = Buffer.from(source_code).toString('base64');
    const stdinBase64 = stdin ? Buffer.from(stdin).toString('base64') : '';

    const url = `${JUDGE0_URL}/submissions?base64_encoded=true&wait=false`;
    const headers = buildHeaders();
    
    console.log('🔄 Submitting to Judge0:', url);
    console.log('🔑 Headers:', Object.keys(headers));

    const submitRes = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ 
        source_code: sourceBase64, 
        language_id, 
        stdin: stdinBase64 
      }),
    });

    console.log('📡 Judge0 response status:', submitRes.status);
    
    if (!submitRes.ok) {
      const errorText = await submitRes.text();
      console.error('❌ Judge0 error:', errorText);
      throw new Error(`Judge0 responded with ${submitRes.status}: ${errorText}`);
    }
    
    const data = await submitRes.json();
    const { token } = data;
    
    if (!token) {
      console.error('❌ No token in response:', data);
      throw new Error('No token returned from Judge0');
    }
    
    console.log('✅ Submission successful, token:', token);
    res.json({ token });
  } catch (err) { 
    console.error('❌ Submission error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to submit code' }); 
  }
});

// Judge0: get result
app.get('/api/submissions/:token', async (req, res) => {
  try {
    const { token } = req.params;
    if (!JUDGE0_URL) return res.status(500).json({ error: 'Judge0 URL not configured' });

    const resultRes = await fetch(`${JUDGE0_URL}/submissions/${token}?base64_encoded=true`, { headers: buildHeaders() });
    
    if (!resultRes.ok) {
      const errorText = await resultRes.text();
      console.error('❌ Failed to fetch result:', errorText);
      throw new Error(`Failed to fetch result: ${resultRes.status}`);
    }
    
    const result = await resultRes.json();
    ['stdout','stderr','compile_output','message'].forEach(k => { 
      if (result[k]) result[k] = Buffer.from(result[k], 'base64').toString('utf-8'); 
    });
    res.json(result);
  } catch (err) { 
    console.error('❌ Result fetch error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to fetch result' }); 
  }
});

// Judge0: get languages
app.get('/api/languages', async (req, res) => {
  try {
    if (!JUDGE0_URL) return res.status(500).json({ error: 'Judge0 URL not configured' });
    
    const langRes = await fetch(`${JUDGE0_URL}/languages/all`, { headers: buildHeaders() });
    
    if (!langRes.ok) {
      const errorText = await langRes.text();
      console.error('❌ Failed to fetch languages:', errorText);
      throw new Error('Failed to fetch languages');
    }
    
    res.json(await langRes.json());
  } catch (err) { 
    console.error('❌ Languages fetch error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to fetch languages' }); 
  }
});

// Chat with streaming support
app.post('/api/chat/stream', async (req, res) => {
  try {
    const { messages, code, output, language } = req.body;
    if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: 'Messages array required' });
    if (!process.env.GROQ_API_KEY) return res.status(500).json({ error: 'Groq API key not configured' });

    const systemPrompt = `You are an experienced technical interviewer. Current code:\n${code ? code : ''}\nOutput:\n${output ? output : ''}`;
    
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
  } catch (err) { 
    console.error('❌ Chat stream error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || 'Failed to get AI response' }); 
    }
  }
});

// Fallback non-streaming chat
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, code, output, language } = req.body;
    if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: 'Messages array required' });
    if (!process.env.GROQ_API_KEY) return res.status(500).json({ error: 'Groq API key not configured' });

    const systemPrompt = `You are an experienced technical interviewer. Current code:\n${code ? code : ''}\nOutput:\n${output ? output : ''}`;
    
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 1024,
    });
    res.json({ message: completion.choices[0]?.message?.content || 'No response' });
  } catch (err) { 
    console.error('❌ Chat error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to get AI response' }); 
  }
});

// Run test cases
app.post('/api/run-tests', async (req, res) => {
  try {
    const { source_code, language_id, testCases } = req.body;
    
    if (!source_code || !language_id || !testCases) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const results = [];
    
    for (const testCase of testCases) {
      const sourceBase64 = Buffer.from(source_code).toString('base64');
      const stdinBase64 = testCase.input ? Buffer.from(testCase.input).toString('base64') : '';

      const submitRes = await fetch(`${JUDGE0_URL}/submissions?base64_encoded=true&wait=true`, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({ 
          source_code: sourceBase64, 
          language_id, 
          stdin: stdinBase64 
        }),
      });

      if (!submitRes.ok) {
        results.push({ passed: false, error: 'Submission failed' });
        continue;
      }

      const result = await submitRes.json();
      const stdout = result.stdout ? Buffer.from(result.stdout, 'base64').toString('utf-8').trim() : '';
      const passed = stdout === testCase.expectedOutput.trim();
      
      results.push({
        passed,
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: stdout,
        stderr: result.stderr ? Buffer.from(result.stderr, 'base64').toString('utf-8') : null
      });
    }

    res.json({ results });
  } catch (err) {
    console.error('❌ Test run error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to run tests' });
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
    console.error('❌ Question generation error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to generate question' }); 
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`Judge0 URL: ${JUDGE0_URL || 'NOT CONFIGURED'}`);
  console.log(`Judge0 Key: ${JUDGE0_KEY ? '✓ Configured' : 'NOT CONFIGURED'}`);
  console.log(`RapidAPI Host: ${RAPIDAPI_HOST || 'Not using RapidAPI'}`);
  console.log(`LLM: ${process.env.GROQ_API_KEY ? 'Groq ✓' : 'NOT CONFIGURED'}`);
});