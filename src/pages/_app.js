import { useState, useEffect } from 'react';
import { ApolloProvider } from '@apollo/client';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, registerMessagingSW, requestAndGetFcmToken, onMessageHandler, db } from '../lib/firebase';
import { apolloClient } from '../lib/apollo';
import { doc, setDoc } from 'firebase/firestore';
import GlobalRideListener from '../components/GlobalRideListener';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    // If Firebase auth is not configured, skip auth state listener
    if (!auth) {
      console.warn('Firebase auth is not configured. Running in demo mode.');
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      // Restore online status from localStorage
      if (currentUser) {
        const savedStatus = localStorage.getItem('riderOnlineStatus') === 'true';
        setIsOnline(savedStatus);
      }

      // Set up push notifications when user is logged in
      if (currentUser && db) {
        try {
          await registerMessagingSW();
          const token = await requestAndGetFcmToken();

          if (token) {
            // Store FCM token in Firestore for rider notifications
            // Note: We don't set available here - riders must explicitly go online
            await setDoc(doc(db, 'riders', currentUser.uid), {
              fcmToken: token,
              updatedAt: new Date().toISOString()
            }, { merge: true });
          }

          // Handle foreground messages
          onMessageHandler((payload) => {
            console.log('Foreground message:', payload);
            // Show notification or update UI
            if (typeof window !== 'undefined' && Notification.permission === 'granted') {
              new Notification(payload.notification?.title || 'New Order', {
                body: payload.notification?.body || 'You have a new delivery request',
                icon: '/icons/icon-192x192.png'
              });
            }
          });
        } catch (error) {
          console.warn('Failed to set up push notifications:', error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Global toggle for online status
  const toggleOnline = async () => {
    if (!user) return;

    const newStatus = !isOnline;
    setIsOnline(newStatus);
    localStorage.setItem('riderOnlineStatus', newStatus.toString());

    try {
      await setDoc(doc(db, 'riders', user.uid), {
        available: newStatus,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      console.log(`✅ Global rider status synced: ${newStatus ? 'ONLINE' : 'OFFLINE'}`);
    } catch (error) {
      console.error('Error updating rider status globally:', error);
      // Revert local state on failure
      setIsOnline(!newStatus);
      localStorage.setItem('riderOnlineStatus', (!newStatus).toString());
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading RiderMi...</p>
        </div>
      </div>
    );
  }

  return (
    <ApolloProvider client={apolloClient}>
      <GlobalRideListener user={user} isOnline={isOnline} />
      <Component
        {...pageProps}
        user={user}
        loading={loading}
        isOnline={isOnline}
        toggleOnline={toggleOnline}
      />
    </ApolloProvider>
  );
}

export default MyApp;
