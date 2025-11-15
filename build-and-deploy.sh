#!/bin/bash
# Build Docker image and deploy to Cloud Run

set -e

PROJECT_ID="fast-planet-470408-f1"
SERVICE_NAME="perala"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest"

echo "🏗️  Step 1: Building Docker image..."
docker build -t ${IMAGE_NAME} -f Dockerfile .

echo "📤 Step 2: Pushing to Google Container Registry..."
docker push ${IMAGE_NAME}

echo "🚀 Step 3: Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
  --image=${IMAGE_NAME} \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --memory=2Gi \
  --cpu=2 \
  --timeout=300

echo "✅ Deployment complete!"
gcloud run services describe ${SERVICE_NAME} --region=us-central1 --format='value(status.url)'
