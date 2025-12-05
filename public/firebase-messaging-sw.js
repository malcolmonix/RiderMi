// Firebase Messaging Service Worker
// This file handles background push notifications
// NOTE: Firebase config must be set here for the service worker to function.
// The config values are public (NEXT_PUBLIC_*) and safe to include.

importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
// These values are from chopchop-67750 Firebase project
const firebaseConfig = {
  apiKey: 'AIzaSyC8XjBJN-Inntjfqd6GhkfRcbTe4hyMx6Q',
  authDomain: 'chopchop-67750.firebaseapp.com',
  projectId: 'chopchop-67750',
  storageBucket: 'chopchop-67750.firebasestorage.app',
  messagingSenderId: '835361851966',
  appId: '1:835361851966:web:78810ea4389297a8679f6f'
};

// Initialize Firebase
if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  firebase.initializeApp(firebaseConfig);

  const messaging = firebase.messaging();

  // Handle background messages
  messaging.onBackgroundMessage((payload) => {
    console.log('Received background message:', payload);

    const notificationTitle = payload.notification?.title || 'New Delivery Request';
    const notificationOptions = {
      body: payload.notification?.body || 'You have a new delivery request',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: 'delivery-notification',
      data: payload.data,
      actions: [
        {
          action: 'accept',
          title: 'Accept',
        },
        {
          action: 'view',
          title: 'View',
        }
      ]
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
}

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window/tab open
      for (const client of clientList) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            data: event.notification.data
          });
          return client.focus();
        }
      }
      // Open a new window/tab
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
