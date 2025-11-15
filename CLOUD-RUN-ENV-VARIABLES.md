# 🔐 Cloud Run Environment Variables Configuration

## ⚠️ Important Note:
**DO NOT** set the `PORT` environment variable - Cloud Run provides this automatically!

---

## Required Environment Variables for Cloud Run

Configure these in Google Cloud Console:
https://console.cloud.google.com/run/detail/asia-south1/perala/variables?project=fast-planet-470408-f1

### **Method 1: Using Google Cloud Console (Recommended)**

1. Click "Edit & Deploy New Revision"
2. Go to "Variables & Secrets" tab
3. Add these variables:

```
NODE_ENV = production
DATABASE_URL = [Your PostgreSQL connection string from Replit Secrets]
FIREBASE_PROJECT_ID = fast-planet-470408-f1
FIREBASE_CLIENT_EMAIL = [From firebase-service-account.json file]
FIREBASE_PRIVATE_KEY = [From firebase-service-account.json file - wrap in quotes]
GOOGLE_CLOUD_PROJECT_ID = fast-planet-470408-f1
GOOGLE_CLOUD_CLIENT_EMAIL = [Same as FIREBASE_CLIENT_EMAIL or separate]
GOOGLE_CLOUD_PRIVATE_KEY = [Same as FIREBASE_PRIVATE_KEY or separate - wrap in quotes]
GOOGLE_CLOUD_BACKUP_ENABLED = false
FYERS_APP_ID = [Your Fyers App ID if you have it]
FYERS_SECRET_KEY = [Your Fyers Secret Key if you have it]
FYERS_ACCESS_TOKEN = [Your Fyers Access Token if you have it]
GEMINI_API_KEY = [Your Google Gemini API Key if you have it]
```

4. Click "Deploy"

---

### **Method 2: Using gcloud CLI**

```bash
gcloud run services update perala \
  --region=asia-south1 \
  --project=fast-planet-470408-f1 \
  --set-env-vars="NODE_ENV=production" \
  --set-env-vars="DATABASE_URL=your_postgresql_url" \
  --set-env-vars="FIREBASE_PROJECT_ID=fast-planet-470408-f1" \
  --set-env-vars="FIREBASE_CLIENT_EMAIL=your_email@project.iam.gserviceaccount.com" \
  --set-env-vars="FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----..." \
  --set-env-vars="GOOGLE_CLOUD_PROJECT_ID=fast-planet-470408-f1" \
  --set-env-vars="GOOGLE_CLOUD_CLIENT_EMAIL=your_email@project.iam.gserviceaccount.com" \
  --set-env-vars="GOOGLE_CLOUD_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----..." \
  --set-env-vars="GOOGLE_CLOUD_BACKUP_ENABLED=false" \
  --set-env-vars="FYERS_APP_ID=your_app_id" \
  --set-env-vars="FYERS_SECRET_KEY=your_secret" \
  --set-env-vars="FYERS_ACCESS_TOKEN=your_token" \
  --set-env-vars="GEMINI_API_KEY=your_gemini_key"
```

---

## 📝 How to Get the Values:

### **1. DATABASE_URL**
Copy from your Replit Secrets panel (already configured)

### **2. Firebase Credentials**
Open `firebase-service-account.json` in your project:
```bash
cat firebase-service-account.json
```
Copy:
- `project_id` → FIREBASE_PROJECT_ID
- `client_email` → FIREBASE_CLIENT_EMAIL  
- `private_key` → FIREBASE_PRIVATE_KEY (keep the quotes and \n characters)

### **3. Fyers API (if you have credentials)**
These are your Fyers trading API credentials

### **4. Gemini API (if you have it)**
Your Google Gemini AI API key

---

## ✅ Verification

After setting environment variables:

```bash
# Check if variables are set
gcloud run services describe perala \
  --region=asia-south1 \
  --project=fast-planet-470408-f1 \
  --format="yaml(spec.template.spec.containers[0].env)"
```

---

## 🔒 Security Notes:

- Never commit `.env` files with real credentials
- Use Cloud Run's Secret Manager for sensitive data (optional but recommended)
- FIREBASE_PRIVATE_KEY and GOOGLE_CLOUD_PRIVATE_KEY should be wrapped in quotes
- Cloud Run automatically provides: PORT, K_SERVICE, K_REVISION, K_CONFIGURATION

