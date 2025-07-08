import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getDatabase } from 'firebase/database';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyA-S2x5ImudnsHyf-y4LsfM0TiPAT95ByM",
  authDomain: "almauone-d340b.firebaseapp.com",
  projectId: "almauone-d340b",
  storageBucket: "almauone-d340b.appspot.com",
  messagingSenderId: "764139271255",
  appId: "1:764139271255:web:b8553cfcff61e8c10adf12",
  measurementId: "G-D9KBERGPQT"
};

// Инициализируем Firebase только если приложение с именем '[DEFAULT]' ещё не существует
const app = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApp();

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const database = getDatabase(app);
export const messaging = getMessaging();

export async function requestFirebaseNotificationPermission() {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Замените на свой VAPID ключ из Firebase Console → Cloud Messaging → Web Push certificates
      const token = await getToken(messaging, { vapidKey: 'ВАШ_VAPID_KEY' });
      return token;
    }
    return null;
  } catch (err) {
    return null;
  }
}

export default app; 