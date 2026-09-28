const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Load environment variables from config/env.example or .env
function loadEnv() {
  const envPath = path.join(__dirname, '../config/env.example');
  let envVars = {};
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#') && line.includes('=')) {
        const parts = line.split('=');
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim();
        envVars[key] = value;
      }
    });
  }
  return envVars;
}

const env = loadEnv();
const API_URL = process.env.N8N_API_URL || env.N8N_API_URL || 'https://automation.lesterlabs.cloud';
const API_KEY = process.env.N8N_API_KEY || env.N8N_API_KEY || '';

if (!API_KEY) {
  console.error('Error: N8N_API_KEY is missing.');
  process.exit(1);
}

function makeRequest(endpoint, method = 'GET', bodyData = null) {
  return new Promise((resolve, reject) => {
    const fullUrl = new URL(endpoint.startsWith('http') ? endpoint : `${API_URL}/api/v1/${endpoint.replace(/^\//, '')}`);
    const client = fullUrl.protocol === 'https:' ? https : http;
    
    const postData = bodyData ? JSON.stringify(bodyData) : null;

    const options = {
      hostname: fullUrl.hostname,
      port: fullUrl.port || (fullUrl.protocol === 'https:' ? 443 : 80),
      path: fullUrl.pathname + fullUrl.search,
      method: method,
      headers: {
        'X-N8N-API-KEY': API_KEY,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    };

    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve(data);
          }
        } else {
          reject(new Error(`API Request failed (${res.statusCode}): ${data}`));
        }
      });
    });

    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function updateWorkflowFromFile(workflowId, filePath) {
  const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${absolutePath}`);
  }
  const fileContent = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));

  const allowedSettings = ['executionOrder', 'saveExecutionProgress', 'saveManualExecutions', 'saveDataErrorExecution', 'saveDataSuccessExecution', 'executionTimeout', 'errorWorkflow', 'callerPolicy'];
  const cleanSettings = {};
  if (fileContent.settings) {
    Object.keys(fileContent.settings).forEach(key => {
      if (allowedSettings.includes(key)) {
        cleanSettings[key] = fileContent.settings[key];
      }
    });
  }

  const payload = {
    name: fileContent.name,
    nodes: fileContent.nodes,
    connections: fileContent.connections,
    settings: cleanSettings
  };

  if (workflowId) {
    console.log(`Updating workflow ${workflowId} (${fileContent.name}) on n8n...`);
    const res = await makeRequest(`workflows/${workflowId}`, 'PUT', payload);
    console.log(`Successfully updated workflow ${workflowId}! (Name: ${res.name}, Active: ${res.active})`);
    return res;
  } else {
    console.log(`Creating new workflow (${fileContent.name}) on n8n...`);
    const res = await makeRequest(`workflows`, 'POST', payload);
    console.log(`Successfully created new workflow ${res.id}! (Name: ${res.name}, Active: ${res.active})`);
    try {
      await makeRequest(`workflows/${res.id}/activate`, 'POST');
      console.log(`Successfully activated workflow ${res.id}!`);
    } catch(e) {}
    return res;
  }
}

async function verifyLatestExecution() {
  console.log('Fetching latest executions for automated verification...');
  const execList = await makeRequest('executions?limit=5');
  if (!execList.data || execList.data.length === 0) {
    console.log('No recent executions found to verify.');
    return;
  }

  const masterExecSummary = execList.data.find(e => e.workflowId === 'YRwbtSO1NMKf8Lev');
  if (!masterExecSummary) {
    console.log('No recent Master Orchestrator execution found.');
    return;
  }

  const masterExec = await makeRequest(`executions/${masterExecSummary.id}?includeData=true`);
  const masterRunData = masterExec.data.resultData.runData;

  const rawInput = masterRunData['Prepare Input & Context'] ? masterRunData['Prepare Input & Context'][0].data.main[0][0].json.raw_input : 'N/A';
  const evalData = masterRunData['Evaluate Intent & State'] ? masterRunData['Evaluate Intent & State'][0].data.main[0][0].json : {};
  const intent = evalData.intent || 'UNKNOWN';
  const parameters = evalData.parameters || {};

  console.log(`\n======================================================`);
  console.log(`🔍 AUTOMATED VERIFICATION REPORT (Master Execution ID: ${masterExecSummary.id})`);
  console.log(`======================================================`);
  console.log(`🎙️ Voice Prompt Input : "${rawInput}"`);
  console.log(`🎯 Evaluated Intent  : ${intent}`);
  console.log(`📋 Extracted Params  :`, JSON.stringify(parameters, null, 2));

  const childExecSummary = execList.data.find(e => e.parentExecution && e.parentExecution.executionId === String(masterExecSummary.id));
  let childExec = null;
  let childRunData = null;

  if (childExecSummary) {
    childExec = await makeRequest(`executions/${childExecSummary.id}?includeData=true`);
    childRunData = childExec.data.resultData.runData;
  }

  let passCount = 0;
  let failCount = 0;
  function logCheck(name, passed, details) {
    if (passed) {
      passCount++;
      console.log(`✅ [PASS] ${name}: ${details}`);
    } else {
      failCount++;
      console.log(`❌ [FAIL] ${name}: ${details}`);
    }
  }

  if (intent === 'TASK' || intent === 'CALENDAR') {
    logCheck('Title Parameter Captured', !!parameters.title, parameters.title ? `Title: "${parameters.title}"` : 'Title is missing or empty');
    if (rawInput.toLowerCase().includes('tomorrow') || rawInput.toLowerCase().includes('pm') || rawInput.toLowerCase().includes('am') || rawInput.toLowerCase().includes('at')) {
      logCheck('Date/Time Parameter Extracted', !!parameters.date_time, parameters.date_time ? `Date/Time: "${parameters.date_time}"` : 'Voice prompt contained date/time terms but date_time parameter was null');
    }
  } else if (intent === 'RESEARCH') {
    logCheck('Research Query Parameter Captured', !!parameters.query, parameters.query ? `Query: "${parameters.query}"` : 'Research query missing');
  }

  if (childRunData) {
    if (childRunData['Create a task']) {
      const taskOutput = childRunData['Create a task'][0].data.main[0][0].json;
      logCheck('Google Tasks Title API Return', !!taskOutput.title, `Saved Title: "${taskOutput.title}"`);
      logCheck('Google Tasks Due Date API Return', !!taskOutput.due, taskOutput.due ? `Saved Due Date: "${taskOutput.due}"` : 'Due date parameter missing in Google Tasks API return object');
    } else if (childRunData['Create an event']) {
      const eventOutput = childRunData['Create an event'][0].data.main[0][0].json;
      logCheck('Google Calendar Event Summary', !!eventOutput.summary, `Event Summary: "${eventOutput.summary}"`);
      logCheck('Google Calendar Event Start Time', !!eventOutput.start, `Start Time: "${JSON.stringify(eventOutput.start)}"`);
    }
  }

  let spokenMessage = '';
  if (childRunData && childRunData['Format Spoken Task Output']) {
    spokenMessage = childRunData['Format Spoken Task Output'][0].data.main[0][0].json.message || '';
  } else if (masterRunData['Respond to iOS (Completed Spoken)']) {
    spokenMessage = masterRunData['Respond to iOS (Completed Spoken)'][0].data.main[0][0].json.message || '';
  }

  const isJSON = spokenMessage.startsWith('{') || spokenMessage.startsWith('[');
  const isRawISO = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(spokenMessage);
  const wordCount = spokenMessage.split(/\s+/).length;
  const isConversational = spokenMessage.length > 5 && !isJSON && !isRawISO && wordCount <= 40;

  logCheck('Spoken Response Generated', !!spokenMessage, `Message: "${spokenMessage}"`);
  logCheck('Natural Human Speech Patterns', isConversational, isConversational ? `Natural & Concise (${wordCount} words)` : `Failed natural speech checks (Raw ISO/JSON or wordy: "${spokenMessage}")`);

  console.log(`------------------------------------------------------`);
  console.log(`VERIFICATION SUMMARY: ${passCount} PASSED, ${failCount} FAILED.`);
  console.log(`======================================================\n`);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'list-workflows';

  try {
    if (command === 'list-workflows') {
      const res = await makeRequest('workflows');
      console.log('=== n8n Workflows ===');
      if (res.data && res.data.length > 0) {
        res.data.forEach(w => {
          console.log(`[ID: ${w.id}] ${w.name} | Active: ${w.active}`);
        });
      } else {
        console.log('No workflows found.');
      }
    } else if (command === 'list-executions') {
      const workflowId = args[1];
      let endpoint = 'executions?limit=10';
      if (workflowId) {
        endpoint += `&workflowId=${workflowId}`;
      }
      const res = await makeRequest(endpoint);
      console.log('=== Recent n8n Executions ===');
      if (res.data && res.data.length > 0) {
        res.data.forEach(e => {
          console.log(`[ID: ${e.id}] Workflow: ${e.workflowId} | Status: ${e.finished ? (e.stoppedAt ? 'SUCCESS' : 'FINISHED') : 'RUNNING'} | Mode: ${e.mode} | Started: ${e.startedAt}`);
        });
      } else {
        console.log('No executions found.');
      }
    } else if (command === 'get-execution') {
      const executionId = args[1];
      if (!executionId) {
        console.error('Error: Please provide executionId');
        process.exit(1);
      }
      const res = await makeRequest(`executions/${executionId}?includeData=true`);
      console.log(JSON.stringify(res, null, 2));
    } else if (command === 'get-latest') {
      const res = await makeRequest('executions?limit=1');
      if (res.data && res.data.length > 0) {
        const latestId = res.data[0].id;
        console.log(`Fetching latest execution (ID: ${latestId})...`);
        const details = await makeRequest(`executions/${latestId}?includeData=true`);
        console.log(JSON.stringify(details, null, 2));
      } else {
        console.log('No executions found.');
      }
    } else if (command === 'update-workflow') {
      const workflowId = args[1];
      const filePath = args[2];
      if (!filePath) {
        console.error('Usage: node n8n_api_cli.js update-workflow [workflowId] <filePath>');
        process.exit(1);
      }
      await updateWorkflowFromFile(workflowId, filePath);
    } else if (command === 'update-nova') {
      console.log('Updating Nova workflows on live n8n instance...');
      await updateWorkflowFromFile('YRwbtSO1NMKf8Lev', 'projects/nova/workflows/Nova - Master Orchestrator (100% Hands-Free Siri Edition).json');
      await updateWorkflowFromFile('HgELZoUSh5Wbh9NH', 'projects/nova/workflows/Nova - Task & Calendar Sub-Agent.json');
      await updateWorkflowFromFile('8Q4YXHFqYrazeR4F', 'projects/nova/workflows/nova-note-subagent.json');
      await updateWorkflowFromFile('OKDfuESRzTXytHHg', 'projects/nova/workflows/nova-research-subagent.json');
      // Create or update Nova Error Handler and Slack Feature Builder
      const existingWorkflows = await makeRequest('workflows');
      let errorHandler = existingWorkflows.data ? existingWorkflows.data.find(w => w.name.includes('Error Handler')) : null;
      await updateWorkflowFromFile(errorHandler ? errorHandler.id : null, 'projects/nova/workflows/nova-error-handler.json');
      let featureBuilder = existingWorkflows.data ? existingWorkflows.data.find(w => w.name.includes('Feature Builder')) : null;
      await updateWorkflowFromFile(featureBuilder ? featureBuilder.id : null, 'projects/nova/workflows/nova-builder.json');
      console.log('All Nova workflows, Error Handler & Slack Feature Builder have been successfully updated live on n8n!');
    } else if (command === 'verify-last') {
      await verifyLatestExecution();
    } else {
      console.log('Usage: node n8n_api_cli.js [list-workflows | list-executions | get-execution <id> | update-workflow <id> <file> | update-nova | verify-last]');
    }
  } catch (err) {
    console.error('API Error:', err.message);
  }
}

main();
