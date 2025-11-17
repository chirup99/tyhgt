# Cloud Run URL Updates Guide for PERALA

After deploying to Cloud Run, you need to update URLs in **3 places**.

---

## Step 1: Deploy First to Get Your Cloud Run URL

```bash
# Run the complete deployment script
./deploy-perala-complete.sh

# Get your Cloud Run URL
gcloud run services describe perala --region us-central1 --format="value(status.url)"
```

Your URL will look like: `https://perala-xxxxx-uc.a.run.app`

---

## Step 2: Update CORS in Backend (server/index.ts)

**File:** `server/index.ts` (around line 68-72)

**Current:**
```typescript
const allowedOrigins = [
  'https://fast-planet-470408-f1.web.app',
  'https://fast-planet-470408-f1.firebaseapp.com',
  process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : null,
].filter(Boolean);
```

**Update to:**
```typescript
const allowedOrigins = [
  'https://fast-planet-470408-f1.web.app',
  'https://fast-planet-470408-f1.firebaseapp.com',
  'https://perala-xxxxx-uc.a.run.app',  // ← Add your actual Cloud Run URL here
  process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : null,
].filter(Boolean);
```

---

## Step 3: Update Firebase Authorized Domains

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `fast-planet-470408-f1`
3. Go to **Authentication** → **Settings** → **Authorized domains**
4. Click **Add domain**
5. Add your Cloud Run domain: `perala-xxxxx-uc.a.run.app` (without https://)
6. Click **Add**

This allows Firebase Authentication to work on your Cloud Run URL.

---

## Step 4: Update API Key Restrictions (Optional but Recommended)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: `fast-planet-470408-f1`
3. Go to **APIs & Services** → **Credentials**
4. Find your API key: `AIzaSyAg-jCM5IzgosNkdRJ2xQRZfFzl0C7LHZk`
5. Click **Edit**
6. Under **Website restrictions**, add:
   - `https://perala-xxxxx-uc.a.run.app/*`
   - `https://fast-planet-470408-f1.web.app/*`
   - `https://fast-planet-470408-f1.firebaseapp.com/*`
7. Click **Save**

---

## Complete Deployment Flow

### 1. First Deployment
```bash
# Make sure firebase-private-key secret exists
gcloud secrets create firebase-private-key --data-file=/path/to/key.txt

# Deploy
./deploy-perala-complete.sh
```

### 2. Get Your URL
```bash
PERALA_URL=$(gcloud run services describe perala --region us-central1 --format="value(status.url)")
echo "Your PERALA URL: $PERALA_URL"
```

### 3. Update Backend CORS

Edit `server/index.ts` and add your URL to allowedOrigins.

### 4. Redeploy with Updated CORS
```bash
./deploy-perala-complete.sh
```

### 5. Update Firebase Console

Add your Cloud Run domain to Firebase Authorized Domains (see Step 3 above).

---

## Verification Checklist

After all updates, verify:

✅ **Backend logs show Firebase initialized:**
```bash
gcloud run services logs read perala --limit 50 | grep "Firebase"
```

✅ **CORS is working:**
```bash
curl -I -X OPTIONS \
  -H "Origin: https://perala-xxxxx-uc.a.run.app" \
  -H "Access-Control-Request-Method: POST" \
  https://perala-xxxxx-uc.a.run.app/api/status
```

✅ **Login works:**
- Open your Cloud Run URL in browser
- Try to sign up / log in
- Should work without errors

---

## Troubleshooting

### Error: "auth/api-key-not-valid"

**Cause:** API key not enabled or domain not authorized

**Fix:**
1. Check Firebase Authorized Domains (Step 3)
2. Check API key restrictions (Step 4)
3. Verify VITE_ variables were passed during build

### Error: "CORS policy: No 'Access-Control-Allow-Origin'"

**Cause:** Your Cloud Run URL not in allowedOrigins

**Fix:**
1. Update `server/index.ts` allowedOrigins (Step 2)
2. Redeploy

### Error: "Invalid or expired token"

**Cause:** Backend Firebase Admin SDK not initialized

**Fix:**
1. Verify firebase-private-key secret exists:
   ```bash
   gcloud secrets versions access latest --secret=firebase-private-key
   ```
2. Check deployment has the secret:
   ```bash
   gcloud run services describe perala --region us-central1
   ```

---

## Quick Reference

**Your Firebase Project:** `fast-planet-470408-f1`

**Required URLs to Add:**
- Backend CORS: `server/index.ts` line 68-72
- Firebase Console: Authentication → Authorized domains
- Google Cloud Console: APIs → Credentials → API restrictions

**Deployment Command:**
```bash
./deploy-perala-complete.sh
```

**Check Logs:**
```bash
gcloud run services logs read perala --limit 50
```

**Get URL:**
```bash
gcloud run services describe perala --region us-central1 --format="value(status.url)"
```

---

## Success! 🎉

Once all URLs are updated:
- ✅ Login works on Cloud Run
- ✅ No CORS errors
- ✅ No "Invalid API key" errors
- ✅ Backend can verify tokens
- ✅ Full authentication flow works

Your PERALA server is now live on Cloud Run!
