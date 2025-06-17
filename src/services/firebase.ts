import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDgKau6B_HAQ5Lwo_wUHFKOCnbClxKyGsE",
  authDomain: "almauone.firebaseapp.com",
  projectId: "almauone",
  storageBucket: "almauone.firebasestorage.app",
  messagingSenderId: "667826438315",
  appId: "1:667826438315:web:7d853d67478d279b5537ee",
  measurementId: "G-VJCWKVG68G"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app; 