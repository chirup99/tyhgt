#!/bin/bash

# Deployment script for Google Cloud Run
# This deploys your Express backend to Cloud Run

set -e  # Exit on error

echo "🚀 Starting deployment to Google Cloud Run..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: gcloud CLI is not installed"
    echo "Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Get current project ID
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)

if [ -z "$PROJECT_ID" ]; then
    echo "❌ Error: No Google Cloud project configured"
    echo "Run: gcloud init"
    exit 1
fi

echo "📦 Project ID: $PROJECT_ID"
echo "🏗️  Building and deploying to Cloud Run..."

# Deploy using Cloud Build (easiest method - no manual Docker steps)
gcloud run deploy trading-platform-backend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --platform managed \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --max-instances 10 \
  --min-instances 0 \
  --set-env-vars "NODE_ENV=production" \
  --port 8080

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Get your Cloud Run service URL:"
echo "   gcloud run services describe trading-platform-backend --region us-central1 --format 'value(status.url)'"
echo ""
echo "2. Update your Firebase frontend environment variables:"
echo "   Add VITE_API_URL=<your-cloud-run-url> to your frontend build"
echo ""
echo "3. Add required environment variables to Cloud Run:"
echo "   gcloud run services update trading-platform-backend --region us-central1 \\"
echo "     --set-env-vars 'GOOGLE_CLIENT_ID=xxx,GOOGLE_CLIENT_SECRET=xxx,FYERS_API_KEY=xxx'"
