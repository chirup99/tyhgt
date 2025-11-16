#!/bin/bash
# Deploy to Cloud Run using the updated Dockerfile

echo "🚀 Deploying to Cloud Run..."
echo ""
echo "⚠️  WARNING: This Dockerfile contains hardcoded credentials!"
echo "   For production, use ./setup-secrets.sh + ./deploy-secure.sh instead"
echo ""

# Build the Docker image
echo "🔨 Building Docker image..."
docker build -t gcr.io/fast-planet-470408-f1/perala:latest .

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"
echo ""

# Push to Container Registry
echo "📤 Pushing to Google Container Registry..."
docker push gcr.io/fast-planet-470408-f1/perala:latest

if [ $? -ne 0 ]; then
    echo "❌ Push failed!"
    exit 1
fi

echo "✅ Push successful!"
echo ""

# Deploy to Cloud Run
echo "🚢 Deploying to Cloud Run..."
gcloud run deploy perala \
  --image gcr.io/fast-planet-470408-f1/perala:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --max-instances 10 \
  --project fast-planet-470408-f1

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed!"
    exit 1
fi

echo ""
echo "✅ Deployment complete!"
echo "🔐 All environment variables from .env are now in Cloud Run"
echo ""
