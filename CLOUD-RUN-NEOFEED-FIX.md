# Cloud Run Neo Feed Post Creation & Profile Loading Fix

## 🔴 Problem Summary

On Google Cloud Run deployment:
1. **Post creation fails** with "Failed to create post" error
2. **Profile not loading** in Neo Feed tab
3. **Works fine** on VS Code and Replit local development

## 🎯 Root Causes Identified

### 1. Missing `VITE_API_URL` Environment Variable
The frontend code uses `VITE_API_URL` to construct API endpoints:
```typescript
// client/src/components/post-creation-panel.tsx line 81
const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const fullUrl = `${API_BASE_URL}/api/social-posts`;
```

**Problem**: Without `VITE_API_URL`, the frontend makes requests to `/api/social-posts` (relative URL), which fails when frontend and backend are on different Cloud Run services.

### 2. CORS Preflight Failure
When Cloud Run requires IAM authentication:
- Browser sends OPTIONS preflight request **WITHOUT** Authorization header
- Cloud Run IAM layer rejects it with 403 **before** your CORS middleware sees it
- POST request never happens

### 3. Missing Firestore IAM Permissions
Cloud Run service account needs `roles/datastore.user` to access Firestore for:
- Verifying user profiles
- Storing posts
- Loading user data

## ✅ Complete Fix Steps

### Step 1: Grant Firestore Access to Cloud Run Service Account

```bash
# Get your project number
gcloud projects describe fast-planet-470408-f1 --format="value(projectNumber)"

# Grant Firestore access (replace PROJECT_NUMBER with actual number)
gcloud projects add-iam-policy-binding fast-planet-470408-f1 \
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/datastore.user"

# Verify the role was added
gcloud projects get-iam-policy fast-planet-470408-f1 \
  --flatten="bindings[].members" \
  --filter="bindings.members:compute" \
  --format="table(bindings.role)"
```

**Expected output should include:** `roles/datastore.user`

### Step 2: Deploy Cloud Run with Unauthenticated Access

Your Cloud Run service **MUST** be deployed with `--allow-unauthenticated` flag:

```bash
gcloud run deploy perala \
  --image gcr.io/fast-planet-470408-f1/perala:latest \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 4Gi \
  --cpu 2 \
  --timeout 900 \
  --cpu-boost
```

**Why?** 
- Cloud Run with IAM auth blocks OPTIONS requests (no auth header)
- Your app handles authentication via Firebase ID tokens instead
- Security is maintained through Firebase token verification in code

### Step 3: Add VITE_API_URL to Build Arguments

If you have **separate** frontend and backend Cloud Run services:

```bash
# Build frontend with backend URL
gcloud builds submit --tag gcr.io/fast-planet-470408-f1/perala \
  --build-arg VITE_API_URL="https://your-backend-service-xxxxx.run.app" \
  --build-arg VITE_FIREBASE_API_KEY="AIzaSyAg-jCM5IzgosNkdRJ2xQRZfFzl0C7LHZk" \
  --build-arg VITE_FIREBASE_AUTH_DOMAIN="fast-planet-470408-f1.firebaseapp.com" \
  --build-arg VITE_FIREBASE_PROJECT_ID="fast-planet-470408-f1" \
  --build-arg VITE_FIREBASE_STORAGE_BUCKET="fast-planet-470408-f1.firebasestorage.app" \
  --build-arg VITE_FIREBASE_MESSAGING_SENDER_ID="808950990883" \
  --build-arg VITE_FIREBASE_APP_ID="1:808950990883:web:1252e6131d1f1c21688996"
```

**If using a single service** (backend + frontend together), leave `VITE_API_URL` **empty** or **omit it** - the frontend will use relative URLs which is correct.

### Step 4: Verify CORS Configuration

Your `server/index.ts` already has correct CORS handling (lines 76-144):
- ✅ Allows Cloud Run domains (`*.run.app`)
- ✅ Handles OPTIONS preflight requests
- ✅ Returns proper CORS headers

**No changes needed here!**

### Step 5: Update Environment Variables Documentation

Add to `.env.example`:
```bash
# Cloud Run Configuration
# Only needed if frontend and backend are separate Cloud Run services
# Leave empty for single-service deployment
VITE_API_URL=""
```

Add to `CLOUDRUN-ENVIRONMENT-VARIABLES.md` build arguments section:
```markdown
### Optional: VITE_API_URL
--build-arg VITE_API_URL="https://your-backend-xxxxx.run.app"

**When to use:**
- Separate frontend and backend Cloud Run services: Set to backend URL
- Single service (frontend + backend together): Leave empty or omit
```

## 🧪 Testing the Fix

### Test 1: Check IAM Permissions
```bash
gcloud run services get-iam-policy perala --region us-central1
```

Should show: `allUsers` with `roles/run.invoker`

### Test 2: Test Post Creation
1. Deploy with fixes above
2. Visit your Cloud Run URL
3. Sign in with Google
4. Go to Neo Feed tab
5. Try creating a post
6. Check Cloud Run logs:

```bash
gcloud run services logs read perala --region us-central1 --limit 50
```

**Expected logs:**
```
🚀 [xxxxx] POST /api/social-posts - New post creation request
✅ [xxxxx] Token verified for user: [user_id]
✅ [xxxxx] User profile found: [username] ([displayName])
✅ [xxxxx] User post saved to Firebase with ID: [post_id]
🎉 [xxxxx] Post creation successful!
```

### Test 3: Verify CORS
Open browser DevTools (F12) → Network tab → Try creating a post

**Should see:**
1. OPTIONS request → Status 204
2. POST request → Status 200

**Should NOT see:**
- CORS errors in console
- 403 Forbidden on OPTIONS
- "No 'Access-Control-Allow-Origin' header" errors

## 📋 Checklist

Before deploying:
- [ ] Grant `roles/datastore.user` to Cloud Run service account
- [ ] Deploy with `--allow-unauthenticated` flag
- [ ] Add `VITE_API_URL` build arg (if separate services)
- [ ] Set all runtime environment variables
- [ ] Test post creation
- [ ] Test profile loading
- [ ] Check Cloud Run logs for errors

## 🐛 Troubleshooting

### Error: "Authentication required to create posts"
**Cause:** Firebase token not being sent
**Fix:** Check that user is signed in and `getIdToken()` succeeds

### Error: "Profile not set up"
**Cause:** User profile missing in Firestore `users` collection
**Fix:** Ensure user profile is created on first sign-in

### Error: "Permission denied" in Firestore
**Cause:** Missing IAM permissions
**Fix:** Run Step 1 to grant `roles/datastore.user`

### Error: CORS preflight fails
**Cause:** Cloud Run requires IAM authentication
**Fix:** Deploy with `--allow-unauthenticated` (Step 2)

### Posts still not loading
**Cause:** Frontend calling wrong API URL
**Fix:** Set `VITE_API_URL` correctly in build args (Step 3)

## 📚 Related Files
- `server/index.ts` (lines 76-144) - CORS configuration
- `server/routes.ts` (line 5053) - Post creation endpoint
- `client/src/components/post-creation-panel.tsx` (line 81) - API URL usage
- `CLOUDRUN-ENVIRONMENT-VARIABLES.md` - Full environment setup guide

## 🎯 Summary

The fix requires **3 main actions**:
1. ✅ **IAM Permissions**: Grant Firestore access
2. ✅ **Cloud Run Config**: Deploy with `--allow-unauthenticated`
3. ✅ **Environment Variable**: Set `VITE_API_URL` if needed

All fixes are **backend infrastructure** changes - no code changes required!
