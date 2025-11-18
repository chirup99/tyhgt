#!/bin/bash

# Google Cloud Run Deployment Script
# Step 1: Build Docker image with Cloud Build
# Step 2: Deploy to Cloud Run with environment variables

set -e

echo "🚀 Starting Cloud Run deployment..."
echo ""

# Configuration
PROJECT_ID="fast-planet-470408-f1"
SERVICE_NAME="perala"
REGION="us-central1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest"

# Read environment variables from .env file
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    exit 1
fi

echo "📋 Reading environment variables from .env file..."

# Source the .env file to get all variables
set -a
source .env
set +a

echo "✅ Environment variables loaded"
echo ""

# Step 1: Build Docker image using Cloud Build
echo "🔨 Step 1: Building Docker image with Cloud Build..."
echo "   Using cloudbuild.yaml with VITE_* substitutions"
echo ""

gcloud builds submit \
  --config cloudbuild.yaml \
  --project $PROJECT_ID \
  --substitutions="\
_VITE_API_URL=${VITE_API_URL},\
_VITE_FIREBASE_API_KEY=${VITE_FIREBASE_API_KEY},\
_VITE_FIREBASE_AUTH_DOMAIN=${VITE_FIREBASE_AUTH_DOMAIN},\
_VITE_FIREBASE_PROJECT_ID=${VITE_FIREBASE_PROJECT_ID},\
_VITE_FIREBASE_STORAGE_BUCKET=${VITE_FIREBASE_STORAGE_BUCKET},\
_VITE_FIREBASE_MESSAGING_SENDER_ID=${VITE_FIREBASE_MESSAGING_SENDER_ID},\
_VITE_FIREBASE_APP_ID=${VITE_FIREBASE_APP_ID}"

echo ""
echo "✅ Docker image built successfully!"
echo ""

# Step 2: Build backend environment variables string
echo "🔧 Step 2: Preparing backend environment variables..."

BACKEND_ENV_VARS=""

# Add backend Firebase Admin SDK variables
if [ -n "$FIREBASE_PROJECT_ID" ]; then
    BACKEND_ENV_VARS="${BACKEND_ENV_VARS}FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID},"
fi
if [ -n "$FIREBASE_CLIENT_EMAIL" ]; then
    BACKEND_ENV_VARS="${BACKEND_ENV_VARS}FIREBASE_CLIENT_EMAIL=${FIREBASE_CLIENT_EMAIL},"
fi

# Add Google Cloud credentials
if [ -n "$GOOGLE_CLOUD_PROJECT_ID" ]; then
    BACKEND_ENV_VARS="${BACKEND_ENV_VARS}GOOGLE_CLOUD_PROJECT_ID=${GOOGLE_CLOUD_PROJECT_ID},"
fi
if [ -n "$GOOGLE_CLOUD_CLIENT_EMAIL" ]; then
    BACKEND_ENV_VARS="${BACKEND_ENV_VARS}GOOGLE_CLOUD_CLIENT_EMAIL=${GOOGLE_CLOUD_CLIENT_EMAIL},"
fi
if [ -n "$GOOGLE_CLOUD_PRIVATE_KEY" ]; then
    GOOGLE_CLOUD_PRIVATE_KEY_SINGLE_LINE=$(echo "$GOOGLE_CLOUD_PRIVATE_KEY" | tr '\n' ' ' | sed 's/  */ /g')
    BACKEND_ENV_VARS="${BACKEND_ENV_VARS}GOOGLE_CLOUD_PRIVATE_KEY=${GOOGLE_CLOUD_PRIVATE_KEY_SINGLE_LINE},"
fi


# Add Fyers API credentials
if [ -n "$FYERS_APP_ID" ]; then
    BACKEND_ENV_VARS="${BACKEND_ENV_VARS}FYERS_APP_ID=${FYERS_APP_ID},"
fi

# Add NODE_ENV
BACKEND_ENV_VARS="${BACKEND_ENV_VARS}NODE_ENV=production,"

# Remove trailing comma
BACKEND_ENV_VARS="${BACKEND_ENV_VARS%,}"

echo "✅ Backend environment variables prepared"
echo ""

# Define secrets
SECRETS="FIREBASE_PRIVATE_KEY=FIREBASE_PRIVATE_KEY:latest,FYERS_ACCESS_TOKEN=FYERS_ACCESS_TOKEN:latest,FYERS_SECRET_KEY=FYERS_SECRET_KEY:latest,GEMINI_API_KEY=GEMINI_API_KEY:latest"


# Step 3: Deploy to Cloud Run
echo "🚀 Step 3: Deploying to Cloud Run..."
echo "   Project: $PROJECT_ID"
echo "   Service: $SERVICE_NAME"
echo "   Region: $REGION"
echo "   Image: $IMAGE_NAME"
echo ""

gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_NAME \
  --project $PROJECT_ID \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --max-instances 10 \
  --port 5000 \
  --set-env-vars="$BACKEND_ENV_VARS" \
  --set-secrets="$SECRETS"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Your application is now live at:"
gcloud run services describe $SERVICE_NAME \
  --project $PROJECT_ID \
  --region $REGION \
  --format='value(status.url)'
echo ""
echo "📊 View logs:"
echo "   gcloud run services logs read $SERVICE_NAME --project $PROJECT_ID --region $REGION --limit 50"
echo ""
echo "🔍 Service details:"
echo "   gcloud run services describe $SERVICE_NAME --project $PROJECT_ID --region $REGION"
echo ""
