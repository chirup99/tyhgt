#!/bin/bash

# This is the final, correct, and authoritative script to deploy the application.
# It provides all necessary configuration to the `cloudbuild.yaml` file.

set -e

PROJECT_ID="fast-planet-470408-f1"

echo "🚀 Beginning the final, complete, and correct deployment..."

gcloud builds submit . --config=cloudbuild.yaml --project=$PROJECT_ID \
  --substitutions=_VITE_FIREBASE_API_KEY="AIzaSyAg-jCM5IzgosNkdRJ2xQRZfFzl0C7LHZk",_VITE_FIREBASE_AUTH_DOMAIN="fast-planet-470408-f1.firebaseapp.com",_VITE_FIREBASE_PROJECT_ID="fast-planet-470408-f1",_VITE_FIREBASE_STORAGE_BUCKET="fast-planet-470408-f1.firebasestorage.app",_VITE_FIREBASE_MESSAGING_SENDER_ID="808950990883",_VITE_FIREBASE_APP_ID="1:808950990883:web:1252e6131d1f1c21688996",_DATABASE_URL="postgresql://postgres:1011@localhost:5432/trading_db",_FIREBASE_API_KEY="AIzaSyAg-jCM5IzgosNkdRJ2xQRZfFzl0C7LHZk",_FIREBASE_AUTH_DOMAIN="fast-planet-470408-f1.firebaseapp.com",_FIREBASE_PROJECT_ID="fast-planet-470408-f1",_FIREBASE_STORAGE_BUCKET="fast-planet-470408-f1.firebasestorage.app",_FIREBASE_MESSAGING_SENDER_ID="808950990883",_FIREBASE_APP_ID="1:808950990883:web:1252e6131d1f1c21688996",_FIREBASE_CLIENT_EMAIL="firebase-adminsdk-fbsvc@fast-planet-470408-f1.iam.gserviceaccount.com",_GOOGLE_CLOUD_PROJECT_ID="fast-planet-470408-f1",_GOOGLE_CLOUD_CLIENT_EMAIL="firebase-adminsdk-fbsvc@fast-planet-470408-f1.iam.gserviceaccount.com"

echo "✅ Deployment has been successfully submitted to Google Cloud Build."
echo "You can monitor the build and deployment progress in the Google Cloud Console."
