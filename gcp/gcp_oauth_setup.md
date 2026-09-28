# GCP Credentials & Authentication Guide for Nova

This guide provides step-by-step instructions to configure GCP APIs and credentials for **Nova (Executive Assistant & Orchestrator AI Agent)**.

---

## 1. Quick GCP Project & API Activation

Run either the Bash or PowerShell setup script in the `gcp/` directory:

```bash
# Linux/macOS
chmod +x gcp/setup_gcp_project.sh
./gcp/setup_gcp_project.sh lester-labs

# Windows PowerShell
.\gcp\setup_gcp_project.ps1 -ProjectId "lester-labs"
```

The script automatically enables:
- **Gemini / Vertex AI API** (`generativelanguage.googleapis.com`)
- **Google Tasks API** (`tasks.googleapis.com`)
- **Google Calendar API** (`calendar-json.googleapis.com`)
- **Google Drive API** (`drive.googleapis.com`)
- **Google Docs API** (`docs.googleapis.com`)
- **Google Search Grounding API** (`customsearch.googleapis.com`)

---

## 2. Gemini API Key Setup

1. Open [Google AI Studio](https://aistudio.google.com/) or the [GCP API Credentials Console](https://console.cloud.google.com/apis/credentials).
2. Select Project `lester-labs`.
3. Click **Create API Key**.
4. Copy the generated key string.
5. In n8n, create a new **Header Auth** or **Google PaLM/Gemini** credential:
   - Header Name: `x-goog-api-key`
   - Value: `<YOUR_GEMINI_API_KEY>`

---

## 3. Google Workspace OAuth 2.0 Client Credentials (n8n Integration)

To allow n8n to interact with **Google Tasks, Calendar, Drive, and Docs** on your personal or workspace Google Account, configure an OAuth 2.0 Client ID:

1. Navigate to **GCP Console -> APIs & Services -> OAuth consent screen**.
2. Select **External** (or **Internal** if Google Workspace tenant) and click **Create**.
3. Fill in:
   - App Name: `Nova Executive Orchestrator`
   - User Support Email: *Your Email*
   - Authorized Domains: *Your n8n domain (e.g. `n8n.yourdomain.com`)*
4. Under **Scopes**, add the following Google Workspace scopes:
   - `https://www.googleapis.com/auth/tasks`
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/drive`
   - `https://www.googleapis.com/auth/documents`
5. Navigate to **APIs & Services -> Credentials -> Create Credentials -> OAuth client ID**.
6. Select **Web Application**.
7. Set **Authorized Redirect URIs**:
   - `https://<YOUR_N8N_DOMAIN>/rest/oauth2-credential/callback`
8. Save the **Client ID** and **Client Secret**.

---

## 4. Siri & 100% Hands-Free Voice Response Setup

Nova is configured for **100% hands-free voice execution** via Siri and Apple Shortcuts. Response messages and clarification questions are returned directly to Siri's HTTP connection to be spoken aloud automatically.

1. Configure the **Activate Nova** Apple Shortcut on your iPhone following [ios-shortcut/Nova_Shortcut_Blueprint.md](../ios-shortcut/Nova_Shortcut_Blueprint.md).
2. Set the shortcut URL to your n8n public endpoint: `https://<YOUR_N8N_DOMAIN>/webhook/nova-capture`.
3. Say **"Hey Siri, Activate Nova"** or press your physical Action Button to trigger Nova.

---

## 5. Loading Credentials into n8n

| Credential Name in n8n | Type | Usage |
| :--- | :--- | :--- |
| `Gemini_API_Key` | Header Auth / API Key | Calls `gemini-3.6-flash` for native audio parsing & grounding |
| `Google_Tasks_OAuth2` | Google Tasks OAuth2 API | Manages Google Tasks |
| `Google_Calendar_OAuth2` | Google Calendar OAuth2 API | Manages Google Calendar Events |
| `Google_Drive_OAuth2` | Google Drive OAuth2 API | Stores Research reports and notes |
| `Google_Docs_OAuth2` | Google Docs OAuth2 API | Appends/creates research docs |
