import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

// Check if Firebase is configured
const isFirebaseConfigured = firebaseConfig.apiKey && firebaseConfig.projectId;

let app = null;
let auth = null;
let db = null;

if (isFirebaseConfigured) {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  auth = getAuth(app);
  db = getFirestore(app);
} else {
  console.warn('Firebase is not configured. Please set environment variables.');
}

export { auth, db };

// Messaging helpers (dynamic imports so server-side doesn't break)
export async function registerMessagingSW() {
  if (typeof window === 'undefined') return null;
  if (!('serviceWorker' in navigator)) return null;
  if (!app) return null;
  try {
    const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    return reg;
  } catch (e) {
    console.warn('Service worker registration failed:', e.message || e);
    return null;
  }
}

export async function requestAndGetFcmToken() {
  if (typeof window === 'undefined') return null;
  if (!app) return null;
  if (!process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY) return null;
  try {
    const { getMessaging, getToken } = await import('firebase/messaging');
    const messaging = getMessaging(app);
    // Request permission
    if (Notification.permission !== 'granted') {
      await Notification.requestPermission();
    }
    if (Notification.permission !== 'granted') return null;
    const token = await getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY });
    return token;
  } catch (e) {
    console.warn('Failed to get FCM token:', e.message || e);
    return null;
  }
}

export async function onMessageHandler(callback) {
  if (typeof window === 'undefined') return;
  if (!app) return;
  try {
    const { getMessaging, onMessage } = await import('firebase/messaging');
    const messaging = getMessaging(app);
    onMessage(messaging, callback);
  } catch (e) {
    console.warn('onMessage handler setup failed:', e.message || e);
  }
}
