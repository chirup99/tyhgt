# Quick Fix: Firebase "auth/api-key-not-valid" Error on Cloud Run

## The Problem

VITE_ environment variables are NOT being embedded into your frontend build because they need to be passed **during Docker build**, not at runtime.

## The Solution

Use the verified deployment script that properly passes all VITE_ variables during build.

---

## Option 1: Use the Verified Script (Easiest)

```bash
# Just run this
./deploy-perala-verified.sh
```

This script:
✅ Verifies all VITE_ variables exist
✅ Passes them as build arguments to Docker
✅ Shows what's being used (for debugging)
✅ Deploys to Cloud Run with backend credentials

---

## Option 2: Manual Deployment (If Script Fails)

### Step 1: Verify Your .env File

```bash
# Check if VITE_ variables are present
cat .env | grep VITE_FIREBASE
```

You should see:
```
VITE_FIREBASE_API_KEY="AIzaSyAg-jCM5IzgosNkdRJ2xQRZfFzl0C7LHZk"
VITE_FIREBASE_AUTH_DOMAIN="fast-planet-470408-f1.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="fast-planet-470408-f1"
VITE_FIREBASE_STORAGE_BUCKET="fast-planet-470408-f1.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="808950990883"
VITE_FIREBASE_APP_ID="1:808950990883:web:1252e6131d1f1c21688996"
```

### Step 2: Load Variables

```bash
# Load all .env variables
export $(cat .env | grep -v '^#' | xargs)

# Verify they're loaded
echo $VITE_FIREBASE_API_KEY
```

Should print: `AIzaSyAg-jCM5IzgosNkdRJ2xQRZfFzl0C7LHZk`

### Step 3: Build Docker Image with Variables

```bash
# Build with VITE_ variables embedded
docker build \
  --build-arg VITE_FIREBASE_API_KEY="$VITE_FIREBASE_API_KEY" \
  --build-arg VITE_FIREBASE_AUTH_DOMAIN="$VITE_FIREBASE_AUTH_DOMAIN" \
  --build-arg VITE_FIREBASE_PROJECT_ID="$VITE_FIREBASE_PROJECT_ID" \
  --build-arg VITE_FIREBASE_STORAGE_BUCKET="$VITE_FIREBASE_STORAGE_BUCKET" \
  --build-arg VITE_FIREBASE_MESSAGING_SENDER_ID="$VITE_FIREBASE_MESSAGING_SENDER_ID" \
  --build-arg VITE_FIREBASE_APP_ID="$VITE_FIREBASE_APP_ID" \
  -t gcr.io/fast-planet-470408-f1/perala:latest .
```

### Step 4: Push to Registry

```bash
docker push gcr.io/fast-planet-470408-f1/perala:latest
```

### Step 5: Deploy to Cloud Run

```bash
gcloud run deploy perala \
  --image gcr.io/fast-planet-470408-f1/perala:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars="FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID},FIREBASE_CLIENT_EMAIL=${FIREBASE_CLIENT_EMAIL},NODE_ENV=production" \
  --update-secrets="FIREBASE_PRIVATE_KEY=firebase-private-key:latest"
```

### Step 6: Get Your URL and Test

```bash
gcloud run services describe perala --region us-central1 --format="value(status.url)"
```

---

## Why This Happens

### How Vite Works

**Frontend (VITE_*) variables:**
- Embedded into JavaScript at **BUILD TIME**
- Become part of the compiled frontend code
- Cannot be changed after build
- Need `--build-arg` in Docker

**Backend (FIREBASE_*) variables:**
- Read at **RUNTIME**
- Can be passed as Cloud Run env vars or secrets
- Don't need build args

### What Was Wrong Before

```bash
# ❌ WRONG - VITE_ vars not passed during build
docker build -t gcr.io/fast-planet-470408-f1/perala:latest .
# Frontend gets built with undefined API key!

gcloud run deploy perala \
  --set-env-vars="VITE_FIREBASE_API_KEY=xxx"  # ❌ Too late! Build is already done
```

```bash
# ✅ CORRECT - Pass VITE_ vars during build
docker build \
  --build-arg VITE_FIREBASE_API_KEY="$VITE_FIREBASE_API_KEY" \
  -t gcr.io/fast-planet-470408-f1/perala:latest .
# Frontend gets built with actual API key!
```

---

## Verification

### After Deployment, Check Logs

```bash
gcloud run services logs read perala --limit 50 | grep -i firebase
```

Should see:
```
✅ Firebase Admin SDK initialized successfully
```

### Test in Browser

1. Open your Cloud Run URL
2. Open browser DevTools (F12)
3. Go to Console tab
4. Type: `import.meta.env.VITE_FIREBASE_API_KEY`
5. Should show: `"AIzaSyAg-jCM5IzgosNkdRJ2xQRZfFzl0C7LHZk"`

If it shows `undefined`, the build didn't include the variables!

### Check Built JavaScript

You can also inspect the built files:

```bash
# After build completes locally
grep -r "AIzaSyAg-jCM5IzgosNkdRJ2xQRZfFzl0C7LHZk" dist/
```

Should find the API key in the compiled JavaScript files.

---

## Complete Deployment Checklist

Before deploying:

✅ `.env` file exists and has all VITE_ variables
✅ firebase-private-key secret exists in Google Secret Manager
✅ OAuth redirect URIs configured in Google Cloud Console
✅ Cloud Run domain added to Firebase Authorized Domains

Deploy:

✅ Run: `./deploy-perala-verified.sh`
✅ Wait for build to complete (3-5 minutes)
✅ Wait for deployment to complete
✅ Get Cloud Run URL

Test:

✅ Open Cloud Run URL in browser
✅ Try to sign in with Google
✅ Should work without "api-key-not-valid" error!

---

## Still Not Working?

### Debug Steps

1. **Verify variables were loaded:**
```bash
export $(cat .env | grep -v '^#' | xargs)
echo "API Key: ${VITE_FIREBASE_API_KEY:0:20}..."
```

2. **Check Dockerfile has ARG declarations:**
```bash
head -15 Dockerfile | grep ARG
```

Should see:
```dockerfile
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
# etc...
```

3. **Rebuild with verbose output:**
```bash
docker build --progress=plain --no-cache \
  --build-arg VITE_FIREBASE_API_KEY="$VITE_FIREBASE_API_KEY" \
  -t gcr.io/fast-planet-470408-f1/perala:latest . 2>&1 | tee build.log
```

Check `build.log` for errors.

4. **Verify the built image:**
```bash
# Run the container locally
docker run -p 8080:8080 gcr.io/fast-planet-470408-f1/perala:latest

# Open http://localhost:8080 and check DevTools console
```

---

## Success!

After proper deployment:
✅ No "auth/api-key-not-valid" error
✅ Google Sign-In works
✅ Users can authenticate
✅ Dashboard loads after login

Your PERALA server is now fully functional on Cloud Run! 🚀
