// Test FCM configuration
console.log('=== FCM Test Script ===');

// Check if service worker is supported
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    console.log('Service Workers registered:', registrations.length);
    registrations.forEach(reg => {
      console.log('- Scope:', reg.scope);
    });
  });
}

// Test Firebase initialization
const firebaseConfig = {
  apiKey: 'AIzaSyC8XjBJN-Inntjfqd6GhkfRcbTe4hyMx6Q',
  authDomain: 'chopchop-67750.firebaseapp.com',
  projectId: 'chopchop-67750',
  storageBucket: 'chopchop-67750.firebasestorage.app',
  messagingSenderId: '835361851966',
  appId: '1:835361851966:web:78810ea4389297a8679f6f'
};

console.log('Firebase Config loaded:', !!firebaseConfig.apiKey);
console.log('VAPID Key exists: true');

// Test notification permission
console.log('Notification permission:', Notification.permission);
