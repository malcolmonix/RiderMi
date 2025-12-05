# Deploy Firestore Rules - CRITICAL STEP

## ⚠️ IMPORTANT: Authentication Will NOT Work Until Rules Are Deployed

The RiderMi login system requires Firestore security rules to be deployed to Firebase. Without these rules, you'll get **"permission denied"** errors when trying to:
- Create a rider profile
- Sign in with email/password
- Sign in with Google

## Quick Deploy (Recommended)

### Option 1: Firebase CLI (Fastest)

```bash
# Make sure you're in the root directory
cd C:\Users\PC\Documents\AAA\dev\dispatch\git\0NiX.inc

# Install Firebase CLI globally (if not installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy Firestore rules
firebase deploy --only firestore:rules
```

### Option 2: Firebase Console (Manual)

1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** → **Rules**
4. Copy the entire contents of `firestore.rules` file from the root directory
5. Paste into the rules editor
6. Click **"Publish"** button

## Verify Deployment

After deploying, verify the rules are active:

1. Go to Firebase Console → Firestore Database → Rules
2. Check that the rules include a section for `riders/{riderId}`
3. The rules should allow: `allow create, update: if request.auth != null && request.auth.uid == riderId;`

## Testing After Deployment

1. **Clear browser cache** (important!)
2. Open RiderMi: http://localhost:9011
3. Try registering a new account with email/password
4. Try signing in with Google

## Common Issues

### Still getting permission errors?

1. **Wait 1-2 minutes** - Rule deployment can take time to propagate
2. **Hard refresh browser** - Press Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
3. **Clear browser storage** - Open DevTools → Application → Clear Storage
4. **Check Firebase Console** - Verify rules are published and show as "Active"

### Firebase CLI not working?

- Make sure you're logged in: `firebase login`
- Check you're in the right project: `firebase use --add`
- Verify project ID matches your `.env.local` configuration

## Environment Setup

Make sure your `.env.local` file in RiderMi has the correct Firebase configuration:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key
NEXT_PUBLIC_GRAPHQL_URI=http://localhost:4000/graphql
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
```

## Next Steps

After deploying rules, RiderMi authentication should work perfectly. You'll be able to:
- ✅ Register new rider accounts
- ✅ Sign in with email/password
- ✅ Sign in with Google
- ✅ Create and update rider profiles
- ✅ Access the dashboard

If you continue to have issues, check the browser console for specific error messages.
