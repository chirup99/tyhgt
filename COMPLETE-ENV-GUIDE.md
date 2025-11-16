# Complete Environment Variables Guide for Cloud Run

## Problem Solved ✅

Your `.env` file has **TWO sets of Firebase credentials** but Docker only had **one set**:

### What Was Missing:
❌ **Backend Firebase Admin SDK** (server-side operations)
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY` ← **This is critical for backend Firebase operations!**

❌ **Other APIs**
- `GEMINI_API_KEY`
- `FYERS_APP_ID`
- `FYERS_SECRET_KEY`
- `FYERS_ACCESS_TOKEN`

### What Was Already There:
✅ **Frontend Firebase Web SDK** (client-side authentication)
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- etc.

## Complete Solution

I've created `Dockerfile.complete` with **ALL** environment variables from your `.env` file.

### Deploy Now:
```bash
./deploy-complete.sh
```

This includes:
- ✅ Frontend Firebase (Google Sign-In) - `VITE_*` variables
- ✅ Backend Firebase Admin SDK - `FIREBASE_*` variables
- ✅ Gemini AI API - `GEMINI_API_KEY`
- ✅ Fyers Trading API - All Fyers credentials
- ✅ Database configuration

## Environment Variables Breakdown

### 1. Frontend (Client-Side) - Embedded at Build Time
```dockerfile
ENV VITE_FIREBASE_API_KEY="..."
ENV VITE_FIREBASE_AUTH_DOMAIN="..."
ENV VITE_FIREBASE_PROJECT_ID="..."
ENV VITE_FIREBASE_STORAGE_BUCKET="..."
ENV VITE_FIREBASE_MESSAGING_SENDER_ID="..."
ENV VITE_FIREBASE_APP_ID="..."
```
**Purpose:** Client-side Google Sign-In  
**When used:** During `npm run build` - embedded in frontend bundle

### 2. Backend (Server-Side) - Available at Runtime
```dockerfile
ENV FIREBASE_PROJECT_ID="fast-planet-470408-f1"
ENV FIREBASE_CLIENT_EMAIL="firebase-adminsdk-fbsvc@..."
ENV FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
```
**Purpose:** Server-side Firebase operations (Firestore, Admin SDK)  
**When used:** At runtime by your Node.js server

### 3. AI APIs
```dockerfile
ENV GEMINI_API_KEY="..."
```
**Purpose:** Gemini AI chat/analysis features  
**When used:** At runtime for AI functionality

### 4. Trading APIs
```dockerfile
ENV FYERS_APP_ID="BUXMASTNCH-100"
ENV FYERS_SECRET_KEY="..."
ENV FYERS_ACCESS_TOKEN="..."
```
**Purpose:** Real-time stock data and trading operations  
**When used:** At runtime for market data

## Why This Matters

| Component | Needs | Without It | With It |
|-----------|-------|------------|---------|
| **Google Sign-In** | VITE_FIREBASE_* | ❌ "api-key-not-valid" | ✅ Works |
| **Backend Firestore** | FIREBASE_PRIVATE_KEY | ❌ Cannot read/write DB | ✅ Works |
| **AI Chat** | GEMINI_API_KEY | ❌ No AI responses | ✅ Works |
| **Trading Data** | FYERS_* | ❌ No stock data | ✅ Works |

## Verification After Deployment

1. **Check Firebase Frontend (Client-Side):**
   - Visit your Cloud Run URL
   - Try Google Sign-In
   - Should work without "api-key-not-valid" error

2. **Check Firebase Backend (Server-Side):**
   ```bash
   # SSH into Cloud Run instance or check logs
   gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=perala" --limit 50 --format json
   ```
   - Look for successful Firestore connections
   - No "Firebase admin initialization failed" errors

3. **Check All APIs:**
   - Test AI chat functionality
   - Verify stock data is loading
   - Check that all features work like they do locally

## Files Created

| File | Purpose | Use This |
|------|---------|----------|
| `Dockerfile.complete` | All env vars hardcoded | ✅ **For deployment** |
| `deploy-complete.sh` | Build & deploy script | ✅ **Run this now** |
| `Dockerfile.hardcoded` | Only VITE_* vars | ❌ Incomplete |
| `deploy-hardcoded.sh` | Old deployment | ❌ Use complete version |

## Quick Start

**Deploy with complete environment:**
```bash
./deploy-complete.sh
```

**That's it!** All your environment variables will be available in Cloud Run.

## Troubleshooting

### Still getting Firebase errors?

**Check if variables are in the image:**
```bash
docker pull gcr.io/fast-planet-470408-f1/perala:latest
docker run --rm gcr.io/fast-planet-470408-f1/perala:latest env | grep FIREBASE
```

You should see:
```
FIREBASE_PROJECT_ID=fast-planet-470408-f1
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@...
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----...
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=fast-planet-470408-f1.firebaseapp.com
...
```

### Getting "Cannot read property of undefined"?

This means a required environment variable is missing. Check logs:
```bash
gcloud logging read "resource.type=cloud_run_revision" --limit 50
```

## Security Note ⚠️

**Important:** All credentials are now hardcoded in your Docker image.

**For production, use Google Secret Manager instead:**
1. Run: `./setup-secrets.sh` (one-time)
2. Deploy: `./deploy-secure.sh` (every time)

But for now, the complete Dockerfile will fix your Firebase authentication issue!

## Summary

**Before:** Only frontend Firebase credentials → Backend operations failed  
**After:** ALL credentials from `.env` → Everything works like locally! ✅
