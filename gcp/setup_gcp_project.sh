#!/usr/bin/env bash
# ==============================================================================
# NOVA GCP PROJECT SETUP SCRIPT (Bash)
# Project Name: Nova (Executive Assistant & Orchestrator AI)
# GCP Project ID: lester-labs
# ==============================================================================

set -euo pipefail

PROJECT_ID="${1:-lester-labs}"
SA_NAME="nova-orchestrator-sa"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

echo "=================================================================="
echo "🚀 Initializing GCP Setup for Nova Agent System"
echo "Target Project ID: ${PROJECT_ID}"
echo "=================================================================="

# 1. Create GCP Project (if not exists)
if gcloud projects describe "${PROJECT_ID}" &>/dev/null; then
    echo "✓ Project ${PROJECT_ID} already exists."
else
    echo "Creating GCP Project '${PROJECT_ID}'..."
    gcloud projects create "${PROJECT_ID}" --name="Nova Agent System"
fi

# Set active project
gcloud config set project "${PROJECT_ID}"

# 2. Enable Required Google Cloud APIs
echo "------------------------------------------------------------------"
echo "📦 Enabling Required GCP APIs..."
echo "------------------------------------------------------------------"

APIS=(
    "generativelanguage.googleapis.com"  # Gemini API & Native Audio Parsing
    "tasks.googleapis.com"               # Google Tasks API
    "calendar-json.googleapis.com"       # Google Calendar API
    "drive.googleapis.com"               # Google Drive API
    "docs.googleapis.com"                # Google Docs API
    "customsearch.googleapis.com"        # Google Search Grounding API
)

for api in "${APIS[@]}"; do
    echo "Enabling API: ${api}..."
    gcloud services enable "${api}" --project="${PROJECT_ID}"
done

echo "✓ All required APIs enabled successfully."

# 3. Create Service Account for n8n Integration
echo "------------------------------------------------------------------"
echo "🔑 Provisioning Service Account for n8n Orchestrator..."
echo "------------------------------------------------------------------"

if gcloud iam service-accounts describe "${SA_EMAIL}" &>/dev/null; then
    echo "✓ Service account ${SA_NAME} already exists."
else
    gcloud iam service-accounts create "${SA_NAME}" \
        --display-name="Nova Orchestrator Service Account" \
        --description="Used by n8n to manage Google Workspace & Gemini APIs"
fi

# 4. Generate Service Account Key JSON
KEY_FILE="nova-service-account-key.json"
echo "Exporting Service Account Private Key to '${KEY_FILE}'..."
gcloud iam service-accounts keys create "${KEY_FILE}" \
    --iam-account="${SA_EMAIL}"

echo "=================================================================="
echo "✅ GCP Setup Complete for Nova!"
echo "=================================================================="
echo "Next Steps:"
echo "1. Upload '${KEY_FILE}' to n8n for Google Workspace Node Credential Setup."
echo "2. Generate a Gemini API Key from GCP Console / Google AI Studio."
echo "3. Follow gcp/gcp_oauth_setup.md to grant OAuth domain-wide delegation if needed."
echo "=================================================================="
