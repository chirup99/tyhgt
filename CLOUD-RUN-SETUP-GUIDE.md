# Cloud Run Setup Guide - Fixed Firebase Authentication

## ✅ Dockerfile Fixed
The Dockerfile has been updated to remove hardcoded secrets. Cloud Run will now inject environment variables at runtime.

## 🔑 Two Types of Configuration Required

### 1️⃣ BUILD Arguments (Required at Docker Build Time)

These must be configured in **Cloud Run's automatic build settings** or **Cloud Build configuration**:

```
VITE_FIREBASE_API_KEY=AIzaSyAg-jCM5IzgosNkdRJ2xQRZfFzl0C7LHZk
VITE_FIREBASE_AUTH_DOMAIN=fast-planet-470408-f1.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=fast-planet-470408-f1
VITE_FIREBASE_STORAGE_BUCKET=fast-planet-470408-f1.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=808950990883
VITE_FIREBASE_APP_ID=1:808950990883:web:1252e6131d1f1c21688996
```

### 2️⃣ RUNTIME Environment Variables (Set in Cloud Run)

Go to: **Cloud Run Console → Service "perala" → Edit & Deploy New Revision → Variables & Secrets**

Add these environment variables:

```
DATABASE_URL=sqlite.db
NODE_ENV=production
FIREBASE_PROJECT_ID=fast-planet-470408-f1
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@fast-planet-470408-f1.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDnZvMmdrrb4R/h
noSQAlrxtusPxFSRvm8AmrN1PBi4h9PZ9R9OkShC20iwe1l0lc3kVqXUtxp5Q/ne
Cxye310H69zn6j9DS0KVVFdOwUlIslvkJIhjkbOA3QfRcjQWPnNrLoLME7tSo9KB
zYiPuyLwXqFXrdiyy04hafj1SvJIpzz5UBWbMzFvnpkxT24oN6Z8DxwLBSN9F/vD
4j4ZOWnh2b4UjSCbO2y0XM2DCJvy0Wh3o+iq17ANI6MkH1lGhAnQ8Gf7xXQpHXpA
E4kbJwjzorP2mHDByKZBtiRtDSLvgh1S5KIVzU6Qh1G9NjtX/I6gEN8g0RrGl6RD
tCa+PAL9AgMBAAECggEACHdnURJ0rsPTX0q7TeuQI++N39NOnCXWuN5wJMtwmhvP
dVY3HDBKbqZy8pC+H/pf1fQSTYXvhYf7qz3xK6I/gfaFbBom0LxUW34CUxgrqWnB
MUfhkkcL8ByQ2H8bBxn82MCTD4rEm/bw0PKnWvQ9Xdm7LH0+BE3/oKWtyAfDH+5Q
s3OVl8GYN6sUicJ/4sZndqz1w3Wg5rJ60C6Oe8dknme0aNEDDii9b8bHHNK5rtaz
dDHaQOMBsq79iSkUqNUVvu9b9mai84AX0e9M4mrCWkE0s56EwpkIiSUAwV42Nwp5
Qxa2Q7hYLobnuIQy0gQMdoDl5QFoSZYfOLJVvMFbDwKBgQD0qEwvrVlVjHvISZX+
yGbKV7R2iEVTfR5+AXHD/cBIUEJARNFJCax/ZsKfi0wnlX6exKv62+3SJO4cKM19
mJN32owbUKoZV7hfSPOyfYgpXh0AODvXElVnoCzaZw1Up3tgkkoCHqPIPKyHOOpO
wJNfLEaNhY3tsmNuG4bIBmKo6wKBgQDyIVU2Fu9Npprrk9KG0Ka3aDE/K03XDA0w
G5UmdU9F7OAOhsmTJpqEsP5aWkKaBvt1xtRLHIUysTS9HL3weNEaMKM6vXEVXyvq
1HwVR7twdcWWMFxz/E5YAPpzbPnIWMkn9B602EvJ0MajybgOlyPhcEOhWdsIdblP
7ItGcA8JtwKBgHvss4qC1/lJS3nMLDn98HMVscdIhzUe708MFEAeTENUw/oh4ZCJ
YeK2fmap/E0goB5zqFlNBU2ofyOsV0oC+s9+1/EODtr/X9iD70y94TZzAWWXFlh+
ZNw0egO2pz32B7yG3Q3tzzAh65Ii9iwlx4AxwRr2R0nbThn7v22aLmc5AoGAC2bC
am+eCRwFQ36MdUix8QT4/K5/Vdb9b/x8g3kWqIZE7qouJ72znPfwojSJ2lLl2F/q
czb+lqp9f0IxN3eY8RDFPujYwFbg7Ifg5+eezebdzPqt/9ArqD0zjefdwy9bGYSH
RaDBwNkR4XiIMDexutXceWaPx9AzT64lyMVSD/UCgYEAssFe+Kpb17NhurZA/BqI
pKkHagJhhuh5Kx2shG6G7OToyG/N1ZmvqeVN2NIdxP5BtZFuNAFMxAqIp1AXQe4+
oMtKDcx6nDgEzZqGuDgoM60e4hyBal6x9tFC69DGdhE3adhabXf9Nh7HgVgyO2S1
ih046qlzSYEeDQD1HVPIsic=
-----END PRIVATE KEY-----
GEMINI_API_KEY=AIzaSyChgTQeVbE8o-AYsQnuSoViWU3Z1IApp94
FYERS_APP_ID=BUXMASTNCH-100
FYERS_SECRET_KEY=TMA74Z9O0Z
FYERS_ACCESS_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOlsiZDoxIiwiZDoyIiwieDowIiwieDoxIiwieDoyIl0sImF0X2hhc2giOiJnQUFBQUFCby13S25JbG4zaXZCc190ZC1sbFZTVlJIWjNQM3hNS2JwbURCbk9RT1FEbk5lLVozV01NREl5WXJJTWRMU1ZWRy1HSktWdEFScTNWMTR5amREOXhkWVpUY1BIMFJwb2lrYmhZT3VXNG44Zk9nOGhwYz0iLCJkaXNwbGF5X25hbWUiOiIiLCJvbXMiOiJLMSIsImhzbV9rZXkiOiIxZGQyN2E3MzRkNmRmYzhlMjEwNDI0ZjYxYTkzZDdiMzc2ZjA4ODczZjUyMWY1YWQxYTIwOTFjZiIsImlzRGRwaUVuYWJsZWQiOiJOIiwiaXNNdGZFbmFibGVkIjoiTiIsImZ5X2lkIjoiWEMwMTA5NCIsImFwcFR5cGUiOjEwMCwiZXhwIjoxNzYxMzUyMjAwLCJpYXQiOjE3NjEyODA2NzksImlzcyI6ImFwaS5meWVycy5pbiIsIm5iZiI6MTc2MTI4MDY3OSwic3ViIjoiYWNjZXNzX3Rva2VuIn0.vt9tRyOQ81vRlirourGk5JcnI1zG5CMFBzZzhVdCoiw
```

