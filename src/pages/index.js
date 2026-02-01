import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { useMutation, useQuery } from '@apollo/client';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db, registerMessagingSW, requestAndGetFcmToken } from '../lib/firebase';
import { GET_AVAILABLE_RIDES, GET_RIDE, ACCEPT_RIDE, UPDATE_RIDE_STATUS, GET_ACTIVE_RIDER_RIDE, RIDER_COUNTER_OFFER } from '../lib/graphql';
import toast from 'react-hot-toast';
import { calculateDistance, formatDistance, formatDuration } from '../lib/mapbox';
import RiderMap from '../components/RiderMap';
import RideCard from '../components/RideCard';
import ActiveRidePanel from '../components/ActiveRidePanel';
import BottomNav from '../components/BottomNav';
import ErrorDisplay from '../components/ErrorDisplay';

export default function Home({ user, loading, isOnline, toggleOnline }) {
  const router = useRouter();
  const [onlineStatusSynced, setOnlineStatusSynced] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [activeRideId, setActiveRideId] = useState(null);
  const [showOrdersList, setShowOrdersList] = useState(true);
  const [error, setError] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [criticalError, setCriticalError] = useState(null);
  const [rideValidated, setRideValidated] = useState(false);
  const [rideErrorCount, setRideErrorCount] = useState(0);
  const [pollingEnabled, setPollingEnabled] = useState(true); // Control polling
  const completionHandledRef = useRef(false); // Prevent duplicate cleanup

  // Global error handler for unhandled errors
  useEffect(() => {
    const handleError = (event) => {
      console.error('🚨 Unhandled error:', event.error);
      setCriticalError(event.error);
      setShowErrorModal(true);
      event.preventDefault(); // Prevent default error handling
    };

    const handleRejection = (event) => {
      console.error('🚨 Unhandled promise rejection:', event.reason);
      setCriticalError(event.reason);
      setShowErrorModal(true);
      event.preventDefault(); // Prevent default rejection handling
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  // Query available rides - Always call hooks unconditionally
  const { data: ridesData, loading: ridesLoading, refetch: refetchRides, error: ridesError, startPolling: startRidesPolling, stopPolling: stopRidesPolling } = useQuery(GET_AVAILABLE_RIDES, {
    skip: !user || !isOnline || !pollingEnabled,
    pollInterval: isOnline && user && pollingEnabled ? 10000 : 0 // Poll every 10 seconds when online
  });

  // Query active ride details from server (Robust restoration)
  const { data: serverActiveRideData, loading: loadingActiveRide, startPolling: startActiveRidePolling, stopPolling: stopActiveRidePolling } = useQuery(GET_ACTIVE_RIDER_RIDE, {
    skip: !user || !pollingEnabled,
    pollInterval: pollingEnabled ? 5000 : 0,
    fetchPolicy: 'network-only' // Always check server for truth
  });

  // Watch for server active ride to sync state
  useEffect(() => {
    if (serverActiveRideData?.activeRiderRide) {
      const serverRide = serverActiveRideData.activeRiderRide;
      console.log('🔄 Synced active ride from server:', serverRide.rideId);

      if (activeRideId !== serverRide.rideId) {
        setActiveRideId(serverRide.rideId); // Use public ID for consistency
        if (user) {
          localStorage.setItem(`activeRideId_${user.uid}`, serverRide.rideId);
        }
        setShowOrdersList(false);
      }
    }
  }, [serverActiveRideData, activeRideId, user]);

  // Specific ride details (for when we have an ID) - Enhanced error handling
  const { data: activeRideData, refetch: refetchActiveRide, error: activeRideError, stopPolling: stopRidePolling, startPolling: startRidePolling } = useQuery(GET_RIDE, {
    variables: { id: activeRideId },
    skip: !activeRideId || !pollingEnabled,
    pollInterval: activeRideId && rideErrorCount < 5 && !completionHandledRef.current && pollingEnabled ? 3000 : 0,
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
    onError: (error) => {
      console.error('❌ GET_RIDE query error:', error);
      setRideErrorCount(prev => {
        const newCount = prev + 1;
        console.log(`🔢 Ride error count: ${newCount}/5`);
        
        // Show user-friendly error message
        if (newCount === 1) {
          setError('Connection issue. Retrying...');
        } else if (newCount === 3) {
          setError('Having trouble connecting. Please check your internet.');
        } else if (newCount >= 5) {
          setError('Unable to connect. Please refresh the page.');
          // Show detailed error modal on Android
          setCriticalError(error);
          setShowErrorModal(true);
          // Stop ALL polling after 5 consecutive failures
          console.log('⏹️ Stopping ALL polling due to consecutive errors');
          setPollingEnabled(false);
          if (stopRidePolling) stopRidePolling();
          if (stopRidesPolling) stopRidesPolling();
          if (stopActiveRidePolling) stopActiveRidePolling();
        }
        
        return newCount;
      });
      
      // Clear error message after 5 seconds unless it's a persistent error
      if (rideErrorCount < 4) {
        setTimeout(() => setError(null), 5000);
      }
    },
    onCompleted: (data) => {
      // Reset error count on successful query
      if (rideErrorCount > 0) {
        console.log('✅ Query successful, resetting error count');
        setRideErrorCount(0);
        setError(null);
      }
    }
  });

  // Mutations
  const [acceptRide, { loading: accepting, data: acceptRideData, error: acceptRideError }] = useMutation(ACCEPT_RIDE);

  const [updateRideStatus, { loading: updating, data: updateRideStatusData, error: updateRideStatusError }] = useMutation(UPDATE_RIDE_STATUS);
  const [counterOffer, { loading: countering }] = useMutation(RIDER_COUNTER_OFFER);

  // INDUSTRY STANDARD: Sync online status with Firestore on mount
  // This ensures the UI reflects the true server state
  useEffect(() => {
    if (!user || onlineStatusSynced) return;

    const syncOnlineStatus = async () => {
      try {
        const riderDocRef = doc(db, 'riders', user.uid);
        const riderDoc = await getDoc(riderDocRef);

        if (riderDoc.exists()) {
          const serverOnlineStatus = riderDoc.data()?.available === true;
          console.log('🔄 Synced online status from server:', serverOnlineStatus);

          // Update localStorage to match server
          localStorage.setItem('riderOnlineStatus', serverOnlineStatus.toString());
          // Note: We don't call setIsOnline here as it's managed globally in _app.js
          // The Home component will receive the updated isOnline via props if we trigger a global sync
          // However, for now, we just ensure the local storage is correct and set synced.
        }

        setOnlineStatusSynced(true);
      } catch (error) {
        console.error('Failed to sync online status:', error);
        setOnlineStatusSynced(true); // Continue with localStorage value
      }
    };

    syncOnlineStatus();
  }, [user, onlineStatusSynced]);

  // Handle ridesError from GET_AVAILABLE_RIDES query
  useEffect(() => {
    if (ridesError) {
      console.error('❌ Error fetching available rides:', ridesError);
      setError(`Failed to load rides: ${ridesError.message}`);
      // Show detailed error modal for critical errors
      setCriticalError(ridesError);
      setShowErrorModal(true);
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [ridesError]);

  // Handle activeRideData and activeRideError from GET_RIDE query
  useEffect(() => {
    let timer;

    if (activeRideData?.ride) {
      console.log('🚗 Active ride updated:', activeRideData.ride.status);
      setRideValidated(true);
      setRideErrorCount(0); // Reset error count on success

      // ONLY clear when server confirms ride is finished
      if (activeRideData.ride.status === 'COMPLETED' || activeRideData.ride.status === 'CANCELLED') {
        console.log('✅ SERVER CONFIRMED: Ride finished with status:', activeRideData.ride.status);

        // Prevent duplicate handling if already processed
        if (completionHandledRef.current) {
          console.log('🔒 Completion already handled, skipping');
          return;
        }

        // Mark as handled immediately
        completionHandledRef.current = true;

        // Stop polling to prevent interference
        if (stopPolling) {
          console.log('⏹️ Stopping ride polling');
          stopPolling();
        }

        // Wait a moment for UI to show completion state before clearing
        timer = setTimeout(() => {
          console.log('🧹 Clearing active ride state...');
          setActiveRideId(null);
          setRideValidated(false);
          setShowOrdersList(true); // Ensure back to list

          // Clear ALL persistence keys
          localStorage.removeItem('activeRideId');
          localStorage.removeItem('lastActiveRideTime');
          if (user?.uid) {
            localStorage.removeItem(`activeRideId_${user.uid}`);
            localStorage.removeItem(`lastActiveRideTime_${user.uid}`);
          }

          // Reset completion flag for next ride
          completionHandledRef.current = false;
        }, 5000);
      }
    } else if (activeRideData && !activeRideData.ride && activeRideId) {
      // Active ride ID exists locally but server returned null ride
      console.warn('⚠️ Active ride returned null from server. rideId:', activeRideId);
      console.log('🧹 Clearing stuck ride from localStorage');

      setActiveRideId(null);
      setRideValidated(false);
      setShowOrdersList(true);

      // Clear ALL persistence keys
      localStorage.removeItem('activeRideId');
      localStorage.removeItem('lastActiveRideTime');
      if (user?.uid) {
        localStorage.removeItem(`activeRideId_${user.uid}`);
        localStorage.removeItem(`lastActiveRideTime_${user.uid}`);
      }

      // Reset completion flag
      completionHandledRef.current = false;
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [activeRideData, activeRideId, stopPolling, user]);



  // Enhanced error handling for active ride errors
  useEffect(() => {
    if (activeRideError) {
      console.error('❌ Error fetching active ride:', activeRideError);
      
      // Handle authentication errors immediately
      if (activeRideError.message?.includes('Authentication') || 
          activeRideError.message?.includes('Unauthorized') ||
          activeRideError.graphQLErrors?.some(err => err.extensions?.code === 'UNAUTHENTICATED')) {
        console.error('🔐 Authentication error, clearing ride state');
        setActiveRideId(null);
        setRideValidated(false);
        localStorage.removeItem('activeRideId');
        if (user?.uid) {
          localStorage.removeItem(`activeRideId_${user.uid}`);
        }
        setRideErrorCount(0);
        setError('Session expired. Please refresh the page.');
        return;
      }

      // For other errors, the onError callback in the query handles error counting
      // Only clear ride state after many consecutive failures (handled in query onError)
      if (rideErrorCount >= 5) {
        console.error('🚫 Too many consecutive errors, clearing ride state');
        setActiveRideId(null);
        setRideValidated(false);
        localStorage.removeItem('activeRideId');
        if (user?.uid) {
          localStorage.removeItem(`activeRideId_${user.uid}`);
        }
        setRideErrorCount(0);
      }
    }
  }, [activeRideError, rideErrorCount, user]);

  // Handle acceptRide mutation result
  useEffect(() => {
    if (acceptRideData?.acceptRide) {
      const rideId = acceptRideData.acceptRide.id || acceptRideData.acceptRide.rideId;
      console.log('✅ Ride accepted successfully:', rideId);

      setActiveRideId(rideId);
      setRideValidated(true);
      setShowOrdersList(false);

      // Persist to localStorage
      localStorage.setItem('activeRideId', rideId);
      localStorage.setItem('lastActiveRideTime', Date.now().toString());
    }
  }, [acceptRideData]);

  useEffect(() => {
    if (acceptRideError) {
      console.error('❌ Accept ride error:', acceptRideError);
      setError(acceptRideError.message || 'Failed to accept ride');
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [acceptRideError]);

  // Handle updateRideStatus mutation result
  useEffect(() => {
    if (updateRideStatusData) {
      refetchActiveRide();
    }
  }, [updateRideStatusData, refetchActiveRide]);

  useEffect(() => {
    if (updateRideStatusError) {
      setError(updateRideStatusError.message);
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [updateRideStatusError]);

  // Redirect to login if not authenticated (but not while loading)
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Persist active ride on page refresh
  useEffect(() => {
    if (user && activeRideId) {
      localStorage.setItem(`activeRideId_${user.uid}`, activeRideId);
      localStorage.setItem(`lastActiveRideTime_${user.uid}`, Date.now().toString());
    }
  }, [activeRideId, user]);

  // Restore active ride on mount with validation
  useEffect(() => {
    if (user && !activeRideId) {
      const savedRideId = localStorage.getItem(`activeRideId_${user.uid}`);
      const lastActiveTime = parseInt(localStorage.getItem(`lastActiveRideTime_${user.uid}`) || '0');
      const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);

      if (savedRideId && lastActiveTime > twoHoursAgo) {
        console.log('🔄 Attempting to restore active ride:', savedRideId);
        setActiveRideId(savedRideId);
        // Don't force online here - let the synced status from Firestore determine
      } else if (savedRideId && lastActiveTime <= twoHoursAgo) {
        console.log('🧹 Clearing stale ride from localStorage (>2 hours old)');
        localStorage.removeItem(`activeRideId_${user.uid}`);
        localStorage.removeItem(`lastActiveRideTime_${user.uid}`);
      }
    }
  }, [user, activeRideId]);

  // Register service worker for FCM on mount
  useEffect(() => {
    if (user) {
      registerMessagingSW();
    }
  }, [user]);

  // Auto-toggle online if ride becomes active (ensures rider stays online during active ride)
  useEffect(() => {
    if (activeRideId && !isOnline) {
      console.log('🟢 Auto-going online - ride is active');
      localStorage.setItem('riderOnlineStatus', 'true');
      // Trigger global toggle to sync with Firestore
      toggleOnline();
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

  // Accept a ride
  const handleAcceptRide = async (ridePublicId) => {
    try {
      // API accepts either the public rideId or doc id; use public to match resolver expectations first
      await acceptRide({ variables: { rideId: ridePublicId } });
    } catch (error) {
      console.error('Error accepting ride:', error);
    }
  };

  const handleCounterOffer = async (rideId, amount) => {
    try {
      await counterOffer({
        variables: { rideId, amount }
      });
      // Show success toast
      toast.success(`Counter offer of ₦${amount} sent!`, {
        icon: '📤',
        style: { background: '#000', color: '#fff' }
      });
      refetchRides();
    } catch (error) {
      console.error('Error sending counter offer:', error);
      setError(error.message || 'Failed to send counter offer');
      setTimeout(() => setError(null), 3000);
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
      <div className="h-[100dvh] flex items-center justify-center bg-gray-50">
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
    <div className="h-[100dvh] w-screen relative overflow-hidden bg-gray-100">
      {/* Error Modal */}
      {showErrorModal && criticalError && (
        <ErrorDisplay
          error={criticalError}
          onRetry={() => {
            setShowErrorModal(false);
            setCriticalError(null);
            setRideErrorCount(0);
            setError(null);
            if (activeRideId) {
              refetchActiveRide();
            } else {
              refetchRides();
            }
          }}
          onDismiss={() => {
            setShowErrorModal(false);
            setCriticalError(null);
          }}
        />
      )}

      {/* Debug Header */}
      <div className="bg-black/80 text-white text-[10px] px-2 py-1 text-center absolute top-0 w-full z-[60] safe-top">
        👤 {user?.email || 'No User'} ({isOnline ? 'Online' : 'Offline'})
      </div>

      {/* Map */}
      <div className="absolute inset-0">
        <RiderMap
          currentLocation={currentLocation}
          activeRide={activeRide}
          availableRides={showOrdersList ? availableRides : []}
        />
      </div>

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-50 p-4 safe-top mt-6">
        <div className="flex items-center justify-between">
          {/* Online Toggle */}
          <div className="flex items-center gap-3 bg-white rounded-full px-4 py-2 shadow-lg">
            <button
              onClick={async () => {
                if (activeRide && isOnline) {
                  setError('❌ Cannot go offline during an active ride');
                  setTimeout(() => setError(null), 3000);
                  return;
                }
                await toggleOnline();
              }}
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

        {/* Error Message with Retry Option */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center justify-between">
              <p className="text-sm text-red-800 flex-1">{error}</p>
              {rideErrorCount >= 5 && (
                <button
                  onClick={() => {
                    console.log('🔄 Manual retry requested');
                    setRideErrorCount(0);
                    setError(null);
                    if (activeRideId) {
                      refetchActiveRide();
                    } else {
                      refetchRides();
                    }
                  }}
                  className="ml-3 px-3 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors"
                >
                  Retry
                </button>
              )}
            </div>
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
              user={user}
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
                    onCounterOffer={(amount) => handleCounterOffer(ride.rideId || ride.id, amount)}
                    loading={accepting || countering}
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
