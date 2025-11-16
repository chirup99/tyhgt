import * as admin from 'firebase-admin';

// When running in a Google Cloud environment (like Cloud Run), 
// the Firebase Admin SDK automatically uses Application Default Credentials.
// This is the most secure and recommended approach.

if (admin.apps.length === 0) {
  try {
    console.log('Attempting to initialize Firebase Admin SDK with Application Default Credentials...');
    admin.initializeApp(); // No config needed!
    console.log('✅ Firebase Admin SDK initialized successfully.');
  } catch (error: any) {
    console.error('🔥 SERVER_STARTUP_ERROR: Failed to initialize Firebase Admin SDK.');
    console.error('   This usually happens when the service account permissions are incorrect or the environment is not set up properly.');
    console.error('   - Original Error: ', error.message);
    throw error; // Crash the container to make the error visible.
  }
}

export const firebaseAdmin = admin;
