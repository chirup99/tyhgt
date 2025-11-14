import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase configuration
// Get these values from https://console.firebase.google.com/
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  
  apiKey: "AIzaSyAUhGSu40qB3SJObxfbtWO1jSZtTfFCm7Y"
  authDomain: "perala-39d04.firebaseapp.com",
  projectId: "perala-39d04",
  storageBucket: "perala-39d04.firebasestorage.app",
  messagingSenderId: "810500481716",
  appId: "1:810500481716:web:16162cbf585e1abfbbade1",
  measurementId: "G-HPB60YSFFF"
};
// For Firebase JS SDK v7.20.0 and later, measurementId is optional


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and export it
export const auth = getAuth(app);
export default app;
