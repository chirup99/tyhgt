#!/bin/bash
# Deploy to Google Cloud Run

# Make sure you're in the project root directory
cd "$(dirname "$0")"

# Set your project variables
PROJECT_ID="your-gcp-project-id"
SERVICE_NAME="trading-platform"
REGION="us-central1"

# Build and deploy (this command ensures proper build context)
gcloud run deploy $SERVICE_NAME \
  --source . \
  --project=$PROJECT_ID \
  --region=$REGION \
  --allow-unauthenticated \
  --platform=managed \
  --memory=2Gi \
  --cpu=2 \
  --timeout=300 \
  --max-instances=10

echo "✅ Deployment complete!"
