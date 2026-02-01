import { initializeApp, getApps } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { useState, useEffect } from 'react';

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

// Custom hook for authentication state
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading };
}

// Messaging helpers (dynamic imports so server-side doesn't break)
export async function registerMessagingSW() {
  if (typeof window === 'undefined') return null;
  if (!('serviceWorker' in navigator)) return null;
  if (!app) return null;
  try {
    // Add cache busting to force update of service worker
    const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
    });
    // Force update check
    await reg.update();
    console.log('✅ Service worker registered and updated');
    return reg;
  } catch (e) {
    console.error('❌ Service worker registration failed:', e.message || e);
    return null;
  }
}

export async function requestAndGetFcmToken() {
  if (typeof window === 'undefined') return null;
  if (!app) {
    console.warn('Firebase app not initialized');
    return null;
  }
  if (!process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY) {
    console.warn('VAPID key not configured in environment variables');
    return null;
  }
  try {
    // Check notification permission
    if (Notification.permission === 'denied') {
      console.warn('Notifications permission denied by user');
      return null;
    }
    
    if (Notification.permission !== 'granted') {
      console.log('Requesting notification permission...');
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('User denied notification permission');
        return null;
      }
    }
    
    const { getMessaging, getToken } = await import('firebase/messaging');
    const messaging = getMessaging(app);
    
    console.log('Requesting FCM token with VAPID key...');
    
    // VAPID keys from Firebase are base64url-encoded, not standard base64
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    
    // Use the VAPID key as-is - Firebase SDK handles base64url decoding internally
    const token = await getToken(messaging, { 
      vapidKey: vapidKey 
    });
    
    console.log('✅ FCM token obtained:', token.substring(0, 20) + '...');
    return token;
  } catch (e) {
    console.error('❌ Failed to get FCM token:', e.message || e);
    if (e.code) console.error('Error code:', e.code);
    // Try to get more details about the error
    if (e.toString().includes('applicationServerKey')) {
      console.error('The VAPID key appears to be invalid. Please check Firebase Console > Project Settings > Cloud Messaging');
    }
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
