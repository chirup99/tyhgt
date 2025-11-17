import * as admin from 'firebase-admin';

// When running in a Google Cloud environment (like Cloud Run), 
// the Firebase Admin SDK automatically uses Application Default Credentials.
// By explicitly providing the projectId, we ensure it always uses the correct Firebase project,
// preventing token verification errors caused by project mismatch.

if (admin.apps.length === 0) {
  try {
    console.log('Attempting to initialize Firebase Admin SDK with explicit projectId...');
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
    console.log(`✅ Firebase Admin SDK initialized successfully for project: ${process.env.FIREBASE_PROJECT_ID}`);
  } catch (error: any) {
    console.error('🔥 SERVER_STARTUP_ERROR: Failed to initialize Firebase Admin SDK.');
    console.error('   This usually happens when the service account permissions are incorrect or the environment is not set up properly.');
    console.error('   - Original Error: ', error.message);
    throw error; // Crash the container to make the error visible.
  }
}

export const firebaseAdmin = admin;