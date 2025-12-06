import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useMutation, useQuery } from '@apollo/client';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { GET_AVAILABLE_RIDES, GET_RIDE, ACCEPT_RIDE, UPDATE_RIDE_STATUS } from '../lib/graphql';
import { calculateDistance, formatDistance, formatDuration } from '../lib/mapbox';
import RiderMap from '../components/RiderMap';
import RideCard from '../components/RideCard';
import ActiveRidePanel from '../components/ActiveRidePanel';
import BottomNav from '../components/BottomNav';

export default function Home({ user, loading }) {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [activeRideId, setActiveRideId] = useState(null);
  const [showOrdersList, setShowOrdersList] = useState(true);
  const [error, setError] = useState(null);
  const [rideValidated, setRideValidated] = useState(false);

  // Query available rides - Always call hooks unconditionally
  const { data: ridesData, loading: ridesLoading, refetch: refetchRides, error: ridesError } = useQuery(GET_AVAILABLE_RIDES, {
    skip: !user || !isOnline,
    pollInterval: isOnline && user ? 10000 : 0, // Poll every 10 seconds when online
    onError: (error) => {
      console.error('❌ Error fetching available rides:', error);
      setError(`Failed to load rides: ${error.message}`);
      setTimeout(() => setError(null), 5000);
    }
  });

  // Query active ride details
  // UBER/BOLT PATTERN: Never delete rides client-side. Server is source of truth.
  // Query active ride details
  // UBER/BOLT PATTERN: Never delete rides client-side. Server is source of truth.
  const { data: activeRideData, refetch: refetchActiveRide } = useQuery(GET_RIDE, {
    variables: { id: activeRideId },
    skip: !activeRideId,
    pollInterval: activeRideId ? 5000 : 0, // Poll every 5 seconds when ride is active
    fetchPolicy: 'network-only', // Always fetch fresh data, don't use cache
    notifyOnNetworkStatusChange: true,
    onCompleted: (data) => {
      if (data?.ride) {
        console.log('🚗 Active ride updated:', data.ride.status);
        setRideValidated(true);

        // ONLY clear when server confirms ride is finished
        if (data.ride.status === 'COMPLETED' || data.ride.status === 'CANCELLED') {
          console.log('✅ SERVER CONFIRMED: Ride finished with status:', data.ride.status);
          // Wait a moment for UI to show completion state before clearing
          setTimeout(() => {
            setActiveRideId(null);
            setRideValidated(false);
            localStorage.removeItem('activeRideId');
            localStorage.removeItem('lastActiveRideTime');
          }, 5000);
        }
      } else if (!data?.ride && activeRideId) {
        // Active ride ID exists locally but server returned null ride
        console.warn('⚠️ Active ride returned null from server. rideId:', activeRideId);
        console.log('🧹 Clearing stuck ride from localStorage');

        setActiveRideId(null);
        setRideValidated(false);
        localStorage.removeItem('activeRideId');
        localStorage.removeItem('lastActiveRideTime');
        setShowOrdersList(true); // Show available orders again
      }
    },
    onError: (error) => {
      console.error('❌ Error fetching active ride:', error);
      // Only clear on auth errors
      if (error.message?.includes('Authentication')) {
        console.error('🔐 Auth error, clearing ride');
        setActiveRideId(null);
        setRideValidated(false);
        localStorage.removeItem('activeRideId');
      }
    }
  });

  // Mutations
  const [acceptRide, { loading: accepting }] = useMutation(ACCEPT_RIDE, {
    onCompleted: (data) => {
      if (data?.acceptRide) {
        const rideId = data.acceptRide.id || data.acceptRide.rideId;
        console.log('✅ Ride accepted successfully:', rideId);

        setActiveRideId(rideId);
        setRideValidated(true);
        setShowOrdersList(false);

        // Persist to localStorage
        localStorage.setItem('activeRideId', rideId);
        localStorage.setItem('lastActiveRideTime', Date.now().toString());
      }
    },
    onError: (error) => {
      console.error('❌ Accept ride error:', error);
      setError(error.message || 'Failed to accept ride');
      setTimeout(() => setError(null), 5000);
    }
  });

  const [updateRideStatus, { loading: updating }] = useMutation(UPDATE_RIDE_STATUS, {
    onCompleted: () => {
      refetchActiveRide();
    },
    onError: (error) => {
      setError(error.message);
      setTimeout(() => setError(null), 5000);
    }
  });

  // Redirect to login if not authenticated (but not while loading)
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Persist active ride on page refresh
  useEffect(() => {
    if (user && activeRideId) {
      localStorage.setItem('activeRideId', activeRideId);
      localStorage.setItem('lastActiveRideTime', Date.now().toString());
    }
  }, [activeRideId, user]);

  // Restore active ride on mount with validation
  useEffect(() => {
    if (user && !activeRideId) {
      const savedRideId = localStorage.getItem('activeRideId');
      const lastActiveTime = parseInt(localStorage.getItem('lastActiveRideTime') || '0');
      const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);

      if (savedRideId && lastActiveTime > twoHoursAgo) {
        console.log('🔄 Attempting to restore active ride:', savedRideId);
        setActiveRideId(savedRideId);
        setIsOnline(true);
        // Validation will happen when query runs
      } else if (savedRideId && lastActiveTime <= twoHoursAgo) {
        console.log('🧹 Clearing stale ride from localStorage (>2 hours old)');
        localStorage.removeItem('activeRideId');
        localStorage.removeItem('lastActiveRideTime');
      }
    }
  }, [user, activeRideId]);

  // Auto-toggle online if ride becomes active/inactive
  useEffect(() => {
    if (activeRideId && !isOnline) {
      console.log('🟢 Auto-going online - ride is active');
      setIsOnline(true);
    }
  }, [activeRideId, isOnline]);

  // Get current location with improved timeout handling
  useEffect(() => {
    if (!navigator.geolocation || !user) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setCurrentLocation(location);

        // Update location in Firestore when online
        if (isOnline && user) {
          setDoc(doc(db, 'rider-locations', user.uid), {
            latitude: location.lat,
            longitude: location.lng,
            updatedAt: new Date().toISOString()
          }, { merge: true }).catch(console.error);
        }
      },
      (error) => {
        if (error.code === 3) {
          console.warn('⏱️ Geolocation timeout - will retry. Make sure location services are enabled.');
        } else if (error.code === 1) {
          console.error('❌ Location permission denied');
        } else {
          console.error('Geolocation error:', error);
        }
      },
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isOnline, user]);

  // Toggle online status
  const toggleOnline = async () => {
    const newStatus = !isOnline;

    // Prevent going offline if ride is active
    if (activeRide && newStatus === false) {
      setError('❌ Cannot go offline during an active ride');
      setTimeout(() => setError(null), 3000);
      return;
    }

    setIsOnline(newStatus);

    if (user) {
      try {
        await setDoc(doc(db, 'riders', user.uid), {
          available: newStatus,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (error) {
        console.error('Error updating rider status:', error);
      }
    }
  };

  // Accept a ride
  const handleAcceptRide = async (ridePublicId) => {
    try {
      // API accepts either the public rideId or doc id; use public to match resolver expectations first
      await acceptRide({ variables: { rideId: ridePublicId } });
    } catch (error) {
      console.error('Error accepting ride:', error);
    }
  };

  // Update ride status
  const handleUpdateStatus = async (status, confirmCode) => {
    if (!activeRideId) return;

    try {
      const variables = {
        rideId: activeRideId,
        status
      };

      // Include confirmation code for ride completion
      if (status === 'COMPLETED' && confirmCode) {
        variables.confirmCode = confirmCode;
      }

      await updateRideStatus({
        variables
      });

      // Success feedback
      console.log(`✅ Ride status updated to: ${status}`);

      // Don't clear localStorage here - let the query's onCompleted handle it
      // when it detects COMPLETED/CANCELLED status

    } catch (error) {
      console.error('Error updating status:', error);
      setError(error.message || 'Failed to update ride status');
      setTimeout(() => setError(null), 3000);
    }
  };

  const goToProfile = () => {
    router.push('/profile');
  };

  // Calculate distance to ride pickup
  const getDistanceToRide = (ride) => {
    if (!currentLocation || !ride?.pickupLat || !ride?.pickupLng) return null;
    const distance = calculateDistance(
      currentLocation.lat,
      currentLocation.lng,
      ride.pickupLat,
      ride.pickupLng
    );
    return distance;
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

  if (!user) {
    return null;
  }

  const availableRides = ridesData?.availableRides || [];
  const activeRide = activeRideData?.ride;

  return (
    <div className="h-screen w-screen relative overflow-hidden bg-gray-100">
      {/* Map */}
      <div className="absolute inset-0">
        <RiderMap
          currentLocation={currentLocation}
          activeRide={activeRide}
          availableRides={showOrdersList ? availableRides : []}
        />
      </div>

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-50 p-4 safe-top">
        <div className="flex items-center justify-between">
          {/* Online Toggle */}
          <div className="flex items-center gap-3 bg-white rounded-full px-4 py-2 shadow-lg">
            <button
              onClick={toggleOnline}
              className={`relative inline-flex w-14 h-7 rounded-full transition-colors duration-300 ${isOnline ? 'bg-green-500' : 'bg-gray-300'
                }`}
            >
              <span
                className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${isOnline ? 'translate-x-7' : 'translate-x-0'
                  }`}
              />
            </button>
            <span className={`text-sm font-bold ${isOnline ? 'text-green-600' : 'text-gray-500'}`}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>

          {/* Profile & Settings */}
          <div className="flex items-center gap-2">
            <button
              onClick={goToProfile}
              className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center"
            >
              <span className="text-lg">👤</span>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
      </div>

      {/* Bottom Panel */}
      <div
        className="absolute bottom-0 left-0 right-0 z-40 bg-white rounded-t-3xl shadow-2xl safe-bottom"
        style={{ maxHeight: '60vh' }}
      >
        {/* Drag Handle */}
        <div
          className="flex justify-center pt-3 pb-2 cursor-grab"
          onClick={() => setShowOrdersList(!showOrdersList)}
        >
          <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
        </div>

        <div className="px-4 pb-20 overflow-y-auto" style={{ maxHeight: 'calc(60vh - 60px)' }}>
          {activeRide ? (
            <ActiveRidePanel
              ride={activeRide}
              currentLocation={currentLocation}
              onUpdateStatus={handleUpdateStatus}
              loading={updating}
            />
          ) : isOnline ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Available Rides</h2>
                <span className="text-sm text-gray-500">
                  {ridesLoading ? 'Loading...' : `${availableRides.length} rides`}
                </span>
              </div>

              {availableRides.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📦</div>
                  <p className="text-gray-500">No rides available right now</p>
                  <p className="text-sm text-gray-400 mt-1">New rides will appear here</p>
                </div>
              ) : (
                availableRides.map(ride => (
                  <RideCard
                    key={ride.id}
                    ride={ride}
                    distance={getDistanceToRide(ride)}
                    onAccept={() => handleAcceptRide(ride.rideId || ride.id)}
                    loading={accepting}
                  />
                ))
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🛵</div>
              <h2 className="text-xl font-bold mb-2">You're Offline</h2>
              <p className="text-gray-500">Go online to start receiving rides</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav activeTab="home" />
    </div>
  );
}
