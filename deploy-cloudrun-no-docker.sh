#!/bin/bash

# Google Cloud Run Deployment Script (No Docker Required)
# Uses Google Cloud Buildpacks to deploy directly from source

set -e

echo "🚀 Starting Cloud Run deployment from source..."
echo ""

# Configuration
PROJECT_ID="fast-planet-470408-f1"
SERVICE_NAME="perala"
REGION="us-central1"

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

# Convert multi-line private key to single line for passing as env var
if [ -n "$FIREBASE_PRIVATE_KEY" ]; then
    FIREBASE_PRIVATE_KEY_SINGLE_LINE=$(echo "$FIREBASE_PRIVATE_KEY" | tr '\n' ' ' | sed 's/  */ /g')
else
    echo "⚠️  Warning: FIREBASE_PRIVATE_KEY not found in .env"
fi

echo "✅ Environment variables loaded"
echo ""

# Build environment variables string for gcloud
ENV_VARS=""

# Add VITE_* frontend variables (these MUST be set at build time)
if [ -n "$VITE_API_URL" ]; then
    ENV_VARS="${ENV_VARS}VITE_API_URL=${VITE_API_URL},"
fi
if [ -n "$VITE_FIREBASE_API_KEY" ]; then
    ENV_VARS="${ENV_VARS}VITE_FIREBASE_API_KEY=${VITE_FIREBASE_API_KEY},"
fi
if [ -n "$VITE_FIREBASE_AUTH_DOMAIN" ]; then
    ENV_VARS="${ENV_VARS}VITE_FIREBASE_AUTH_DOMAIN=${VITE_FIREBASE_AUTH_DOMAIN},"
fi
if [ -n "$VITE_FIREBASE_PROJECT_ID" ]; then
    ENV_VARS="${ENV_VARS}VITE_FIREBASE_PROJECT_ID=${VITE_FIREBASE_PROJECT_ID},"
fi
if [ -n "$VITE_FIREBASE_STORAGE_BUCKET" ]; then
    ENV_VARS="${ENV_VARS}VITE_FIREBASE_STORAGE_BUCKET=${VITE_FIREBASE_STORAGE_BUCKET},"
fi
if [ -n "$VITE_FIREBASE_MESSAGING_SENDER_ID" ]; then
    ENV_VARS="${ENV_VARS}VITE_FIREBASE_MESSAGING_SENDER_ID=${VITE_FIREBASE_MESSAGING_SENDER_ID},"
fi
if [ -n "$VITE_FIREBASE_APP_ID" ]; then
    ENV_VARS="${ENV_VARS}VITE_FIREBASE_APP_ID=${VITE_FIREBASE_APP_ID},"
fi

# Add backend Firebase Admin SDK variables
if [ -n "$FIREBASE_PROJECT_ID" ]; then
    ENV_VARS="${ENV_VARS}FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID},"
fi
if [ -n "$FIREBASE_CLIENT_EMAIL" ]; then
    ENV_VARS="${ENV_VARS}FIREBASE_CLIENT_EMAIL=${FIREBASE_CLIENT_EMAIL},"
fi
if [ -n "$FIREBASE_PRIVATE_KEY_SINGLE_LINE" ]; then
    ENV_VARS="${ENV_VARS}FIREBASE_PRIVATE_KEY=${FIREBASE_PRIVATE_KEY_SINGLE_LINE},"
fi

# Add Google Cloud credentials
if [ -n "$GOOGLE_CLOUD_PROJECT_ID" ]; then
    ENV_VARS="${ENV_VARS}GOOGLE_CLOUD_PROJECT_ID=${GOOGLE_CLOUD_PROJECT_ID},"
fi
if [ -n "$GOOGLE_CLOUD_CLIENT_EMAIL" ]; then
    ENV_VARS="${ENV_VARS}GOOGLE_CLOUD_CLIENT_EMAIL=${GOOGLE_CLOUD_CLIENT_EMAIL},"
fi
if [ -n "$GOOGLE_CLOUD_PRIVATE_KEY" ]; then
    GOOGLE_CLOUD_PRIVATE_KEY_SINGLE_LINE=$(echo "$GOOGLE_CLOUD_PRIVATE_KEY" | tr '\n' ' ' | sed 's/  */ /g')
    ENV_VARS="${ENV_VARS}GOOGLE_CLOUD_PRIVATE_KEY=${GOOGLE_CLOUD_PRIVATE_KEY_SINGLE_LINE},"
fi

# Add Gemini API key
if [ -n "$GEMINI_API_KEY" ]; then
    ENV_VARS="${ENV_VARS}GEMINI_API_KEY=${GEMINI_API_KEY},"
fi

# Add Fyers API credentials
if [ -n "$FYERS_APP_ID" ]; then
    ENV_VARS="${ENV_VARS}FYERS_APP_ID=${FYERS_APP_ID},"
fi
if [ -n "$FYERS_SECRET_KEY" ]; then
    ENV_VARS="${ENV_VARS}FYERS_SECRET_KEY=${FYERS_SECRET_KEY},"
fi
if [ -n "$FYERS_ACCESS_TOKEN" ]; then
    ENV_VARS="${ENV_VARS}FYERS_ACCESS_TOKEN=${FYERS_ACCESS_TOKEN},"
fi

# Add any other necessary environment variables
if [ -n "$NODE_ENV" ]; then
    ENV_VARS="${ENV_VARS}NODE_ENV=${NODE_ENV},"
fi

# Remove trailing comma
ENV_VARS="${ENV_VARS%,}"

echo "📦 Deploying to Cloud Run from source code..."
echo "   Project: $PROJECT_ID"
echo "   Service: $SERVICE_NAME"
echo "   Region: $REGION"
echo ""

# Deploy to Cloud Run using source code (no Docker needed!)
gcloud run deploy $SERVICE_NAME \
  --source . \
  --project $PROJECT_ID \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --max-instances 10 \
  --port 5000 \
  --set-env-vars="$ENV_VARS"

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
echo "   gcloud run services logs read $SERVICE_NAME --project $PROJECT_ID --region $REGION"
echo ""
echo "🔍 Service details:"
echo "   gcloud run services describe $SERVICE_NAME --project $PROJECT_ID --region $REGION"
