#!/bin/bash
# Deploy to Google Cloud Run
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Make sure you're in the project root directory
cd "$(dirname "$0")"

# Set your project variables
PROJECT_ID="fast-planet-470408-f1"
SERVICE_NAME="perala"
REGION="us-central1"

echo -e "${YELLOW}🚀 Starting deployment to Cloud Run...${NC}"
echo "Project: $PROJECT_ID"
echo "Service: $SERVICE_NAME"
echo "Region: $REGION"
echo ""

# Verify gcloud is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" > /dev/null 2>&1; then
    echo -e "${RED}ERROR: Not authenticated with gcloud${NC}"
    echo "Run: gcloud auth login"
    exit 1
fi

# Set the project
echo -e "${YELLOW}📦 Setting GCP project...${NC}"
gcloud config set project $PROJECT_ID

# Enable required APIs
echo -e "${YELLOW}🔧 Ensuring required APIs are enabled...${NC}"
gcloud services enable run.googleapis.com cloudbuild.googleapis.com --quiet

# Build and deploy using source
echo -e "${YELLOW}🏗️  Building and deploying from source...${NC}"
echo "This may take 5-10 minutes..."
echo ""

gcloud run deploy $SERVICE_NAME \
  --source . \
  --region=$REGION \
  --allow-unauthenticated \
  --platform=managed \
  --memory=2Gi \
  --cpu=2 \
  --timeout=300 \
  --max-instances=10 \
  --min-instances=0 \
  --set-env-vars="NODE_ENV=production,VITE_FIREBASE_API_KEY=AIzaSyAg-jCM5IzgosNkdRJ2xQRZfFzl0C7LHZk,VITE_FIREBASE_AUTH_DOMAIN=fast-planet-470408-f1.firebaseapp.com,VITE_FIREBASE_PROJECT_ID=fast-planet-470408-f1,VITE_FIREBASE_STORAGE_BUCKET=fast-planet-470408-f1.firebasestorage.app,VITE_FIREBASE_MESSAGING_SENDER_ID=808950990883,VITE_FIREBASE_APP_ID=1:808950990883:web:1252e6131d1f1c21688996"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo ""
    echo -e "${YELLOW}🌐 Getting service URL...${NC}"
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)')
    echo -e "${GREEN}Your app is live at: $SERVICE_URL${NC}"
    echo ""
    echo -e "${YELLOW}📊 To view logs:${NC}"
    echo "gcloud run services logs read $SERVICE_NAME --region=$REGION"
    echo ""
    echo -e "${YELLOW}⚙️  To set environment variables:${NC}"
    echo "gcloud run services update $SERVICE_NAME --region=$REGION --set-env-vars=\"KEY=VALUE\""
else
    echo ""
    echo -e "${RED}❌ Deployment failed!${NC}"
    echo ""
    echo -e "${YELLOW}Check build logs:${NC}"
    echo "gcloud builds list --limit=1"
    echo "gcloud builds log \$(gcloud builds list --limit=1 --format='value(id)')"
    exit 1
fi
