
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDY7c8Sq2DeagWC_yG5leCVW7Qu4Kas9eU",
  authDomain: "campus-9cf4c.firebaseapp.com",
  projectId: "campus-9cf4c",
  storageBucket: "campus-9cf4c.firebasestorage.app",
  messagingSenderId: "519635214262",
  appId: "1:519635214262:web:de7bda59d43f72f4626b17",
  measurementId: "G-QYL3SNJ2YL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

// Configure Google Auth Provider for educational domains only
googleProvider.setCustomParameters({
  // hd: 'youruniversity.edu', // Uncomment to restrict to specific domains
  prompt: 'select_account'
});

export { auth, firestore, storage, googleProvider };
export default app;
