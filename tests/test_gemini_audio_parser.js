/**
 * NOVA GEMINI PARSER TEST UTILITY
 * Tests the Gemini 3.6 Flash structured JSON schema evaluation.
 */

const https = require('https');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY';
const MODEL = 'gemini-3.6-flash';

function testGeminiParser(sampleText) {
  console.log(`Testing text prompt: "${sampleText}"...`);

  const payload = JSON.stringify({
    system_instruction: {
      parts: [{
        text: `Act as executive assistant 'Nova'. Parse user audio or text input to evaluate user intent. Return ONLY a valid JSON object matching this schema:
{
  "status": "READY" | "NEEDS_CLARIFICATION",
  "clarification_prompt": "String prompt or null",
  "intent": "TASK" | "CALENDAR" | "NOTE" | "RESEARCH" | "AMBIGUOUS",
  "parameters": {
    "title": "String",
    "details": "String",
    "date_time": "ISO8601 String or null",
    "query": "String for research query"
  }
}
If intent is missing vital parameters, set status to NEEDS_CLARIFICATION.`
      }]
    },
    contents: [{
      parts: [{ text: sampleText }]
    }],
    generationConfig: {
      response_mime_type: "application/json",
      temperature: 0.1
    }
  });

  if (GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
    console.log(`ℹ️ GEMINI_API_KEY is not set. Mock payload preview:`);
    console.log(payload);
    return;
  }

  const req = https.request({
    hostname: 'generativelanguage.googleapis.com',
    path: `/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  }, (res) => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
      console.log('Response Status:', res.statusCode);
      console.log('Gemini Response:', body);
    });
  });

  req.on('error', e => console.error('Error:', e));
  req.write(payload);
  req.end();
}

testGeminiParser("Schedule a meeting with the engineering team tomorrow at 2 PM to review Q3 architecture.");
