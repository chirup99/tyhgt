# Cloud Run Deployment Guide

## The Problem
Replit environment doesn't have Docker or gcloud CLI installed by default, so we can't deploy directly from Replit to Google Cloud Run.

## ✅ RECOMMENDED: Deploy from Google Cloud Shell

**This is the easiest method** - Google Cloud Shell has all tools pre-installed and is 100% free!

### Step-by-Step Instructions:

1. **Open Google Cloud Shell**
   - Go to https://console.cloud.google.com
   - Click the Cloud Shell icon `>_` in the top-right corner
   - This opens a terminal with Docker and gcloud pre-installed

2. **Upload Your Code to Cloud Shell**
   
   **Method A - Upload ZIP:**
   - Download your entire Replit project as ZIP
   - In Cloud Shell, click "⋮" (three dots) → "Upload"
   - Upload the ZIP file
   - Extract: `unzip your-project.zip && cd your-project`

   **Method B - Use Git (if you have GitHub setup):**
   ```bash
   git clone <your-github-repo-url>
   cd <your-project-directory>
   ```

3. **Create `.env` File**
   - In Cloud Shell, create the .env file with your secrets:
   ```bash
   nano .env
   ```
   - Paste all your environment variables
   - Press `Ctrl+X`, then `Y`, then `Enter` to save

4. **Deploy Using gcloud (No Docker Needed!)**
   ```bash
   # Make the script executable
   chmod +x deploy-cloudrun-no-docker.sh
   
   # Deploy!
   ./deploy-cloudrun-no-docker.sh
   ```

5. **That's it!** Your app will be deployed in ~3-5 minutes

---

## Alternative: Deploy from Your Local Machine

If you have Docker or gcloud installed on your computer:

### Using gcloud (Recommended):
```bash
./deploy-cloudrun-no-docker.sh
```

### Using Docker:
```bash
./deploy-cloudrun-fixed.sh
```

---

## Advanced: Install gcloud in Replit

**⚠️ Warning:** This requires authentication which can be tricky in a web-based environment.

### Installation:
```bash
./install-gcloud.sh
source ~/.bashrc
```

### Authentication:
```bash
# Option 1: Interactive (may not work well in Replit)
gcloud init

# Option 2: Using service account (recommended for Replit)
# First, create a service account key in Google Cloud Console
# Then upload the JSON key file and run:
gcloud auth activate-service-account --key-file=your-service-account-key.json
gcloud config set project fast-planet-470408-f1
gcloud config set run/region us-central1
```

### Deploy:
```bash
./deploy-cloudrun-no-docker.sh
```

---

## What Each Script Does

### `deploy-cloudrun-no-docker.sh` (Recommended)
- ✅ **No Docker required**
- Uses Google Cloud Buildpacks to build container in the cloud
- Faster deployment
- Reads all variables from `.env` file
- Automatically sets all VITE_* variables at build time
- Deploys with proper Cloud Run configuration

### `deploy-cloudrun-fixed.sh` (Requires Docker)
- ❌ Requires Docker installed locally
- Builds container image locally
- Pushes to Google Container Registry
- Then deploys to Cloud Run

---

## Environment Variables Required

Your `.env` file MUST contain these variables:

### Frontend (VITE_* variables - embedded at build time):
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### Backend Firebase Admin:
```
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
```

### Google Cloud:
```
GOOGLE_CLOUD_PROJECT_ID=...
GOOGLE_CLOUD_CLIENT_EMAIL=...
GOOGLE_CLOUD_PRIVATE_KEY=...
```

### Other:
```
NODE_ENV=production
```

---

## Deployment Configuration

The deployment scripts configure Cloud Run with:
- **Memory:** 2GB
- **CPU:** 2 cores
- **Timeout:** 300 seconds (5 minutes)
- **Max Instances:** 10
- **Port:** 5000
- **Public Access:** Allowed (--allow-unauthenticated)

You can modify these in the deployment scripts if needed.

---

## After Deployment

### View Your App:
```bash
gcloud run services describe perala \
  --project fast-planet-470408-f1 \
  --region us-central1 \
  --format='value(status.url)'
```

### View Logs:
```bash
gcloud run services logs read perala \
  --project fast-planet-470408-f1 \
  --region us-central1 \
  --limit 50
```

### Update Environment Variables:
```bash
gcloud run services update perala \
  --project fast-planet-470408-f1 \
  --region us-central1 \
  --update-env-vars="NEW_VAR=value"
```

---

## Troubleshooting

### "docker: command not found"
→ Use `deploy-cloudrun-no-docker.sh` instead OR deploy from Cloud Shell

### "gcloud: command not found"
→ Install gcloud using `install-gcloud.sh` OR deploy from Cloud Shell

### "Authentication failed"
→ Run `gcloud auth login` to authenticate

### Deployment works but Firebase auth fails
→ Make sure ALL `VITE_FIREBASE_*` variables are set correctly in `.env`
→ The authentication fix we implemented should resolve logout/re-login issues

### Build fails
→ Check that your `package.json` has proper build scripts
→ Verify all dependencies are listed in `package.json`

---

## Why Cloud Shell is Recommended

✅ **Pre-installed tools** - Docker and gcloud ready to use  
✅ **Free** - No cost for Cloud Shell usage  
✅ **Fast** - Direct connection to Google Cloud  
✅ **Secure** - Already authenticated with your Google account  
✅ **Simple** - No installation or configuration needed  

---

## Questions?

- **Cloud Shell tutorial**: https://cloud.google.com/shell/docs/using-cloud-shell
- **Deploy from source**: https://cloud.google.com/run/docs/deploying-source-code
- **Cloud Run docs**: https://cloud.google.com/run/docs

---

**Summary:** Use Google Cloud Shell for the easiest deployment experience! 🚀
