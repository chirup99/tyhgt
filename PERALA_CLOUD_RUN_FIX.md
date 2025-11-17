# Perfect Cloud Run Deployment Fix for PERALA Server

## Problem
- ✅ Works on Replit VSCode
- ❌ Fails on Cloud Run with "Invalid or expired token"

## Root Cause
Cloud Run instance doesn't have Firebase Admin SDK credentials to verify user tokens.

---

## PERFECT FIX - Step by Step

### Step 1: Get Your Firebase Service Account Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `fast-planet-470408-f1`
3. Click **⚙️ Settings** → **Project Settings**
4. Go to **Service Accounts** tab
5. Click **Generate New Private Key**
6. Download the JSON file

### Step 2: Create Secret in Google Secret Manager

```bash
# Extract the private key from the downloaded JSON file
cat ~/Downloads/fast-planet-*.json | jq -r '.private_key' > /tmp/firebase-key.txt

# Create secret in Google Secret Manager
gcloud secrets create firebase-private-key --data-file=/tmp/firebase-key.txt

# Clean up temporary file
rm /tmp/firebase-key.txt
```

### Step 3: Get Values from Your Service Account JSON

Open the downloaded JSON file and note these values:
```json
{
  "project_id": "fast-planet-470408-f1",
  "client_email": "firebase-adminsdk-xxxxx@fast-planet-470408-f1.iam.gserviceaccount.com"
}
```

### Step 4: Deploy PERALA to Cloud Run

```bash
# Set your values
PROJECT_ID="fast-planet-470408-f1"
CLIENT_EMAIL="firebase-adminsdk-xxxxx@fast-planet-470408-f1.iam.gserviceaccount.com"  # Replace with actual email from JSON

# Build the Docker image
docker build -t gcr.io/fast-planet-470408-f1/perala:latest .

# Push to Google Container Registry
docker push gcr.io/fast-planet-470408-f1/perala:latest

# Deploy with Firebase credentials
gcloud run deploy perala \
  --image gcr.io/fast-planet-470408-f1/perala:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="FIREBASE_PROJECT_ID=${PROJECT_ID},FIREBASE_CLIENT_EMAIL=${CLIENT_EMAIL},NODE_ENV=production" \
  --update-secrets="FIREBASE_PRIVATE_KEY=firebase-private-key:latest"
```

### Step 5: Add Your VITE Environment Variables (Frontend)

If you need the frontend environment variables as well:

```bash
# Load from .env file
source .env

# Deploy with all variables
gcloud run deploy perala \
  --image gcr.io/fast-planet-470408-f1/perala:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="FIREBASE_PROJECT_ID=fast-planet-470408-f1,FIREBASE_CLIENT_EMAIL=${CLIENT_EMAIL},NODE_ENV=production,VITE_FIREBASE_API_KEY=${VITE_FIREBASE_API_KEY},VITE_FIREBASE_AUTH_DOMAIN=${VITE_FIREBASE_AUTH_DOMAIN},VITE_FIREBASE_PROJECT_ID=${VITE_FIREBASE_PROJECT_ID},VITE_FIREBASE_STORAGE_BUCKET=${VITE_FIREBASE_STORAGE_BUCKET},VITE_FIREBASE_MESSAGING_SENDER_ID=${VITE_FIREBASE_MESSAGING_SENDER_ID},VITE_FIREBASE_APP_ID=${VITE_FIREBASE_APP_ID}" \
  --update-secrets="FIREBASE_PRIVATE_KEY=firebase-private-key:latest"
```

---

## Verify It's Working

### Check Cloud Run Logs

```bash
# View recent logs for PERALA
gcloud run services logs read perala --limit 50

# Or filter for Firebase-related logs
gcloud run services logs read perala --limit 100 | grep -i "firebase"
```

### Look for Success Message

You should see:
```
✅ Firebase Admin SDK initialized successfully via environment variables
```

### Test Login

1. Clear browser cache and localStorage
2. Go to your Cloud Run URL (something like `https://perala-xxxxx-uc.a.run.app`)
3. Try to sign up/login
4. Should work without "Invalid or expired token" error!

---

## Quick Deploy Script

Save this as `deploy-perala.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Deploying PERALA to Cloud Run..."

# Load .env file
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Build and push
docker build -t gcr.io/fast-planet-470408-f1/perala:latest .
docker push gcr.io/fast-planet-470408-f1/perala:latest

# Deploy with all environment variables
gcloud run deploy perala \
  --image gcr.io/fast-planet-470408-f1/perala:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID},FIREBASE_CLIENT_EMAIL=${FIREBASE_CLIENT_EMAIL},NODE_ENV=production,VITE_FIREBASE_API_KEY=${VITE_FIREBASE_API_KEY},VITE_FIREBASE_AUTH_DOMAIN=${VITE_FIREBASE_AUTH_DOMAIN},VITE_FIREBASE_PROJECT_ID=${VITE_FIREBASE_PROJECT_ID},VITE_FIREBASE_STORAGE_BUCKET=${VITE_FIREBASE_STORAGE_BUCKET},VITE_FIREBASE_MESSAGING_SENDER_ID=${VITE_FIREBASE_MESSAGING_SENDER_ID},VITE_FIREBASE_APP_ID=${VITE_FIREBASE_APP_ID}" \
  --update-secrets="FIREBASE_PRIVATE_KEY=firebase-private-key:latest"

echo "✅ PERALA deployment complete!"
gcloud run services describe perala --region us-central1 --format="value(status.url)"
```

Make it executable and run:
```bash
chmod +x deploy-perala.sh
./deploy-perala.sh
```

---

## Troubleshooting

### Still Getting 401 Errors?

**Check 1: Verify environment variables are set**
```bash
gcloud run services describe perala --region us-central1 --format="value(spec.template.spec.containers[0].env)"
```

**Check 2: Check if secret is accessible**
```bash
# List all secrets
gcloud secrets list

# Check if firebase-private-key exists
gcloud secrets versions access latest --secret=firebase-private-key
```

**Check 3: Verify service logs**
```bash
gcloud run services logs read perala --limit 100 | grep -E "(Firebase|error|401)"
```

### Update CORS for Cloud Run URL

Get your Cloud Run URL:
```bash
gcloud run services describe perala --region us-central1 --format="value(status.url)"
```

Make sure it's added to `server/index.ts` in the allowed origins list.

---

## Success Indicators

✅ Logs show: `Firebase Admin SDK initialized successfully`  
✅ Login works without "Invalid or expired token"  
✅ User signup creates account properly  
✅ Dashboard loads after login  
✅ Cloud Run URL: `https://perala-xxxxx-uc.a.run.app`

---

## Quick Diagnostic

Run this to check everything:

```bash
echo "=== Checking PERALA deployment ==="
echo "1. Service status:"
gcloud run services describe perala --region us-central1 --format="value(status.conditions)"

echo -e "\n2. Service URL:"
gcloud run services describe perala --region us-central1 --format="value(status.url)"

echo -e "\n3. Recent logs:"
gcloud run services logs read perala --limit 20

echo -e "\n4. Environment variables configured:"
gcloud run services describe perala --region us-central1 --format="value(spec.template.spec.containers[0].env)" | grep FIREBASE
```

---

## What This Fixes

1. **Backend authentication** - Firebase Admin SDK can now verify user tokens
2. **Login/Signup** - Users can authenticate properly
3. **Protected routes** - Backend can validate session tokens
4. **Cloud Run deployment** - Server name is correctly set to "perala"

Now your PERALA server on Cloud Run will work exactly like it does on Replit! 🚀
