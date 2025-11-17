# Fix "Invalid or expired token" on Firebase Deployment

## Problem
Login works on Replit but fails on Firebase deployment with "Invalid or expired token" error.

## Root Cause
Firebase Admin SDK backend credentials are not configured in your Firebase deployment environment.

## Solution

### Step 1: Get Your Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `fast-planet-470408-f1`
3. Click the **gear icon** → **Project Settings**
4. Go to **Service Accounts** tab
5. Click **Generate New Private Key**
6. Download the JSON file (keep it secure!)

### Step 2: Extract the Required Values

Open the downloaded JSON file and extract these values:
- `project_id` → This is your `FIREBASE_PROJECT_ID`
- `client_email` → This is your `FIREBASE_CLIENT_EMAIL`
- `private_key` → This is your `FIREBASE_PRIVATE_KEY`

### Step 3: Configure Firebase Functions Environment

Since you're deploying to Firebase, you have two options:

#### Option A: Using Firebase Functions Config (Recommended)

```bash
# Set the environment variables
firebase functions:config:set \
  firebase.project_id="YOUR_PROJECT_ID" \
  firebase.client_email="YOUR_CLIENT_EMAIL" \
  firebase.private_key="YOUR_PRIVATE_KEY"

# Redeploy
firebase deploy --only functions
```

#### Option B: Using .env File (For Cloud Run or Custom Backend)

Create a `.env` file in your backend:

```env
FIREBASE_PROJECT_ID=fast-planet-470408-f1
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@fast-planet-470408-f1.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

**Important:** The private key must include the newline characters (`\n`).

### Step 4: Update Your Backend Code (If Needed)

Your `server/index.ts` already has the correct initialization code:

```typescript
if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
  const credential = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
  };

  admin.initializeApp({
    credential: admin.credential.cert(credential),
    storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
  });
}
```

### Step 5: Alternative - Use Default Credentials

If you're deploying to **Firebase Functions** or **Cloud Run**, you can simplify this by using default credentials:

```typescript
// This works automatically on Firebase/GCP
admin.initializeApp();
```

No environment variables needed! Firebase automatically provides credentials.

### Step 6: Verify Backend Logs

After deployment, check your Firebase Functions logs:

```bash
firebase functions:log
```

Look for:
- ✅ `Firebase Admin SDK initialized successfully`
- ❌ `Firebase Admin credentials not found`

## Quick Test

After fixing, try logging in again. If you still see errors, check:

1. **Backend logs** - Look for initialization errors
2. **CORS settings** - Make sure your Firebase domain is allowed
3. **Token freshness** - Clear browser cache and try again

## Common Issues

### Issue: "Private key not working"
**Fix:** Make sure the private key includes newlines:
```
"-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
```

### Issue: "Still getting 401 errors"
**Fix:** The frontend might be using old cached tokens. Clear localStorage:
```javascript
localStorage.clear();
```

Then refresh and login again.

## Success Indicators

When working correctly, you should see in logs:
```
✅ Firebase Admin SDK initialized successfully
✅ Firebase token verified successfully: { userId: 'xxx', email: 'xxx@example.com' }
```

## Need Help?

If issues persist:
1. Check Firebase Functions logs for errors
2. Verify all three environment variables are set
3. Make sure the service account has proper permissions
