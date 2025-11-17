# Perfect Cloud Run Deployment Fix for "Invalid or expired token"

## Problem
- ✅ Works on Replit VSCode
- ❌ Fails on Cloud Run with "Invalid or expired token"

## Root Cause
Cloud Run instance doesn't have Firebase Admin SDK credentials to verify user tokens.

---

## PERFECT FIX - Choose One Method

### METHOD 1: Simple Environment Variables (Easiest - Do This First)

#### Step 1: Get Your Firebase Service Account Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `fast-planet-470408-f1`
3. Click **⚙️ Settings** → **Project Settings**
4. Go to **Service Accounts** tab
5. Click **Generate New Private Key**
6. Download the JSON file

#### Step 2: Extract Values from JSON

Open the downloaded JSON file and copy these values:
```json
{
  "project_id": "fast-planet-470408-f1",  ← Copy this
  "client_email": "firebase-adminsdk-xxxxx@fast-planet-470408-f1.iam.gserviceaccount.com",  ← Copy this
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"  ← Copy this
}
```

#### Step 3: Update Your .env File

Add these to your `.env` file:
```env
# Firebase Admin SDK (Backend)
FIREBASE_PROJECT_ID=fast-planet-470408-f1
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@fast-planet-470408-f1.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_FULL_KEY_HERE\n-----END PRIVATE KEY-----\n"

# Firebase Client SDK (Frontend)
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=fast-planet-470408-f1.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=fast-planet-470408-f1
VITE_FIREBASE_STORAGE_BUCKET=fast-planet-470408-f1.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

**IMPORTANT:** The private key must keep the `\n` characters for newlines!

#### Step 4: Deploy to Cloud Run with Environment Variables

```bash
# Build your Docker image
docker build -t gcr.io/fast-planet-470408-f1/trading-platform:latest .

# Push to Google Container Registry
docker push gcr.io/fast-planet-470408-f1/trading-platform:latest

# Deploy with environment variables from .env file
gcloud run deploy trading-platform \
  --image gcr.io/fast-planet-470408-f1/trading-platform:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="$(cat .env | grep -v '^#' | tr '\n' ',' | sed 's/,$//')"
```

#### Step 5: Or Deploy with Individual Env Vars (More Control)

```bash
gcloud run deploy trading-platform \
  --image gcr.io/fast-planet-470408-f1/trading-platform:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="FIREBASE_PROJECT_ID=fast-planet-470408-f1,FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@fast-planet-470408-f1.iam.gserviceaccount.com,NODE_ENV=production" \
  --set-env-vars="VITE_FIREBASE_API_KEY=your-api-key,VITE_FIREBASE_AUTH_DOMAIN=fast-planet-470408-f1.firebaseapp.com,VITE_FIREBASE_PROJECT_ID=fast-planet-470408-f1,VITE_FIREBASE_STORAGE_BUCKET=fast-planet-470408-f1.appspot.com,VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id,VITE_FIREBASE_APP_ID=your-app-id" \
  --update-secrets="FIREBASE_PRIVATE_KEY=firebase-private-key:latest"
```

For the private key, create a secret first:
```bash
# Create the private key as a secret
cat > /tmp/private-key.txt << 'EOF'
-----BEGIN PRIVATE KEY-----
YOUR_FULL_PRIVATE_KEY_HERE
-----END PRIVATE KEY-----
EOF

# Upload to Secret Manager
gcloud secrets create firebase-private-key --data-file=/tmp/private-key.txt

# Clean up
rm /tmp/private-key.txt
```

---

### METHOD 2: Use Service Account (Most Secure)

Instead of manually setting credentials, use Cloud Run's built-in service account:

#### Step 1: Grant Permissions to Cloud Run Service Account

```bash
# Get your Cloud Run service account
PROJECT_ID="fast-planet-470408-f1"
SERVICE_ACCOUNT="${PROJECT_ID}@appspot.gserviceaccount.com"

