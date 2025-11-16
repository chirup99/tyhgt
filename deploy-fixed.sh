#!/bin/bash
# Deploy to Google Cloud Run, correctly passing build-time arguments for Firebase.
set -e

# Load environment variables from .env file
if [ ! -f .env ]; then
  echo "Error: .env file not found."
  exit 1
fi
set -o allexport
source .env
set +o allexport

# --- Your variables ---
PROJECT_ID="fast-planet-470408-f1"
SERVICE_NAME="perala"
REGION="us-central1"

# Create a comma-separated list of substitutions for the Cloud Build process.
# These are the variables your `cloudbuild.yaml` expects.
SUBSTITUTIONS=""
SUBSTITUTIONS+="_VITE_FIREBASE_API_KEY=${VITE_FIREBASE_API_KEY},"
SUBSTITUTIONS+="_VITE_FIREBASE_AUTH_DOMAIN=${VITE_FIREBASE_AUTH_DOMAIN},"
SUBSTITUTIONS+="_VITE_FIREBASE_PROJECT_ID=${VITE_FIREBASE_PROJECT_ID},"
SUBSTITUTIONS+="_VITE_FIREBASE_STORAGE_BUCKET=${VITE_FIREBASE_STORAGE_BUCKET},"
SUBSTITUTIONS+="_VITE_FIREBASE_MESSAGING_SENDER_ID=${VITE_FIREBASE_MESSAGING_SENDER_ID},"
SUBSTITUTIONS+="_VITE_FIREBASE_APP_ID=${VITE_FIREBASE_APP_ID},"
# Also include backend variables if they are used in the build
SUBSTITUTIONS+="_FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID},"
SUBSTITUTIONS+="_FIREBASE_CLIENT_EMAIL=${FIREBASE_CLIENT_EMAIL},"
# The private key needs special handling for newlines
SUBSTITUTIONS+="_FIREBASE_PRIVATE_KEY=${FIREBASE_PRIVATE_KEY},"
SUBSTITUTIONS+="_GEMINI_API_KEY=${GEMINI_API_KEY},"
SUBSTITUTIONS+="_FYERS_APP_ID=${FYERS_APP_ID},"
SUBSTITUTIONS+="_FYERS_SECRET_KEY=${FYERS_SECRET_KEY},"
SUBSTITUTIONS+="_FYERS_ACCESS_TOKEN=${FYERS_ACCESS_TOKEN}"

echo "🚀 Starting secure deployment to Cloud Run..."

# Deploy using `gcloud run deploy` with the --source flag.
# The --substitutions flag will pass the variables to the underlying Cloud Build process.
gcloud run deploy $SERVICE_NAME \
  --source . \
  --region=$REGION \
  --platform=managed \
  --allow-unauthenticated \
  --project=$PROJECT_ID \
  --substitutions="$SUBSTITUTIONS"

echo "✅ Deployment submitted. Check the Google Cloud Console for status."
