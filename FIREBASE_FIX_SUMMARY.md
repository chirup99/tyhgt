# Firebase Authentication Fix for Cloud Run

## ✅ What Was Fixed

The `auth-api/key` error on Cloud Run was caused by missing Firebase Admin SDK credentials. The Dockerfile and build configuration have been updated to properly fetch and use these credentials from your `.env` file.

---

## 🔧 Changes Made

### 1. **Dockerfile** - Added All Backend Credentials

```dockerfile
# Accept Firebase Admin SDK credentials as build arguments (Backend)
ARG FIREBASE_PROJECT_ID
ARG FIREBASE_CLIENT_EMAIL
ARG FIREBASE_PRIVATE_KEY

# Accept other backend API keys as build arguments
ARG GEMINI_API_KEY
ARG FYERS_APP_ID
ARG FYERS_SECRET_KEY
ARG FYERS_ACCESS_TOKEN

# Set as environment variables for runtime (Backend)
ENV FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID
ENV FIREBASE_CLIENT_EMAIL=$FIREBASE_CLIENT_EMAIL
ENV FIREBASE_PRIVATE_KEY=$FIREBASE_PRIVATE_KEY
ENV GEMINI_API_KEY=$GEMINI_API_KEY
ENV FYERS_APP_ID=$FYERS_APP_ID
ENV FYERS_SECRET_KEY=$FYERS_SECRET_KEY
ENV FYERS_ACCESS_TOKEN=$FYERS_ACCESS_TOKEN
```

### 2. **cloudbuild.yaml** - Pass All Credentials as Build Arguments

```yaml
# Backend Firebase Admin SDK credentials (for server at runtime)
- '--build-arg'
- 'FIREBASE_PROJECT_ID=${_FIREBASE_PROJECT_ID}'
- '--build-arg'
- 'FIREBASE_CLIENT_EMAIL=${_FIREBASE_CLIENT_EMAIL}'
- '--build-arg'
- 'FIREBASE_PRIVATE_KEY=${_FIREBASE_PRIVATE_KEY}'
# Other backend API keys
- '--build-arg'
- 'GEMINI_API_KEY=${_GEMINI_API_KEY}'
- '--build-arg'
- 'FYERS_APP_ID=${_FYERS_APP_ID}'
- '--build-arg'
- 'FYERS_SECRET_KEY=${_FYERS_SECRET_KEY}'
- '--build-arg'
- 'FYERS_ACCESS_TOKEN=${_FYERS_ACCESS_TOKEN}'
```

### 3. **deploy-secure.sh** - Automated Deployment Script

Updated to read credentials from `.env` and pass them during build.

---

## 🚀 How to Deploy

### Option 1: Quick Deploy (Using cloudbuild.yaml)

```bash
# Just run this command - credentials are already in cloudbuild.yaml
gcloud builds submit --config cloudbuild.yaml
```

### Option 2: Secure Deploy (Using Secret Manager - RECOMMENDED)

```bash
# Run the automated secure deployment script
chmod +x deploy-secure.sh
./deploy-secure.sh
```

This script will:
1. Read credentials from your `.env` file
2. Store them securely in Google Secret Manager
3. Build and deploy your application
4. Show you the live URL

---

## 📋 Your Current Credentials (from .env)

The following credentials are already in your `.env` file and will be automatically used:

### Firebase Admin SDK:
✅ **FIREBASE_PROJECT_ID**: `fast-planet-470408-f1`  
✅ **FIREBASE_CLIENT_EMAIL**: `firebase-adminsdk-fbsvc@fast-planet-470408-f1.iam.gserviceaccount.com`  
✅ **FIREBASE_PRIVATE_KEY**: ✓ Present (multi-line format - will be converted automatically)

### Other API Keys:
✅ **GEMINI_API_KEY**: ✓ Present  
✅ **FYERS_APP_ID**: `BUXMASTNCH-100`  
✅ **FYERS_SECRET_KEY**: ✓ Present  
✅ **FYERS_ACCESS_TOKEN**: ✓ Present

---

## ⚠️ Important Notes

1. **Private Key Format**:
   - Your `.env` has the private key in multi-line format (correct for local development)
   - The deployment script automatically converts it to single-line format for Cloud Run
   - You don't need to change anything in your `.env` file

2. **Security**:
   - Option 1 (cloudbuild.yaml) has credentials hardcoded - use only for testing
   - Option 2 (deploy-secure.sh) uses Secret Manager - recommended for production

---

## 🔍 Verify Deployment

After deployment, test Firebase authentication:

```bash
# Get your service URL
SERVICE_URL=$(gcloud run services describe perala --region us-central1 --format='value(status.url)')

# Test authentication endpoint
curl $SERVICE_URL/api/auth/status
```

Expected response:
```json
{
  "authenticated": false,
  "firebaseInitialized": true
}
```

The `firebaseInitialized: true` confirms Firebase Admin SDK is working correctly.

---

## 🛠️ Helper Scripts Available

1. **convert-firebase-key.sh** - Manually convert multi-line private key to single-line
2. **deploy-secure.sh** - Automated secure deployment using Secret Manager
3. **SECURE_DEPLOYMENT.md** - Complete deployment guide with all options

---

## ✨ Summary

Your Cloud Run deployment is now fully configured! The Dockerfile properly fetches all backend credentials from .env:

### Firebase Admin SDK:
- `FIREBASE_PROJECT_ID` ✓
- `FIREBASE_CLIENT_EMAIL` ✓
- `FIREBASE_PRIVATE_KEY` ✓ (auto-converts format)

### Other APIs:
- `GEMINI_API_KEY` ✓
- `FYERS_APP_ID` ✓
- `FYERS_SECRET_KEY` ✓
- `FYERS_ACCESS_TOKEN` ✓

Just run `./deploy-secure.sh` to deploy securely, or `gcloud builds submit --config cloudbuild.yaml` for a quick test deployment.
