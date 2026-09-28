# 🚀 Nova - Executive Assistant & Orchestrator AI System

**Nova** is an intelligent Executive Assistant and Multi-Agent Orchestration system built on **n8n**, powered by **Google Gemini API** (`gemini-3.6-flash`), and seamlessly integrated into **Google Workspace** (Tasks, Calendar, Drive, Docs).

Nova is engineered for **100% hands-free voice operation** via Siri and Apple Shortcuts. You say *"Hey Siri, Activate Nova"*, speak your instruction, and Nova processes your request. If parameters are missing, Nova speaks its question aloud via Siri and automatically re-opens the voice dictation loop so you can answer hands-free.

---

## 🏗️ System Architecture

```
[Voice Trigger: "Hey Siri, Activate Nova"] ──> [n8n Webhook: /nova-capture]
                                                           │
                                             [Gemini 3.6 Flash Intent Evaluation]
                                                           │
             ┌─────────────────────────────────────────────┼─────────────────────────────────────────────┐
             │                                             │                                             │
   [Missing Details?]                              [Complete Intent]                             [Specialized Task]
             │                                             │                                             │
   (Clarification Loop)                            (Router Switch)                              (Sub-Agent Hand-off)
             │                                             │                                             │
 [Siri Speaks Question Aloud]               ┌──────────────┴──────────────┐             [Research Sub-Agent w/ Grounding]
             │                              │                             │                              │
[Microphone Automatically Listens]   [Google Tasks /               [Google Drive /               [Save Report to Drive Docs &
             │                        Calendar]                       Docs]                       Speak Confirmation Aloud]
             └─────────────────────────────>│                             │                              │
                                            └─────────────────────────────┴──────────────────────────────┘
```

---

## 📦 Project Structure

```
projects/nova/
├── README.md                           # Master Architecture & Setup Guide
├── config/
│   └── env.example                     # Environment variables & configuration template
├── gcp/
│   ├── setup_gcp_project.sh            # Bash script to enable GCP APIs & provision SA
│   ├── setup_gcp_project.ps1           # PowerShell script to enable GCP APIs & provision SA
│   └── gcp_oauth_setup.md              # Detailed GCP OAuth 2.0 & credentials setup guide
├── workflows/
│   ├── nova-master-orchestrator.json   # Master Orchestrator workflow (Clarification loop + Router)
│   ├── nova-research-subagent.json     # Research Sub-Agent (Google Search Grounding -> Docs -> Google Chat)
│   ├── nova-task-calendar-subagent.json# Task & Calendar Sub-Agent (Google Tasks & Calendar API)
│   └── nova-note-subagent.json         # Knowledge Note Sub-Agent (Google Drive & Docs formatting)
├── ios-shortcut/
│   ├── Nova_Activate.shortcut.json     # Declarative iOS Shortcut JSON definition
│   └── Nova_Shortcut_Blueprint.md      # Siri & iOS Action Button setup guide
└── tests/
    ├── mock_webhook_server.js          # Mock n8n webhook server for local payload testing
    └── test_gemini_audio_parser.js     # Standalone Gemini API 3.6 Flash schema test script
```

---

## 🛠️ Step-by-Step Setup Guide

### Step 1: Provision GCP Project & Enable APIs

Run the automated setup script to target your `lester-labs` project and enable all necessary APIs:

```bash
# Linux / macOS
chmod +x gcp/setup_gcp_project.sh
./gcp/setup_gcp_project.sh lester-labs

# Windows PowerShell
.\gcp\setup_gcp_project.ps1 -ProjectId "lester-labs"
```

Follow [gcp/gcp_oauth_setup.md](gcp/gcp_oauth_setup.md) to generate your **Gemini API Key** and **Google Workspace OAuth 2.0 Credentials**.

---

### Step 2: Configure Environment Variables

Copy `config/env.example` to your n8n environment variables:

```bash
GCP_PROJECT_ID=project-nova-agent
GEMINI_API_KEY=AIzaSy...
GOOGLE_CHAT_WEBHOOK_URL=https://chat.googleapis.com/v1/spaces/.../messages?key=...
```

---

### Step 3: Import Workflows into n8n

1. Open your n8n instance -> **Workflows** -> **Import from File**.
2. Import all workflows from `workflows/`:
   - [nova-master-orchestrator.json](workflows/nova-master-orchestrator.json)
   - [nova-research-subagent.json](workflows/nova-research-subagent.json)
   - [nova-task-calendar-subagent.json](workflows/nova-task-calendar-subagent.json)
   - [nova-note-subagent.json](workflows/nova-note-subagent.json)
3. Attach your **Gemini API Key Header Auth** and **Google OAuth 2.0 Credentials**.
4. Activate all 4 workflows.

---

### Step 4: Configure iOS Shortcut & Siri Trigger

Follow [ios-shortcut/Nova_Shortcut_Blueprint.md](ios-shortcut/Nova_Shortcut_Blueprint.md) to construct the **"Activate Nova"** Apple Shortcut on your iPhone.

Say **"Hey Siri, Activate Nova"** or press your iPhone Action Button to begin dictating!

---

## 🧪 Local Testing & Verification

Validate the JSON structure of all workflow exports:

```bash
node -e "JSON.parse(require('fs').readFileSync('workflows/nova-master-orchestrator.json'))"
node -e "JSON.parse(require('fs').readFileSync('workflows/nova-research-subagent.json'))"
node -e "JSON.parse(require('fs').readFileSync('workflows/nova-task-calendar-subagent.json'))"
node -e "JSON.parse(require('fs').readFileSync('workflows/nova-note-subagent.json'))"
```

Run the mock webhook server to simulate iOS requests without an active n8n instance:

```bash
node tests/mock_webhook_server.js
```

---

## ✅ Feature Checklist

- [x] GCP Project provisioning and API enablement scripts (`generativelanguage`, `tasks`, `calendar`, `drive`, `docs`, `customsearch`).
- [x] Webhook capture endpoint (`/nova-capture`) handling binary `.m4a`/`.wav` and text strings.
- [x] Gemini 3.6 Flash system prompt & structured JSON status evaluation.
- [x] State-handling Clarification Loop using n8n Workflow Static Data.
- [x] 100% Hands-Free Siri Voice orchestration loop for clarification prompts and completion responses.
- [x] Specialized Research Sub-Agent with Google Search Grounding & Google Doc export.
- [x] Google Tasks and Google Calendar execution nodes.
- [x] Knowledge Note Sub-Agent with Google Drive & Docs formatting.
- [x] Siri & iOS Shortcut blueprint specification.
