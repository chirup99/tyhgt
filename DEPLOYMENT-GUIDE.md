# 🚀 Production Deployment Guide

## Overview

Your Trading Platform has **two separate deployments**:

1. **Frontend**: Firebase Hosting (`https://fast-planet-470408-f1.web.app`)
2. **Backend**: Google Cloud Run (`https://perala-xxxxx-as.a.run.app`)

Firebase Hosting automatically routes `/api/**` requests to your Cloud Run backend.

---

## 📋 Prerequisites

Before deploying, make sure you have:

- ✅ Google Cloud CLI (`gcloud`) installed and authenticated
- ✅ Firebase CLI installed: `npm install -g firebase-tools`
- ✅ Firebase logged in: `firebase login`
- ✅ All environment variables configured in Cloud Run

---

## 🔐 Step 1: Configure Cloud Run Environment Variables

Your backend needs these environment variables to work:

```bash
# Navigate to Cloud Run in Google Cloud Console
# https://console.cloud.google.com/run?project=fast-planet-470408-f1

# Or use gcloud CLI:
gcloud run services update perala \
  --region=asia-south1 \
  --project=fast-planet-470408-f1 \
  --set-env-vars="PORT=8080" \
  --set-env-vars="NODE_ENV=production" \
  --set-env-vars="DATABASE_URL=your_postgresql_url" \
  --set-env-vars="FIREBASE_PROJECT_ID=fast-planet-470408-f1" \
  --set-env-vars="FIREBASE_CLIENT_EMAIL=your_email" \
  --set-env-vars="FIREBASE_PRIVATE_KEY=your_key" \
  --set-env-vars="GOOGLE_CLOUD_PROJECT_ID=fast-planet-470408-f1" \
  --set-env-vars="GOOGLE_CLOUD_CLIENT_EMAIL=your_email" \
  --set-env-vars="GOOGLE_CLOUD_PRIVATE_KEY=your_key" \
  --set-env-vars="GOOGLE_CLOUD_BACKUP_ENABLED=false" \
  --set-env-vars="FYERS_APP_ID=your_app_id" \
  --set-env-vars="FYERS_SECRET_KEY=your_secret" \
  --set-env-vars="FYERS_ACCESS_TOKEN=your_token" \
  --set-env-vars="GEMINI_API_KEY=your_gemini_key"
```

---

## 🚀 Step 2: Deploy (Automated Script)

Use the automated deployment script:

```bash
# Make the script executable
chmod +x deploy-to-production.sh

# Run deployment
./deploy-to-production.sh
```

This will:
1. Build the frontend (Vite)
2. Deploy frontend to Firebase Hosting
3. Build and deploy backend to Cloud Run

---

## 🔧 Step 3: Manual Deployment (Alternative)

### Deploy Frontend Only:
```bash
npm run build
firebase deploy --only hosting
```

### Deploy Backend Only:
```bash
gcloud run deploy perala \
  --source . \
  --region=asia-south1 \
  --project=fast-planet-470408-f1 \
  --platform=managed \
  --allow-unauthenticated
```

---

## 🌐 How It Works

```
User Browser
     ↓
Firebase Hosting (https://fast-planet-470408-f1.web.app)
     ↓
     ├─→ Static files (HTML, JS, CSS) → Served directly
     └─→ /api/** requests → Proxied to Cloud Run Backend
                                ↓
                    Cloud Run (https://perala-xxxxx-as.a.run.app)
```

### Request Flow:
1. User visits: `https://fast-planet-470408-f1.web.app`
2. Firebase serves the React app (frontend)
3. Frontend makes API call: `/api/market-data`
4. Firebase rewrites to: Cloud Run backend
5. Cloud Run processes request and returns data
6. Frontend displays data to user

---

## ✅ Verification

After deployment, test:

1. **Frontend**: Visit `https://fast-planet-470408-f1.web.app`
2. **Backend Health**: Visit `https://your-cloud-run-url.a.run.app/api/health`
3. **Check Logs**:
   ```bash
   # Cloud Run logs
   gcloud logs tail --project=fast-planet-470408-f1
   
   # Firebase logs
   firebase hosting:channel:deploy preview
   ```

---

## 🐛 Troubleshooting

### Frontend shows "Failed to fetch"
- Check if Cloud Run service is running
- Verify CORS configuration allows Firebase domain
- Check browser console for detailed errors

### Backend returns 5xx errors
- Check Cloud Run environment variables are set
- View logs: `gcloud logs tail --project=fast-planet-470408-f1`
- Ensure database connection string is correct

### "Permission Denied" errors
- Check Cloud Run service account permissions
- Verify Firebase service account has correct roles
- Ensure Cloud Run service allows unauthenticated access (if intended)

---

## 📊 Monitoring

```bash
# View Cloud Run metrics
gcloud run services describe perala --region=asia-south1

# Monitor logs in real-time
gcloud logs tail --follow --project=fast-planet-470408-f1

# Check Firebase usage
firebase projects:list
```

---

## 🔄 Update Deployment

To update after making changes:

```bash
# Quick update (uses automated script)
./deploy-to-production.sh

# Or manually:
npm run build && firebase deploy --only hosting
gcloud run deploy perala --source . --region=asia-south1
```

---

## 💰 Cost Optimization

- Cloud Run: Pay per request (first 2M requests/month free)
- Firebase Hosting: 10GB storage + 360MB/day free
- Set `--min-instances=0` to avoid idle costs
- Consider setting `--max-instances` based on traffic

---

## 📞 Support

If you encounter issues:
1. Check logs: `gcloud logs tail`
2. Verify environment variables in Cloud Run
3. Test backend directly: `curl https://your-backend-url/api/health`
4. Check Firebase Hosting status: https://status.firebase.google.com/

