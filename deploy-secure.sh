#!/bin/bash
# Secure deployment using Secret Manager

echo "🚀 Deploying Perala with secure credentials from Secret Manager..."

# Build with Cloud Build using secrets
gcloud builds submit \
  --config=cloudbuild-secure.yaml \
  --project=fast-planet-470408-f1

# Deploy to Cloud Run
gcloud run deploy perala \
  --image gcr.io/fast-planet-470408-f1/perala:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --max-instances 10 \
  --project=fast-planet-470408-f1

echo "✅ Secure deployment complete!"
