import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDgKau6B_HAQ5Lwo_wUHFKOCnbClxKyGsE",
  authDomain: "almauone.firebaseapp.com",
  projectId: "almauone",
  storageBucket: "almauone.firebasestorage.app",
  messagingSenderId: "667826438315",
  appId: "1:667826438315:web:7d853d67478d279b5537ee",
  measurementId: "G-VJCWKVG68G"
};

// Инициализируем Firebase только если приложение с именем '[DEFAULT]' ещё не существует
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const database = getDatabase(app);

export default app; 