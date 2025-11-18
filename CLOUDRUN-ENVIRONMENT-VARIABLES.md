# Cloud Run Environment Variables Guide

## 🔴 CRITICAL: Two Types of Variables

### 1️⃣ BUILD-TIME Arguments (Pass during Docker build)
These MUST be passed as `--build-arg` when building the Docker image:

```bash
# Required: Firebase configuration
--build-arg VITE_FIREBASE_API_KEY="AIzaSyAg-jCM5IzgosNkdRJ2xQRZfFzl0C7LHZk"
--build-arg VITE_FIREBASE_AUTH_DOMAIN="fast-planet-470408-f1.firebaseapp.com"
--build-arg VITE_FIREBASE_PROJECT_ID="fast-planet-470408-f1"
--build-arg VITE_FIREBASE_STORAGE_BUCKET="fast-planet-470408-f1.firebasestorage.app"
--build-arg VITE_FIREBASE_MESSAGING_SENDER_ID="808950990883"
--build-arg VITE_FIREBASE_APP_ID="1:808950990883:web:1252e6131d1f1c21688996"

# Optional: API URL (only if frontend and backend are separate services)
--build-arg VITE_API_URL="https://your-backend-xxxxx.run.app"
```

**Why?** Vite embeds these into the client bundle during `npm run build`. Setting them as runtime env vars won't work.

**VITE_API_URL Usage:**
- **Separate services** (frontend + backend on different Cloud Run services): Set to backend URL
- **Single service** (frontend + backend together): Leave empty or omit entirely - frontend will use relative URLs

### 2️⃣ RUNTIME Environment Variables (Set on Cloud Run)
Set these in Cloud Run Console or via gcloud:

```bash
# Database
DATABASE_URL=sqlite.db

# Environment
NODE_ENV=production

# Firebase Admin SDK (Backend only)
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

# Gemini AI
GEMINI_API_KEY=AIzaSyChgTQeVbE8o-AYsQnuSoViWU3Z1IApp94

# Fyers Trading API
FYERS_APP_ID=BUXMASTNCH-100
FYERS_SECRET_KEY=TMA74Z9O0Z
FYERS_ACCESS_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOlsiZDoxIiwiZDoyIiwieDowIiwieDoxIiwieDoyIl0sImF0X2hhc2giOiJnQUFBQUFCby13S25JbG4zaXZCc190ZC1sbFZTVlJIWjNQM3hNS2JwbURCbk9RT1FEbk5lLVozV01NREl5WXJJTWRMU1ZWRy1HSktWdEFScTNWMTR5amREOXhkWVpUY1BIMFJwb2lrYmhZT3VXNG44Zk9nOGhwYz0iLCJkaXNwbGF5X25hbWUiOiIiLCJvbXMiOiJLMSIsImhzbV9rZXkiOiIxZGQyN2E3MzRkNmRmYzhlMjEwNDI0ZjYxYTkzZDdiMzc2ZjA4ODczZjUyMWY1YWQxYTIwOTFjZiIsImlzRGRwaUVuYWJsZWQiOiJOIiwiaXNNdGZFbmFibGVkIjoiTiIsImZ5X2lkIjoiWEMwMTA5NCIsImFwcFR5cGUiOjEwMCwiZXhwIjoxNzYxMzUyMjAwLCJpYXQiOjE3NjEyODA2NzksImlzcyI6ImFwaS5meWVycy5pbiIsIm5iZiI6MTc2MTI4MDY3OSwic3ViIjoiYWNjZXNzX3Rva2VuIn0.vt9tRyOQ81vRlirourGk5JcnI1zG5CMFBzZzhVdCoiw
```

## 📋 Complete Checklist

### ✅ Build Arguments (6 required + 1 optional)
- [ ] VITE_FIREBASE_API_KEY (required)
- [ ] VITE_FIREBASE_AUTH_DOMAIN (required)
- [ ] VITE_FIREBASE_PROJECT_ID (required)
- [ ] VITE_FIREBASE_STORAGE_BUCKET (required)
- [ ] VITE_FIREBASE_MESSAGING_SENDER_ID (required)
- [ ] VITE_FIREBASE_APP_ID (required)
- [ ] VITE_API_URL (optional - only for separate frontend/backend services)

### ✅ Runtime Environment Variables (11 total)
- [ ] DATABASE_URL
- [ ] NODE_ENV
- [ ] FIREBASE_PROJECT_ID
- [ ] FIREBASE_CLIENT_EMAIL
- [ ] FIREBASE_PRIVATE_KEY
- [ ] GEMINI_API_KEY
- [ ] FYERS_APP_ID
- [ ] FYERS_SECRET_KEY
- [ ] FYERS_ACCESS_TOKEN

### ❌ DO NOT SET
- ❌ PORT (Cloud Run sets this automatically)

## 🚀 Quick Deploy

### Option 1: Use the Automated Script (Recommended)
```bash
./deploy-cloudrun-complete.sh
```

### Option 2: Manual Deployment

#### Step 1: Build with Firebase credentials
```bash
export $(grep "^VITE_FIREBASE_" .env | xargs)

gcloud builds submit --tag gcr.io/fast-planet-470408-f1/perala \
  --build-arg VITE_FIREBASE_API_KEY="$VITE_FIREBASE_API_KEY" \
  --build-arg VITE_FIREBASE_AUTH_DOMAIN="$VITE_FIREBASE_AUTH_DOMAIN" \
  --build-arg VITE_FIREBASE_PROJECT_ID="$VITE_FIREBASE_PROJECT_ID" \
  --build-arg VITE_FIREBASE_STORAGE_BUCKET="$VITE_FIREBASE_STORAGE_BUCKET" \
  --build-arg VITE_FIREBASE_MESSAGING_SENDER_ID="$VITE_FIREBASE_MESSAGING_SENDER_ID" \
  --build-arg VITE_FIREBASE_APP_ID="$VITE_FIREBASE_APP_ID"
```

#### Step 2: Deploy to Cloud Run
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

#### Step 3: Set Runtime Environment Variables
Go to Cloud Run Console → Select service "perala" → Edit & Deploy New Revision → Variables & Secrets → Add the 11 runtime variables from above.

## 🔍 Verification

After deployment:

1. **Check Cloud Build Logs**
   ```bash
   gcloud builds list --limit 5
   gcloud builds log [BUILD_ID]
   ```
   Look for: "ARG VITE_FIREBASE_API_KEY" in the logs

2. **Check Cloud Run Logs**
   ```bash
   gcloud run services logs read perala --region us-central1
   ```

3. **Test Firebase in Browser**
   - Visit your Cloud Run URL
   - Open DevTools Console (F12)
   - Try Google Sign-In
   - Should see no "api-key-not-valid" errors

## 🐛 Troubleshooting

### Error: "auth/api-key-not-valid"
✅ **Solution**: Build args weren't passed. Use the deployment script.

### Error: "PORT This name is reserved"
✅ **Solution**: Don't set PORT. Cloud Run provides it automatically.

### Firebase showing as "undefined"
✅ **Solution**: VITE_* variables must be build args, not runtime vars.

## 📚 Additional Resources

- See: `FIREBASE-CLOUDRUN-FIX.md` for detailed explanation
- See: `Dockerfile` for build argument configuration
- See: `.env` for your actual credential values
