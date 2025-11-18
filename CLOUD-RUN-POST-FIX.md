# Cloud Run Post Creation Fix - CORS Preflight Blocked

## Problem
Creating posts fails on Cloud Run with "Failed to create post" error, even though login works fine. This is because:

**Root Cause:** Cloud Run's IAM layer blocks unauthenticated OPTIONS preflight requests BEFORE they reach your Express application's CORS handler.

- ✅ **Login works** because it uses GET requests (no preflight)
- ❌ **POST fails** because browsers send OPTIONS preflight first (gets blocked by Cloud Run IAM)

## Your Code is Correct ✅

Your Express app already has perfect CORS handling:
- ✅ OPTIONS handler returns 204 (server/index.ts:136-141)
- ✅ Allows Cloud Run domains (*.run.app)
- ✅ Proper CORS headers set
- ✅ Authentication logic works

**The issue is Cloud Run configuration, not your code.**

---

## Solution 1: Deploy with Allow Unauthenticated (Recommended)

This allows OPTIONS requests to reach your app's CORS handler:

```bash
# Deploy backend with unauthenticated access
gcloud run deploy perala-backend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production

# If already deployed, update IAM policy:
gcloud run services add-iam-policy-binding perala-backend \
  --region=us-central1 \
  --member="allUsers" \
  --role="roles/run.invoker"
```

**Security Note:** This is safe because:
- Your Express app still validates Firebase tokens for POST requests
- Only OPTIONS (preflight) becomes unauthenticated
- Actual POST /api/social-posts still requires authentication (line 5062 in routes.ts)

---

## Solution 2: Use Firebase Hosting (Best for Production)

Route through Firebase Hosting to avoid CORS entirely (same-origin requests):

### Step 1: Update firebase.json
```json
{
  "hosting": {
    "public": "dist/public",
    "rewrites": [
      {
        "source": "/api/**",
        "run": {
          "serviceId": "perala-backend",
          "region": "us-central1"
        }
      },
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

### Step 2: Deploy
```bash
# Deploy backend
gcloud run deploy perala-backend --source . --region us-central1

# Deploy frontend through Firebase Hosting
firebase deploy --only hosting
```

**Benefits:**
- No CORS issues (same domain)
- Better security (Cloud Run can stay authenticated)
- Automatic CDN for frontend
- Firebase Hosting is free

---

## Solution 3: Quick Test (Verify it's a Cloud Run issue)

Test with curl to confirm (bypasses CORS):

```bash
# Test POST directly (should work)
curl -X POST https://perala-808950990883.us-central1.run.app/api/social-posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -d '{"content": "Test post"}' \
  -v

# Test OPTIONS preflight
curl -X OPTIONS https://perala-808950990883.us-central1.run.app/api/social-posts \
  -H "Origin: https://your-frontend.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  -v
```

**Expected Result:**
- If POST works but OPTIONS returns 403 → Confirm it's Cloud Run IAM
- If both work → Issue is elsewhere (check frontend code)

---

## Debugging Steps

### 1. Check Cloud Run Logs
```bash
gcloud run services logs read perala-backend --limit=50
```

Look for:
- Is OPTIONS request reaching your Express app?
- Any 403 errors before hitting your code?

### 2. Check Current Authentication Setting
```bash
gcloud run services describe perala-backend --region us-central1 --format='get(metadata.annotations."run.googleapis.com/ingress")'
```

### 3. Frontend Check
Verify your frontend is sending requests correctly:

```javascript
// Should include Authorization header
fetch('https://perala-808950990883.us-central1.run.app/api/social-posts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${firebaseToken}`  // Must be present
  },
  body: JSON.stringify({ content: 'Test' })
});
```

---

## Recommended Fix Order

1. **Quick Win:** Deploy with `--allow-unauthenticated` (2 minutes)
2. **Test:** Create a post to verify it works
3. **Production:** Migrate to Firebase Hosting rewrites (better long-term)

---

## Why Login Works But Posts Don't

| Feature | Request Type | Preflight? | Cloud Run Behavior |
|---------|-------------|------------|-------------------|
| Login | GET | No | ✅ Works (no preflight needed) |
| Create Post | POST | Yes | ❌ Fails (OPTIONS blocked by IAM) |

GET requests don't trigger CORS preflight, so login works even with authenticated Cloud Run.

---

## Verify Fix

After deploying with `--allow-unauthenticated`, test:

1. Open Neo Feed tab
2. Create a test post
3. Should see success message
4. Check Cloud Run logs to confirm OPTIONS request received

Your code is already production-ready. Just needs the Cloud Run configuration fix! 🚀
