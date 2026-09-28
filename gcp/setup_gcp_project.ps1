<#
.SYNOPSIS
    NOVA GCP PROJECT SETUP SCRIPT (PowerShell)
    Project Name: Nova (Executive Assistant & Orchestrator AI)
    GCP Project ID: lester-labs
#>

param(
    [string]$ProjectId = "lester-labs"
)

$ErrorActionPreference = "Stop"

Write-Host "==================================================================" -ForegroundColor Cyans
Write-Host "🚀 Initializing GCP Setup for Nova Agent System" -ForegroundColor Cyan
Write-Host "Target Project ID: $ProjectId" -ForegroundColor Yellow
Write-Host "==================================================================" -ForegroundColor Cyan

$SAName = "nova-orchestrator-sa"
$SAEmail = "$SAName@$ProjectId.iam.gserviceaccount.com"

# 1. Check or Create GCP Project
$projectExists = gcloud projects list --filter="projectId:$ProjectId" --format="value(projectId)"
if (-not $projectExists) {
    Write-Host "Creating GCP Project '$ProjectId'..." -ForegroundColor Green
    gcloud projects create $ProjectId --name="Nova Agent System"
} else {
    Write-Host "✓ Project $ProjectId already exists." -ForegroundColor Green
}

gcloud config set project $ProjectId

# 2. Enable Required APIs
Write-Host "`n------------------------------------------------------------------" -ForegroundColor Gray
Write-Host "📦 Enabling Required GCP APIs..." -ForegroundColor Cyan
Write-Host "------------------------------------------------------------------" -ForegroundColor Gray

$apis = @(
    "generativelanguage.googleapis.com",
    "tasks.googleapis.com",
    "calendar-json.googleapis.com",
    "drive.googleapis.com",
    "docs.googleapis.com",
    "customsearch.googleapis.com"
)

foreach ($api in $apis) {
    Write-Host "Enabling API: $api..." -ForegroundColor Yellow
    gcloud services enable $api --project=$ProjectId
}

Write-Host "✓ All required APIs enabled successfully." -ForegroundColor Green

# 3. Create Service Account
Write-Host "`n------------------------------------------------------------------" -ForegroundColor Gray
Write-Host "🔑 Provisioning Service Account for n8n Orchestrator..." -ForegroundColor Cyan
Write-Host "------------------------------------------------------------------" -ForegroundColor Gray

$saExists = gcloud iam service-accounts list --filter="email:$SAEmail" --format="value(email)"
if (-not $saExists) {
    gcloud iam service-accounts create $SAName `
        --display-name="Nova Orchestrator Service Account" `
        --description="Used by n8n to manage Google Workspace & Gemini APIs"
    Write-Host "✓ Created Service Account: $SAEmail" -ForegroundColor Green
} else {
    Write-Host "✓ Service account $SAEmail already exists." -ForegroundColor Green
}

# 4. Generate Key JSON
$keyFile = "nova-service-account-key.json"
Write-Host "Exporting Service Account Private Key to '$keyFile'..." -ForegroundColor Yellow
gcloud iam service-accounts keys create $keyFile --iam-account=$SAEmail

Write-Host "`n==================================================================" -ForegroundColor Cyan
Write-Host "✅ GCP Setup Complete for Nova!" -ForegroundColor Green
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "1. Upload '$keyFile' to n8n for Google Workspace Node Credential Setup."
Write-Host "2. Generate a Gemini API Key from GCP Console / Google AI Studio."
Write-Host "3. Follow gcp/gcp_oauth_setup.md for OAuth 2.0 Client credentials."