⚠️ **Important**: Do NOT set `PORT` - Cloud Run provides this automatically

## 🚀 Deployment Methods

### Method 1: Cloud Run Automatic Deployment (Recommended)

If you're using Cloud Run's automatic deployment from Git repository:

1. **Configure Build Arguments in cloudbuild.yaml**:
   Create or update `cloudbuild.yaml`:

```yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '--build-arg'
      - 'VITE_FIREBASE_API_KEY=$_VITE_FIREBASE_API_KEY'
      - '--build-arg'
      - 'VITE_FIREBASE_AUTH_DOMAIN=$_VITE_FIREBASE_AUTH_DOMAIN'
      - '--build-arg'
      - 'VITE_FIREBASE_PROJECT_ID=$_VITE_FIREBASE_PROJECT_ID'
      - '--build-arg'
      - 'VITE_FIREBASE_STORAGE_BUCKET=$_VITE_FIREBASE_STORAGE_BUCKET'
      - '--build-arg'
      - 'VITE_FIREBASE_MESSAGING_SENDER_ID=$_VITE_FIREBASE_MESSAGING_SENDER_ID'
      - '--build-arg'
      - 'VITE_FIREBASE_APP_ID=$_VITE_FIREBASE_APP_ID'
      - '-t'
      - 'gcr.io/$PROJECT_ID/perala:$COMMIT_SHA'
      - '-t'
      - 'gcr.io/$PROJECT_ID/perala:latest'
      - '.'
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/perala:$COMMIT_SHA']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/perala:latest']
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'perala'
      - '--image'
      - 'gcr.io/$PROJECT_ID/perala:$COMMIT_SHA'
      - '--region'
      - 'us-central1'
      - '--platform'
      - 'managed'
      - '--allow-unauthenticated'

substitutions:
  _VITE_FIREBASE_API_KEY: 'AIzaSyAg-jCM5IzgosNkdRJ2xQRZfFzl0C7LHZk'
  _VITE_FIREBASE_AUTH_DOMAIN: 'fast-planet-470408-f1.firebaseapp.com'
  _VITE_FIREBASE_PROJECT_ID: 'fast-planet-470408-f1'
  _VITE_FIREBASE_STORAGE_BUCKET: 'fast-planet-470408-f1.firebasestorage.app'
  _VITE_FIREBASE_MESSAGING_SENDER_ID: '808950990883'
  _VITE_FIREBASE_APP_ID: '1:808950990883:web:1252e6131d1f1c21688996'

images:
  - 'gcr.io/$PROJECT_ID/perala:$COMMIT_SHA'
  - 'gcr.io/$PROJECT_ID/perala:latest'
```

