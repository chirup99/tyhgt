#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Define variables
PROJECT_ID="fast-planet-470408-f1"
SERVICE_NAME="perala"
REGION="us-central1"

# Securely build the container image using Cloud Build
echo "🚀 Submitting secure build to Cloud Build with all required env vars..."

gcloud builds submit . --config=cloudbuild.yaml --project=$PROJECT_ID \
  --substitutions=_VITE_FIREBASE_API_KEY="AIzaSyAg-jCM5IzgosNkdRJ2xQRZfFzl0C7LHZk",_VITE_FIREBASE_AUTH_DOMAIN="fast-planet-470408-f1.firebaseapp.com",_VITE_FIREBASE_PROJECT_ID="fast-planet-470408-f1",_VITE_FIREBASE_STORAGE_BUCKET="fast-planet-470408-f1.firebasestorage.app",_VITE_FIREBASE_MESSAGING_SENDER_ID="808950990883",_VITE_FIREBASE_APP_ID="1:808950990883:web:1252e6131d1f1c21688996"

# Get the latest image URI from the build
IMAGE_URI=$(gcloud artifacts docker images list "gcr.io/$PROJECT_ID/$SERVICE_NAME" --sort-by=~CREATE_TIME --limit=1 --format='value(format("{0}:{1}", package, tags[0]))')

# Deploy to Cloud Run, setting both secrets and environment variables
echo "🚀 Deploying to Cloud Run with all secrets and environment variables..."

gcloud run deploy $SERVICE_NAME \
  --image=$IMAGE_URI \
  --platform=managed \
  --region=$REGION \
  --project=$PROJECT_ID \
  --allow-unauthenticated \
  --update-env-vars="DATABASE_URL=postgresql://postgres:1011@localhost:5432/trading_db,PGHOST=localhost,PGPORT=5432,PGUSER=postgres,PGPASSWORD=1011,PGDATABASE=trading_db,FIREBASE_PROJECT_ID=fast-planet-470408-f1,FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@fast-planet-470408-f1.iam.gserviceaccount.com" \
  --set-secrets="FIREBASE_PRIVATE_KEY=FIREBASE_PRIVATE_KEY:latest,GEMINI_API_KEY=GEMINI_API_KEY:latest,FYERS_APP_ID=FYERS_APP_ID:latest,FYERS_SECRET_KEY=FYERS_SECRET_KEY:latest,FYERS_ACCESS_TOKEN=FYERS_ACCESS_TOKEN:latest" \
  --quiet

echo "✅ Deployment complete!"
