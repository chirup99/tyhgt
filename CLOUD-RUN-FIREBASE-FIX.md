# 🔥 Firebase Authentication Fix for Cloud Run

## ⚠️ The Problem

You're seeing this error in Cloud Run:
```
Firebase: Error (auth/api-key-not-valid.-please-pass-a-valid-api-key)
```

**Root Cause:** Vite needs Firebase config at **BUILD TIME**, not runtime. Your current deployment is missing the `--build-arg` flags during Docker build.

## ✅ Solution: Two Approaches

### 🚀 Quick Fix (Less Secure - For Testing Only)

**⚠️ WARNING:** This approach embeds API keys directly in the deployment script. While functional, it's not recommended for production.

**Steps:**
```bash
# 1. Make the script executable
chmod +x deploy-cloudrun-fixed.sh

# 2. Deploy (reads from .env file)
./deploy-cloudrun-fixed.sh
```

**Security Note:** This script reads credentials from `.env` and passes them as build arguments. Anyone with access to the Docker image can extract these values.

---

### 🔒 Secure Approach (Recommended for Production)

Use Google Cloud Secret Manager to store sensitive credentials:

#### Step 1: Store Secrets in Google Cloud

```bash
# Store Firebase secrets
echo -n "$VITE_FIREBASE_API_KEY" | gcloud secrets create firebase-api-key --data-file=-
echo -n "$VITE_FIREBASE_AUTH_DOMAIN" | gcloud secrets create firebase-auth-domain --data-file=-
echo -n "$VITE_FIREBASE_PROJECT_ID" | gcloud secrets create firebase-project-id --data-file=-
echo -n "$VITE_FIREBASE_STORAGE_BUCKET" | gcloud secrets create firebase-storage-bucket --data-file=-
echo -n "$VITE_FIREBASE_MESSAGING_SENDER_ID" | gcloud secrets create firebase-messaging-sender-id --data-file=-
echo -n "$VITE_FIREBASE_APP_ID" | gcloud secrets create firebase-app-id --data-file=-

# Store backend secrets
echo -n "$FIREBASE_PRIVATE_KEY" | gcloud secrets create firebase-private-key --data-file=-
echo -n "$GEMINI_API_KEY" | gcloud secrets create gemini-api-key --data-file=-
```

#### Step 2: Use Cloud Build with Secrets

Update `cloudbuild.yaml` to use Secret Manager:

```yaml
availableSecrets:
  secretManager:
    - versionName: projects/fast-planet-470408-f1/secrets/firebase-api-key/versions/latest
      env: 'VITE_FIREBASE_API_KEY'
    - versionName: projects/fast-planet-470408-f1/secrets/firebase-auth-domain/versions/latest
      env: 'VITE_FIREBASE_AUTH_DOMAIN'
    # ... add all other secrets

steps:
  - name: 'gcr.io/cloud-builders/docker'
    secretEnv: ['VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_AUTH_DOMAIN', ...]
    args:
      - 'build'
      - '--build-arg'
      - 'VITE_FIREBASE_API_KEY=$$VITE_FIREBASE_API_KEY'
      # ... continue with other build args
```

#### Step 3: Deploy with Cloud Build

```bash
gcloud builds submit --config cloudbuild.yaml
```

---

## 📋 Why This Happens

### Vite Build Process

```
┌─────────────┐
│  Vite Build │  ← Needs VITE_* variables HERE
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  dist/index.js  │  ← Firebase config is EMBEDDED in this file
└─────────────────┘
       │
       ▼
┌─────────────┐
│  Cloud Run  │  ← Too late to add Firebase config
└─────────────┘
```

**The Fix:** Pass `VITE_FIREBASE_*` variables as `--build-arg` during `docker build`

---

## 🔍 Verify Your Deployment

After deploying, check if Firebase config is embedded:

```bash
# Get your Cloud Run URL
CLOUD_RUN_URL=$(gcloud run services describe perala --region us-central1 --format 'value(status.url)')

# Check if Firebase config is present
curl -s "$CLOUD_RUN_URL" | grep "VITE_FIREBASE_API_KEY"
```

If you see the API key in the HTML, Firebase is properly configured ✅

---

## 🆘 Troubleshooting

### Still getting "api-key-not-valid" error?

1. **Check build arguments were passed:**
   ```bash
   docker history gcr.io/fast-planet-470408-f1/perala:latest | grep VITE_FIREBASE
   ```

2. **Verify .env file has correct values:**
   ```bash
   cat .env | grep VITE_FIREBASE_API_KEY
   ```

3. **Check the built frontend bundle:**
   ```bash
   # Build locally and inspect
   npm run build
   cat dist/public/index.html | grep "apiKey"
   ```

### Firebase works on VSCode but not Cloud Run?

- ✅ VSCode: Reads `.env` file directly → Works
- ❌ Cloud Run: Needs build args → Broken (unless you fix it)

---

## 📚 Additional Resources

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Cloud Run Secrets](https://cloud.google.com/run/docs/configuring/secrets)
- [Docker Build Arguments](https://docs.docker.com/engine/reference/commandline/build/#build-arg)

---

## ✅ Summary

**For Testing:**
```bash
./deploy-cloudrun-fixed.sh
```

**For Production:**
1. Store secrets in Google Cloud Secret Manager
2. Update cloudbuild.yaml to use secrets
3. Deploy with `gcloud builds submit`

This ensures your Firebase authentication works on Cloud Run! 🎉