# Grant Firebase Admin permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/firebase.admin"
```

#### Step 2: Update server/index.ts to Use Default Credentials

Your code already supports this! Just make sure these lines work:

```typescript
} else {
  log('⚠️ Firebase Admin credentials not found in environment variables. Attempting default initialization.');
  try {
    admin.initializeApp();  // ← This uses Cloud Run's service account automatically
    log('✅ Firebase Admin SDK initialized with default application credentials.');
  } catch(e) {
    log('⚠️ Could not initialize Firebase with default credentials.');
  }
}
```

#### Step 3: Deploy WITHOUT Manual Credentials

```bash
# Just deploy - Cloud Run will use its service account
docker build -t gcr.io/fast-planet-470408-f1/trading-platform:latest .
docker push gcr.io/fast-planet-470408-f1/trading-platform:latest

gcloud run deploy trading-platform \
  --image gcr.io/fast-planet-470408-f1/trading-platform:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

---

## Verify It's Working

### Step 1: Check Cloud Run Logs

```bash
# View recent logs
gcloud run services logs read trading-platform --limit 50

# Or in the Cloud Console
# https://console.cloud.google.com/run/detail/us-central1/trading-platform/logs
```

### Step 2: Look for Success Message

You should see:
```
✅ Firebase Admin SDK initialized successfully via environment variables
```

Or:
```
✅ Firebase Admin SDK initialized with default application credentials
```

### Step 3: Test Login

1. Clear browser cache and localStorage
2. Go to your Cloud Run URL
3. Try to sign up/login
4. Should work without "Invalid or expired token" error!

---

## Troubleshooting

### Still Getting 401 Errors?

**Check 1: Verify environment variables are set**
```bash
gcloud run services describe trading-platform --region us-central1 --format="value(spec.template.spec.containers[0].env)"
```

**Check 2: Check logs for initialization errors**
```bash
gcloud run services logs read trading-platform --limit 100 | grep -i firebase
```

**Check 3: Verify CORS settings**

Your Cloud Run URL should be allowed in `server/index.ts`:
```typescript
const allowedOrigins = [
  'https://fast-planet-470408-f1.web.app',
  'https://fast-planet-470408-f1.firebaseapp.com',
  'https://trading-platform-xxxxx-uc.a.run.app',  // ← Add your Cloud Run URL
];
```

### Private Key Format Issues?

The private key must have `\n` for newlines:
```bash
# Correct format:
"-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"

# Wrong format:
"-----BEGIN PRIVATE KEY-----
MIIE...
-----END PRIVATE KEY-----"
```

Fix it:
```bash
# Convert newlines to \n
cat service-account-key.json | jq -r '.private_key' | awk '{printf "%s\\n", $0}'
```

---

## Quick Deploy Script

Save this as `deploy.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Deploying to Cloud Run..."

# Load .env file
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Build and push
docker build -t gcr.io/fast-planet-470408-f1/trading-platform:latest .
docker push gcr.io/fast-planet-470408-f1/trading-platform:latest

# Deploy with all environment variables
gcloud run deploy trading-platform \
  --image gcr.io/fast-planet-470408-f1/trading-platform:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID},FIREBASE_CLIENT_EMAIL=${FIREBASE_CLIENT_EMAIL},NODE_ENV=production,VITE_FIREBASE_API_KEY=${VITE_FIREBASE_API_KEY},VITE_FIREBASE_AUTH_DOMAIN=${VITE_FIREBASE_AUTH_DOMAIN},VITE_FIREBASE_PROJECT_ID=${VITE_FIREBASE_PROJECT_ID},VITE_FIREBASE_STORAGE_BUCKET=${VITE_FIREBASE_STORAGE_BUCKET},VITE_FIREBASE_MESSAGING_SENDER_ID=${VITE_FIREBASE_MESSAGING_SENDER_ID},VITE_FIREBASE_APP_ID=${VITE_FIREBASE_APP_ID}" \
  --update-secrets="FIREBASE_PRIVATE_KEY=firebase-private-key:latest"

echo "✅ Deployment complete!"
```

Make it executable:
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## Success Indicators

✅ Backend logs show: `Firebase Admin SDK initialized successfully`
✅ Login works without "Invalid or expired token"
✅ User signup creates account properly
✅ Dashboard loads after login

---

## Still Need Help?

Run this diagnostic:
```bash
# Check if secrets exist
gcloud secrets list

# Check Cloud Run service configuration
gcloud run services describe trading-platform --region us-central1

# Check recent logs for errors
gcloud run services logs read trading-platform --limit 100
```

Send me the output and I'll help debug further!
