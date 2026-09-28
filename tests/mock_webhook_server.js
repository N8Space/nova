/**
 * NOVA MOCK WEBHOOK SERVER
 * Simulates n8n's /nova-capture endpoint locally for testing iOS shortcut payloads,
 * session state handling, and clarification loop logic.
 */

const http = require('http');

const PORT = process.env.PORT || 3000;
const sessionStore = new Map();

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url.includes('/nova-capture')) {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const sessionId = payload.session_id || 'test-session';
        const textInput = payload.text_input || '';

        console.log(`\n==================================================`);
        console.log(`📥 Received Webhook Request`);
        console.log(`Session ID: ${sessionId}`);
        console.log(`Text Input: "${textInput}"`);
        console.log(`==================================================`);

        // Check if existing context exists for session
        const existingState = sessionStore.get(sessionId);
        
        let responsePayload;

        if (!textInput.toLowerCase().includes('tomorrow') && !textInput.toLowerCase().includes('at') && textInput.toLowerCase().includes('schedule')) {
          // Simulate clarification trigger
          sessionStore.set(sessionId, { pendingPrompt: "What date and time would you like to schedule this event?" });
          responsePayload = {
            status: "NEEDS_CLARIFICATION",
            session_id: sessionId,
            message: "What date and time would you like to schedule this event?"
          };
          console.log(`⚠️ Returning Clarification Request to Client`);
        } else {
          // Simulate successful execution
          if (existingState) {
            sessionStore.delete(sessionId);
          }
          responsePayload = {
            status: "COMPLETED",
            session_id: sessionId,
            intent: "CALENDAR",
            message: "Nova successfully processed your request and created the calendar entry."
          };
          console.log(`✅ Returning Completed Execution to Client`);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(responsePayload, null, 2));

      } catch (err) {
        console.error('❌ Error parsing payload:', err);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Endpoint not found. POST to /webhook/nova-capture' }));
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Nova Mock Webhook Server running on http://localhost:${PORT}`);
  console.log(`Test endpoint: http://localhost:${PORT}/webhook/nova-capture`);
});
