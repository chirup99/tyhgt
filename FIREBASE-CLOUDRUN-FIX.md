# Firebase Authentication Fix for Google Cloud Run

## Problem
Firebase authentication works locally (VSCode/Replit) but fails on Cloud Run with:
```
Error: auth/api-key-not-valid.-please-pass-a-valid-api-key
```

## Root Cause
Vite requires `VITE_*` environment variables **at BUILD time** (not runtime) to embed them in the client bundle. Cloud Run runtime environment variables don't help because Vite strips them during the build process.

## Solution

### Option 1: Use the New Deployment Script (Recommended)

1. **Verify your `.env` file has Firebase credentials:**
   ```bash
   cat .env | grep VITE_FIREBASE
   ```
   
   You should see:
   ```
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=fast-planet-470408-f1.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=fast-planet-470408-f1
   VITE_FIREBASE_STORAGE_BUCKET=fast-planet-470408-f1.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=808950990883
   VITE_FIREBASE_APP_ID=1:808950990883:web:...
   ```

2. **Run the new deployment script:**
   ```bash
   ./deploy-with-firebase.sh
   ```

   This script:
   - ✅ Loads Firebase credentials from your `.env` file
   - ✅ Passes them as build arguments to Docker/Cloud Build
   - ✅ Embeds them in the Vite client bundle
   - ✅ Deploys to Cloud Run

### Option 2: Manual Deployment with Build Args

If you prefer manual control:

```bash
# Load .env variables
export $(grep "^VITE_FIREBASE_" .env | xargs)

# Build with Cloud Build
gcloud builds submit \
  --substitutions=\
_VITE_FIREBASE_API_KEY="$VITE_FIREBASE_API_KEY",\
_VITE_FIREBASE_AUTH_DOMAIN="$VITE_FIREBASE_AUTH_DOMAIN",\
_VITE_FIREBASE_PROJECT_ID="$VITE_FIREBASE_PROJECT_ID",\
_VITE_FIREBASE_STORAGE_BUCKET="$VITE_FIREBASE_STORAGE_BUCKET",\
_VITE_FIREBASE_MESSAGING_SENDER_ID="$VITE_FIREBASE_MESSAGING_SENDER_ID",\
_VITE_FIREBASE_APP_ID="$VITE_FIREBASE_APP_ID" \
  --config=cloudbuild.yaml

# Deploy to Cloud Run
gcloud run deploy perala \
  --image gcr.io/fast-planet-470408-f1/perala:latest \
  --region us-central1 \
  --allow-unauthenticated
```

## Verification

After deployment, check if Firebase is working:

1. **Visit your Cloud Run URL**
2. **Open browser console** (F12)
3. **Look for Firebase initialization:**
   ```javascript
   console.log("Firebase config:", {
     apiKey: "AIzaSy...",
     authDomain: "fast-planet-470408-f1.firebaseapp.com",
     ...
   });
   ```

4. **Test Google Sign-In** - it should work without errors

## Security Note

⚠️ **IMPORTANT:** Your `.env` file contains sensitive credentials. 

**Already protected by `.gitignore`:**
```
.env
.env.local
.env.production
```

**Never commit `.env` to version control!**

## Why This Happens

| Environment | How Vite Gets Config | Works? |
|-------------|---------------------|--------|
| **Local (VSCode/Replit)** | Reads `.env` file directly during `npm run dev` | ✅ Yes |
| **Cloud Run (Wrong)** | Runtime env vars set AFTER build | ❌ No |
| **Cloud Run (Correct)** | Build args passed DURING `npm run build` | ✅ Yes |

## Troubleshooting

### Still getting API key error?
1. Check Cloud Build logs for substitution values:
   ```bash
   gcloud builds list --limit 5
   gcloud builds log [BUILD_ID]
   ```

2. Verify the built image has Firebase config:
   ```bash
   # Pull the image locally
   docker pull gcr.io/fast-planet-470408-f1/perala:latest
   
   # Check if env vars were baked in
   docker run --rm gcr.io/fast-planet-470408-f1/perala:latest \
     sh -c 'cat dist/client/index.html | grep VITE_FIREBASE'
   ```

### Firebase config showing as "undefined"?
This means the build args weren't passed correctly. Re-run with the new script.

## Files Updated

- ✅ `.env.example` - Added Firebase variables documentation
- ✅ `deploy-with-firebase.sh` - New deployment script with Firebase support
- ✅ `Dockerfile` - Already configured to accept Firebase build args
- ✅ `cloudbuild.yaml` - Already configured with substitution variables

## Next Steps

After successful deployment:
1. Test Google Sign-In functionality
2. Verify Firebase Firestore operations
3. Check that authenticated routes work correctly
