# 🔧 Cloud Run Deployment Fix

## The Problem
Your server was failing to start in Cloud Run because:
1. **252 type errors in server/routes.ts** (non-critical but messy)
2. **Background tasks blocking startup** (WebSocket streaming, news posting)
3. **Missing health check endpoint**
4. **Startup timeout too short** (default 10 seconds)

## ✅ What I Fixed

### 1. Added Health Check Endpoint
```typescript
app.get('/health', (_req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

### 2. Made Background Tasks Non-Blocking
- WebSocket streaming starts AFTER server is ready
- News posting starts AFTER server is ready  
- Both use `setImmediate()` to not block startup
- Both check for credentials before starting
- Server continues even if these fail

### 3. Created Optimized Dockerfile
- `Dockerfile.cloudrun` - Optimized for Cloud Run
- Keeps all dependencies (doesn't prune)
- Adds healthcheck
- 40-second start period for slow startups

### 4. Increased Cloud Run Timeout
- Startup timeout: 15 minutes (900 seconds)
- Memory: 4GB (increased from 2GB)
- CPU boost enabled for faster startup

---

## 🚀 Deploy to Cloud Run (3 Steps)

### **Step 1: Use the New Dockerfile**

```bash
# Deploy using the optimized Dockerfile
./deploy-backend-to-cloudrun.sh
```

### **Step 2: Configure Environment Variables**

Go to Cloud Run console and add ONLY the minimum required variables:

```
NODE_ENV = production
DATABASE_URL = [Your PostgreSQL connection string]
```

**Optional** (add these if you want full functionality):
```
FIREBASE_PROJECT_ID = fast-planet-470408-f1
FIREBASE_CLIENT_EMAIL = [from firebase-service-account.json]
FIREBASE_PRIVATE_KEY = [from firebase-service-account.json]
FYERS_APP_ID = [if you have it]
FYERS_SECRET_KEY = [if you have it]  
FYERS_ACCESS_TOKEN = [if you have it]
GEMINI_API_KEY = [if you have it]
```

### **Step 3: Test**

```bash
# Get your Cloud Run URL
BACKEND_URL=$(gcloud run services describe perala --region=asia-south1 --project=fast-planet-470408-f1 --format='value(status.url)')

# Test health endpoint
curl $BACKEND_URL/health

# Should return:
# {"status":"healthy","timestamp":"2025-11-15T12:30:00.000Z","uptime":45.123}
```

---

## 🔍 Troubleshooting

### If deployment still fails:

1. **Check Cloud Run Logs**:
```bash
gcloud logs tail --project=fast-planet-470408-f1 --limit=50
```

2. **Deploy with minimal config first**:
```bash
# Deploy without ANY environment variables first
gcloud run deploy perala \
  --source . \
  --dockerfile=Dockerfile.cloudrun \
  --region=asia-south1 \
  --allow-unauthenticated \
  --memory=4Gi
```

3. **Add environment variables ONE AT A TIME**:
- Start with just `NODE_ENV=production`
- Test after each addition
- This helps identify which variable causes issues

---

## 📊 Monitoring

```bash
# Watch logs in real-time
gcloud logs tail --follow --project=fast-planet-470408-f1

# Check service status
gcloud run services describe perala --region=asia-south1

# View metrics
gcloud run services list --project=fast-planet-470408-f1
```

---

## ⚡ Quick Deploy Command

```bash
# One-line deploy
gcloud run deploy perala \
  --source . \
  --dockerfile=Dockerfile.cloudrun \
  --region=asia-south1 \
  --project=fast-planet-470408-f1 \
  --allow-unauthenticated \
  --memory=4Gi \
  --timeout=900 \
  --startup-cpu-boost
```

---

## 🎯 Expected Behavior

**After deployment:**
1. Container starts in 30-60 seconds
2. Health endpoint responds at `/health`
3. Server logs show: "serving on port 8080"
4. Background tasks start (if credentials provided)
5. Server stays running even if background tasks fail

**Minimal mode (no credentials):**
- Server starts successfully
- Health endpoint works
- API endpoints work
- Background features skip with warnings

