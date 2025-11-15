# 🚀 Deployment Guide: Firebase Hosting + Google Cloud Run

## Problem
Your authentication isn't working on Firebase Hosting because:
- **Firebase Hosting** = Static files only (HTML, CSS, JS)
- **No backend server** = No API endpoints for authentication

## Solution
Deploy your backend separately to **Google Cloud Run**, then connect your Firebase frontend to it.

---

## Prerequisites

1. **Google Cloud account** (same project as Firebase)
2. **gcloud CLI installed**: https://cloud.google.com/sdk/docs/install
3. **Authenticate gcloud**:
   ```bash
   gcloud auth login
   gcloud config set project fast-planet-470408-f1
   ```

---

## Step 1: Deploy Backend to Google Cloud Run

### Option A: Automated Script (Recommended)
```bash
./deploy-cloud-run.sh
```

### Option B: Manual Deployment
```bash
# Deploy backend using Dockerfile
gcloud run deploy trading-platform-backend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --platform managed \
  --memory 2Gi \
  --cpu 2 \
  --max-instances 10
```

**What happens:**
- Cloud Build creates Docker container using the Dockerfile
- Builds **only the backend** (Express server) - not the frontend
- Deploys to Cloud Run with auto-scaling
- Provides HTTPS URL like: `https://trading-platform-backend-xxx.run.app`

**Important Notes:**
- The Dockerfile builds only the backend (server/) to avoid browser dependency issues
- The frontend is deployed separately to Firebase Hosting
- This keeps the Docker container lightweight and optimized for API serving

---

## Step 2: Configure Environment Variables on Cloud Run

Your backend needs these secrets to work:

```bash
gcloud run services update trading-platform-backend \
  --region us-central1 \
  --set-env-vars "NODE_ENV=production,\
GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID,\
GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET,\
GOOGLE_REDIRECT_URI=https://trading-platform-backend-xxx.run.app/api/auth/google/callback,\
FYERS_API_KEY=$FYERS_API_KEY,\
FYERS_SECRET_KEY=$FYERS_SECRET_KEY,\
FYERS_APP_ID=$FYERS_APP_ID,\
GEMINI_API_KEY=$GEMINI_API_KEY,\
DATABASE_URL=$DATABASE_URL,\
SESSION_SECRET=$SESSION_SECRET"
```

**To get your Cloud Run URL:**
```bash
gcloud run services describe trading-platform-backend \
  --region us-central1 \
  --format 'value(status.url)'
```

---

## Step 3: Update Frontend to Use Cloud Run Backend

### A. Update Environment Variables

Create `client/.env.production`:
```env
VITE_API_URL=https://trading-platform-backend-xxx.run.app
```

### B. Update API Client (if needed)

If your frontend doesn't already use environment variables, update `client/src/lib/queryClient.ts`:

```typescript
// Add at the top
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Update apiRequest function
export async function apiRequest(...) {
  const res = await fetch(`${API_BASE_URL}${requestUrl}`, {
    // ... rest of config
  });
}

// Update getQueryFn
const res = await fetch(`${API_BASE_URL}${queryKey.join("/")}`, {
  // ... rest of config
});
```

---

## Step 4: Rebuild and Redeploy Frontend to Firebase

```bash
# Build frontend with production env vars
npm run build

# Deploy to Firebase Hosting
GOOGLE_APPLICATION_CREDENTIALS=firebase-service-account.json firebase deploy --only hosting
```

---

## Step 5: Update Google OAuth Settings

In Google Cloud Console (https://console.cloud.google.com):

1. Go to **APIs & Services** → **Credentials**
2. Click your OAuth 2.0 Client ID
3. Add to **Authorized redirect URIs**:
   ```
   https://trading-platform-backend-xxx.run.app/api/auth/google/callback
   https://fast-planet-470408-f1.web.app/api/auth/google/callback
   ```
4. Add to **Authorized JavaScript origins**:
   ```
   https://fast-planet-470408-f1.web.app
   https://trading-platform-backend-xxx.run.app
   ```

---

## Architecture Overview

```
┌─────────────────────────┐
│  Firebase Hosting       │  ← User visits here
│  (Static Frontend)      │
│  fast-planet-...web.app │
└───────────┬─────────────┘
            │ API calls
            ▼
┌─────────────────────────┐
│  Google Cloud Run       │  ← Backend runs here
│  (Express Backend)      │
│  trading-platform-...   │
│  .run.app               │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Database / Firebase    │
│  External APIs (Fyers)  │
└─────────────────────────┘
```

---

## Testing Your Deployment

1. **Test backend directly:**
   ```bash
   curl https://trading-platform-backend-xxx.run.app/api/health
   ```

2. **Test authentication:**
   - Visit `https://fast-planet-470408-f1.web.app`
   - Click "Sign in with Google"
   - Should redirect to Cloud Run backend for auth

3. **Check logs:**
   ```bash
   gcloud run logs read --service trading-platform-backend --region us-central1
   ```

---

## Cost Estimates

**Google Cloud Run** (per month):
- Free tier: 2M requests, 360K GB-seconds
- After free tier: ~$0.40 per million requests
- Your usage: Likely FREE or <$5/month

**Firebase Hosting**:
- Free tier: 10GB storage, 360MB/day transfer
- Your usage: Likely FREE

---

## Troubleshooting

### "Origin not allowed by CORS"
Update CORS in `server/index.ts`:
```typescript
res.header('Access-Control-Allow-Origin', 'https://fast-planet-470408-f1.web.app');
```

### "Cannot connect to backend"
- Verify VITE_API_URL is set correctly
- Check Cloud Run service is running:
  ```bash
  gcloud run services list
  ```

### "Authentication fails silently"
- Check Cloud Run logs for errors
- Verify all env vars are set on Cloud Run
- Confirm Google OAuth redirect URIs include Cloud Run URL

---

## Quick Commands Reference

```bash
# Deploy backend
./deploy-cloud-run.sh

# Update environment variables
gcloud run services update trading-platform-backend \
  --region us-central1 \
  --set-env-vars "KEY=value"

# View logs
gcloud run logs read --service trading-platform-backend

# Get service URL
gcloud run services describe trading-platform-backend \
  --region us-central1 \
  --format 'value(status.url)'

# Deploy frontend
npm run build && firebase deploy --only hosting
```

---

## Next Steps

1. Run `./deploy-cloud-run.sh` to deploy backend
2. Get the Cloud Run URL from the output
3. Update frontend environment variables with the URL
4. Rebuild and redeploy frontend to Firebase
5. Update Google OAuth settings with new URLs
6. Test authentication on your Firebase site

---

**Need help?** Check Cloud Run logs or contact support.
