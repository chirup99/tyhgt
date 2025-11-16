# Fix Firebase Error on Cloud Run

## The Problem

You're seeing this error on Cloud Run:
```
Firebase: Error (auth/api-key-not-valid, please pass a valid api key)
```

This happens because the **frontend** Firebase config isn't being embedded into your client JavaScript bundle during the Docker build on Cloud Run.

---

## ✅ Quick Fix - Use the Deployment Script

**Instead of using `gcloud builds submit --config cloudbuild.yaml`**, use the automated script that reads from your `.env` file:

```bash
chmod +x deploy-secure.sh
./deploy-secure.sh
```

This script will:
1. ✅ Read all Firebase credentials from your `.env` file
2. ✅ Pass them as build arguments to Docker
3. ✅ Embed frontend config into the client bundle
4. ✅ Set backend credentials for the server
5. ✅ Deploy to Cloud Run successfully

---

## Why This Happens

### On Replit (Works ✅):
- Vite reads `VITE_FIREBASE_API_KEY` from your `.env` file automatically
- The frontend bundle includes your Firebase config
- Everything works perfectly

### On Cloud Run (Fails ❌):
- Docker builds don't automatically read `.env` files
- Frontend config must be passed as **build arguments** during `npm run build`
- If not passed, the client bundle has no Firebase config
- Result: `auth/api-key-not-valid` error

---

## How the Fix Works

The `deploy-secure.sh` script does this:

```bash
# 1. Read from .env
VITE_FIREBASE_API_KEY=$(grep '^VITE_FIREBASE_API_KEY=' .env | cut -d'=' -f2 | tr -d '"')

# 2. Pass to Docker build
gcloud builds submit \
    --build-arg VITE_FIREBASE_API_KEY="$VITE_FIREBASE_API_KEY" \
    --build-arg VITE_FIREBASE_AUTH_DOMAIN="$VITE_FIREBASE_AUTH_DOMAIN" \
    # ... all other configs
```

The Dockerfile then sets these as ENV variables **before** running `npm run build`, so Vite can embed them into your frontend bundle.

---

## Manual Deployment (If You Prefer)

If you don't want to use the script, deploy manually with all build args:

```bash
PROJECT_ID=$(gcloud config get-value project)

# Read from .env
VITE_API_KEY=$(grep '^VITE_FIREBASE_API_KEY=' .env | cut -d'=' -f2 | tr -d '"')
VITE_AUTH_DOMAIN=$(grep '^VITE_FIREBASE_AUTH_DOMAIN=' .env | cut -d'=' -f2 | tr -d '"')
VITE_PROJECT_ID=$(grep '^VITE_FIREBASE_PROJECT_ID=' .env | cut -d'=' -f2 | tr -d '"')
VITE_STORAGE=$(grep '^VITE_FIREBASE_STORAGE_BUCKET=' .env | cut -d'=' -f2 | tr -d '"')
VITE_SENDER=$(grep '^VITE_FIREBASE_MESSAGING_SENDER_ID=' .env | cut -d'=' -f2 | tr -d '"')
VITE_APP_ID=$(grep '^VITE_FIREBASE_APP_ID=' .env | cut -d'=' -f2 | tr -d '"')

# Build image
gcloud builds submit \
    --tag gcr.io/$PROJECT_ID/perala \
    --build-arg VITE_FIREBASE_API_KEY="$VITE_API_KEY" \
    --build-arg VITE_FIREBASE_AUTH_DOMAIN="$VITE_AUTH_DOMAIN" \
    --build-arg VITE_FIREBASE_PROJECT_ID="$VITE_PROJECT_ID" \
    --build-arg VITE_FIREBASE_STORAGE_BUCKET="$VITE_STORAGE" \
    --build-arg VITE_FIREBASE_MESSAGING_SENDER_ID="$VITE_SENDER" \
    --build-arg VITE_FIREBASE_APP_ID="$VITE_APP_ID"

# Deploy
gcloud run deploy perala \
    --image gcr.io/$PROJECT_ID/perala \
    --region us-central1 \
    --platform managed \
    --allow-unauthenticated
```

---

## Verify After Deployment

```bash
# Get your Cloud Run URL
SERVICE_URL=$(gcloud run services describe perala --region us-central1 --format='value(status.url)')

# Open in browser
echo "Your app: $SERVICE_URL"

# Or test Firebase init
curl $SERVICE_URL/api/auth/status
```

You should see your app load without the Firebase error.

---

## Summary

**Problem**: `cloudbuild.yaml` has hardcoded Firebase config that doesn't match your actual credentials  
**Solution**: Use `./deploy-secure.sh` which reads from your `.env` file  
**Result**: Frontend Firebase config properly embedded in client bundle ✅

Just run `./deploy-secure.sh` and your Cloud Run deployment will work exactly like it does on Replit!