2. **Push to Cloud Build**:
```bash
gcloud builds submit --config cloudbuild.yaml
```

3. **Set Runtime Environment Variables**:
   - Go to Cloud Run Console
   - Select service "perala"
   - Click "Edit & Deploy New Revision"
   - Add all runtime environment variables from section 2️⃣ above

### Method 2: Manual Build and Deploy

```bash
# Build with Firebase credentials
docker build \
  --build-arg VITE_FIREBASE_API_KEY="AIzaSyAg-jCM5IzgosNkdRJ2xQRZfFzl0C7LHZk" \
  --build-arg VITE_FIREBASE_AUTH_DOMAIN="fast-planet-470408-f1.firebaseapp.com" \
  --build-arg VITE_FIREBASE_PROJECT_ID="fast-planet-470408-f1" \
  --build-arg VITE_FIREBASE_STORAGE_BUCKET="fast-planet-470408-f1.firebasestorage.app" \
  --build-arg VITE_FIREBASE_MESSAGING_SENDER_ID="808950990883" \
  --build-arg VITE_FIREBASE_APP_ID="1:808950990883:web:1252e6131d1f1c21688996" \
  -t gcr.io/fast-planet-470408-f1/perala:latest .

# Push to GCR
docker push gcr.io/fast-planet-470408-f1/perala:latest

# Deploy to Cloud Run
gcloud run deploy perala \
  --image gcr.io/fast-planet-470408-f1/perala:latest \
  --region us-central1 \
  --allow-unauthenticated
```

Then set runtime environment variables in Cloud Run Console.

## ✅ Verification

After deployment:

1. **Check Cloud Build Logs**:
   - Verify build arguments were passed
   - Look for "ARG VITE_FIREBASE_API_KEY" in logs

2. **Check Cloud Run Logs**:
```bash
gcloud run services logs read perala --region us-central1 --limit 50
```

3. **Test Firebase Authentication**:
   - Visit your Cloud Run URL
   - Open browser DevTools (F12)
   - Try Google Sign-In
   - Should work without "api-key-not-valid" error

## 🔍 Troubleshooting

### Error: "auth/api-key-not-valid"
**Cause**: Build arguments weren't passed during Docker build  
**Fix**: Use cloudbuild.yaml or pass --build-arg flags

### Error: "Firebase Admin SDK not initialized"
**Cause**: Runtime environment variables not set  
**Fix**: Set all runtime env vars in Cloud Run Console

### Error: Container startup timeout
**Cause**: Missing environment variables causing server crash  
**Fix**: Ensure all required runtime env vars are set

## 📋 Quick Checklist

- [ ] Updated Dockerfile (removed hardcoded secrets)
- [ ] Created/updated cloudbuild.yaml with build args
- [ ] Set 6 build arguments (VITE_FIREBASE_*)
- [ ] Set 9 runtime environment variables in Cloud Run
- [ ] Did NOT set PORT (Cloud Run provides it)
- [ ] Deployed and tested Firebase authentication
- [ ] Verified logs show no errors

## 🎯 Summary

**The Key Fix**: 
- ✅ VITE_* variables → Build arguments (embedded in client bundle)
- ✅ Backend secrets → Runtime environment variables (injected by Cloud Run)
- ✅ No hardcoded secrets in Dockerfile (security best practice)

This setup allows Cloud Run's automatic deployment to work correctly with Firebase authentication!
