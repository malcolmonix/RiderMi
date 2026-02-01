import { useState, useEffect } from 'react';
import { ApolloProvider } from '@apollo/client';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, registerMessagingSW, requestAndGetFcmToken, onMessageHandler, db } from '../lib/firebase';
import { apolloClient } from '../lib/apollo';
import { doc, setDoc } from 'firebase/firestore';
import GlobalRideListener from '../components/GlobalRideListener';
import ErrorBoundary from '../components/ErrorBoundary';
import { Toaster, toast } from 'react-hot-toast';
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
          onMessageHandler(async (payload) => {
            console.log('Foreground message:', payload);
            const title = payload.notification?.title || 'New Order';
            const body = payload.notification?.body || 'You have a new delivery request';

            // Show In-App Toast
            toast((t) => (
              <div onClick={() => { toast.dismiss(t.id); }} style={{ cursor: 'pointer' }}>
                <p className="font-bold text-sm">🔔 {title}</p>
                <p className="text-sm">{body}</p>
              </div>
            ), {
              duration: 6000,
              position: 'top-center',
              style: {
                background: '#000',
                color: '#fff',
                border: '1px solid #333',
              },
            });

            // Use Service Worker to show notification (required for Android)
            if (typeof window !== 'undefined' && Notification.permission === 'granted') {
              try {
                const registration = await navigator.serviceWorker.ready;
                await registration.showNotification(title, {
                  body: body,
                  icon: '/icons/icon-192x192.png',
                  badge: '/icons/icon-72x72.png',
                  vibrate: [200, 100, 200],
                  tag: 'ride-notification',
                  requireInteraction: false,
                  data: payload.data
                });
              } catch (error) {
                console.warn('Failed to show notification via Service Worker:', error);
              }
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
    <ErrorBoundary>
      <ApolloProvider client={apolloClient}>
        <GlobalRideListener user={user} isOnline={isOnline} />
        <Component
          {...pageProps}
          user={user}
          loading={loading}
          isOnline={isOnline}
          toggleOnline={toggleOnline}
        />
        <Toaster />
      </ApolloProvider>
    </ErrorBoundary>
  );
}

export default MyApp;
