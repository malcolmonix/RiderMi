import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { signOut, updateProfile as firebaseUpdateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import BottomNav from '../components/BottomNav';

export default function Profile({ user, loading: pageLoading }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    displayName: '',
    phoneNumber: '',
    vehicle: '',
    licensePlate: ''
  });

  // Show loading screen while Firebase is initializing
  if (pageLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading RiderMi...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return null;
  }

  useEffect(() => {
    if (pageLoading) {
      return;
    }
    if (!user) {
      router.push('/login');
      return;
    }

    // Load profile from Firestore
    const loadProfile = async () => {
      try {
        const docRef = doc(db, 'riders', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfile({
            displayName: data.displayName || user.displayName || '',
            phoneNumber: data.phoneNumber || user.phoneNumber || '',
            vehicle: data.vehicle || '',
            licensePlate: data.licensePlate || ''
          });
        } else {
          setProfile({
            displayName: user.displayName || '',
            phoneNumber: user.phoneNumber || '',
            vehicle: '',
            licensePlate: ''
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };

    loadProfile();
  }, [user, router]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Update Firebase Auth profile
      await firebaseUpdateProfile(auth.currentUser, {
        displayName: profile.displayName
      });

      // Update Firestore profile
      await setDoc(doc(db, 'riders', user.uid), {
        ...profile,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      if (user) {
        await setDoc(doc(db, 'riders', user.uid), {
          available: false,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-black text-white p-6 pt-12 pb-16 rounded-b-3xl">
        <h1 className="text-2xl font-bold">Profile</h1>
      </div>

      {/* Profile Card */}
      <div className="mx-4 -mt-10">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {/* Avatar */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt="Profile" 
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <span className="text-4xl">👤</span>
              )}
            </div>
            <p className="font-bold text-xl text-gray-900">
              {profile.displayName || 'Rider'}
            </p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>

          {/* Profile Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={profile.displayName}
                onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                disabled={!editing}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={profile.phoneNumber}
                onChange={(e) => setProfile({ ...profile, phoneNumber: e.target.value })}
                disabled={!editing}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle Type
              </label>
              <input
                type="text"
                value={profile.vehicle}
                onChange={(e) => setProfile({ ...profile, vehicle: e.target.value })}
                disabled={!editing}
                placeholder="e.g., Motorcycle, Bicycle"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                License Plate
              </label>
              <input
                type="text"
                value={profile.licensePlate}
                onChange={(e) => setProfile({ ...profile, licensePlate: e.target.value })}
                disabled={!editing}
                placeholder="e.g., LAG-123-ABC"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 space-y-3">
            {editing ? (
              <div className="flex gap-3">
                <button
                  onClick={() => setEditing(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="w-full py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-colors"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="mx-4 mt-6 space-y-2">
        <MenuItem icon="📊" label="Performance Stats" />
        <MenuItem icon="🔔" label="Notifications" />
        <MenuItem icon="❓" label="Help & Support" />
        <MenuItem icon="📄" label="Terms of Service" />
        
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 p-4 bg-white rounded-xl text-red-600 hover:bg-red-50 transition-colors"
        >
          <span>🚪</span>
          <span className="font-medium">Sign Out</span>
        </button>
      </div>

      <BottomNav activeTab="profile" />
    </div>
  );
}

function MenuItem({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 bg-white rounded-xl hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <span>{icon}</span>
        <span className="font-medium text-gray-900">{label}</span>
      </div>
      <span className="text-gray-400">›</span>
    </button>
  );
}
