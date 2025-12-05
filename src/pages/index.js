import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useMutation, useQuery } from '@apollo/client';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { GET_AVAILABLE_RIDES, ACCEPT_RIDE, UPDATE_RIDE_STATUS } from '../lib/graphql';
import { calculateDistance, formatDistance, formatDuration } from '../lib/mapbox';
import RiderMap from '../components/RiderMap';
import RideCard from '../components/RideCard';
import ActiveOrderPanel from '../components/ActiveOrderPanel';
import BottomNav from '../components/BottomNav';

export default function Home({ user, loading }) {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [activeRideId, setActiveRideId] = useState(null);
  const [showOrdersList, setShowOrdersList] = useState(true);
  const [error, setError] = useState(null);

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

  // Query active ride details (reusing ride query with ID filter)
  const { data: activeRideData, refetch: refetchActiveRide } = useQuery(GET_AVAILABLE_RIDES, {
    skip: !activeRideId,
    pollInterval: activeRideId ? 5000 : 0, // Poll every 5 seconds when ride is active
  });

  // Mutations
  const [acceptRide, { loading: accepting }] = useMutation(ACCEPT_RIDE, {
    onCompleted: (data) => {
      if (data?.acceptRide) {
        setActiveRideId(data.acceptRide.id);
        setShowOrdersList(false);
      }
    },
    onError: (error) => {
      setError(error.message);
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
  const handleAcceptRide = async (rideId) => {
    try {
      await acceptRide({ variables: { rideId } });
    } catch (error) {
      console.error('Error accepting ride:', error);
    }
  };

  // Update ride status
  const handleUpdateStatus = async (status) => {
    if (!activeRideId) return;

    try {
      await updateRideStatus({
        variables: {
          rideId: activeRideId,
          status
        }
      });

      // If completed, reset active ride
      if (status === 'COMPLETED') {
        setActiveRideId(null);
        setShowOrdersList(true);
        refetchRides();
      }
    } catch (error) {
      console.error('Error updating status:', error);
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
  const activeRide = activeRideData?.availableRides?.find(r => r.id === activeRideId);

  return (
    <div className="h-screen w-screen relative overflow-hidden bg-gray-100">
      {/* Map */}
      <div className="absolute inset-0">
        <RiderMap
          currentLocation={currentLocation}
          activeOrder={activeRide}
          availableOrders={showOrdersList ? availableRides : []}
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
            <ActiveOrderPanel
              order={activeRide}
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
                    onAccept={() => handleAcceptRide(ride.id)}
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
