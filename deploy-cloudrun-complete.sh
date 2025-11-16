#!/bin/bash
set -e

echo "🚀 Complete Cloud Run Deployment Script with Firebase Support"
echo "=============================================================="

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create .env with your Firebase credentials"
    exit 1
fi

# Load Firebase environment variables from .env
echo "📋 Loading Firebase credentials from .env..."
export $(grep "^VITE_FIREBASE_" .env | xargs)

# Verify Firebase variables are loaded
if [ -z "$VITE_FIREBASE_API_KEY" ]; then
    echo "❌ Error: VITE_FIREBASE_API_KEY not found in .env"
    exit 1
fi

echo "✅ Firebase credentials loaded successfully"
echo ""
echo "🐳 Building Docker image with Firebase credentials..."

# Build the Docker image with Firebase build args
gcloud builds submit --tag gcr.io/fast-planet-470408-f1/perala \
  --build-arg VITE_FIREBASE_API_KEY="$VITE_FIREBASE_API_KEY" \
  --build-arg VITE_FIREBASE_AUTH_DOMAIN="$VITE_FIREBASE_AUTH_DOMAIN" \
  --build-arg VITE_FIREBASE_PROJECT_ID="$VITE_FIREBASE_PROJECT_ID" \
  --build-arg VITE_FIREBASE_STORAGE_BUCKET="$VITE_FIREBASE_STORAGE_BUCKET" \
  --build-arg VITE_FIREBASE_MESSAGING_SENDER_ID="$VITE_FIREBASE_MESSAGING_SENDER_ID" \
  --build-arg VITE_FIREBASE_APP_ID="$VITE_FIREBASE_APP_ID"

echo ""
echo "✅ Docker image built successfully"
echo ""
echo "🌐 Deploying to Cloud Run..."

# Deploy to Cloud Run with runtime environment variables
gcloud run deploy perala \
  --image gcr.io/fast-planet-470408-f1/perala:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 4Gi \
  --cpu 2 \
  --timeout 900 \
  --cpu-boost \
  --set-env-vars="DATABASE_URL=sqlite.db" \
  --set-env-vars="NODE_ENV=production" \
  --set-env-vars="FIREBASE_PROJECT_ID=fast-planet-470408-f1" \
  --set-env-vars="FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@fast-planet-470408-f1.iam.gserviceaccount.com" \
  --set-env-vars="FIREBASE_PRIVATE_KEY=$(grep -A 27 'BEGIN PRIVATE KEY' .env | tr '\n' ' ' | sed 's/ $//')" \
  --set-env-vars="GEMINI_API_KEY=$(grep '^GEMINI_API_KEY=' .env | cut -d'=' -f2 | tr -d '"')" \
  --set-env-vars="FYERS_APP_ID=$(grep '^FYERS_APP_ID=' .env | cut -d'=' -f2 | tr -d '"')" \
  --set-env-vars="FYERS_SECRET_KEY=$(grep '^FYERS_SECRET_KEY=' .env | cut -d'=' -f2 | tr -d '"')" \
  --set-env-vars="FYERS_ACCESS_TOKEN=$(grep '^FYERS_ACCESS_TOKEN=' .env | cut -d'=' -f2 | tr -d '"')"

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "🎉 Your application is now live on Cloud Run"
echo "📝 Next steps:"
echo "   1. Visit your Cloud Run URL"
echo "   2. Test Firebase Google Sign-In"
echo "   3. Check browser console for any errors"
echo ""
echo "💡 Troubleshooting:"
echo "   - If Firebase still fails, check Cloud Build logs"
echo "   - Verify build args were passed correctly"
echo "   - Check runtime environment variables on Cloud Run console"
