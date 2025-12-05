import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useMutation, useQuery } from '@apollo/client';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { GET_AVAILABLE_ORDERS, GET_RIDER_ORDER, ASSIGN_RIDER, RIDER_UPDATE_ORDER_STATUS } from '../lib/graphql';
import { calculateDistance, formatDistance, formatDuration } from '../lib/mapbox';
import RiderMap from '../components/RiderMap';
import OrderCard from '../components/OrderCard';
import ActiveOrderPanel from '../components/ActiveOrderPanel';
import BottomNav from '../components/BottomNav';

export default function Home({ user, loading }) {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [showOrdersList, setShowOrdersList] = useState(true);
  const [error, setError] = useState(null);

  // Redirect to login if not authenticated (but not while loading)
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Show loading screen while Firebase is initializing
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

  // Redirect to login if not authenticated
  if (!user) {
    return null;
  }

  // Get current location
  useEffect(() => {
    if (!navigator.geolocation) return;

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
      (error) => console.error('Geolocation error:', error),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isOnline, user]);

  // Query available orders
  const { data: ordersData, loading: ordersLoading, refetch: refetchOrders } = useQuery(GET_AVAILABLE_ORDERS, {
    skip: !user || !isOnline,
    pollInterval: isOnline ? 10000 : 0, // Poll every 10 seconds when online
  });

  // Query active order details
  const { data: activeOrderData, refetch: refetchActiveOrder } = useQuery(GET_RIDER_ORDER, {
    variables: { id: activeOrderId },
    skip: !activeOrderId,
    pollInterval: activeOrderId ? 5000 : 0, // Poll every 5 seconds when order is active
  });

  // Mutations
  const [assignRider, { loading: assigning }] = useMutation(ASSIGN_RIDER, {
    onCompleted: (data) => {
      if (data?.assignRider) {
        setActiveOrderId(data.assignRider.id);
        setShowOrdersList(false);
      }
    },
    onError: (error) => {
      setError(error.message);
      setTimeout(() => setError(null), 5000);
    }
  });

  const [updateOrderStatus, { loading: updating }] = useMutation(RIDER_UPDATE_ORDER_STATUS, {
    onCompleted: () => {
      refetchActiveOrder();
    },
    onError: (error) => {
      setError(error.message);
      setTimeout(() => setError(null), 5000);
    }
  });

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

  // Accept an order
  const handleAcceptOrder = async (orderId) => {
    try {
      await assignRider({ variables: { orderId } });
    } catch (error) {
      console.error('Error accepting order:', error);
    }
  };

  // Update order status
  const handleUpdateStatus = async (status, code = null) => {
    if (!activeOrderId) return;

    try {
      await updateOrderStatus({
        variables: { 
          orderId: activeOrderId, 
          status,
          code 
        }
      });

      // If delivered, reset active order
      if (status === 'DELIVERED') {
        setActiveOrderId(null);
        setShowOrdersList(true);
        refetchOrders();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // Sign out
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

  // Calculate distance to order
  const getDistanceToOrder = (order) => {
    if (!currentLocation || !order?.address) return null;
    // For now, return a placeholder since we don't have lat/lng in orders
    return null;
  };

  const availableOrders = ordersData?.availableOrders || [];
  const activeOrder = activeOrderData?.riderOrder;

  if (!user) {
    return null;
  }

  return (
    <div className="h-screen w-screen relative overflow-hidden bg-gray-100">
      {/* Map */}
      <div className="absolute inset-0">
        <RiderMap
          currentLocation={currentLocation}
          activeOrder={activeOrder}
          availableOrders={showOrdersList ? availableOrders : []}
        />
      </div>

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-50 p-4 safe-top">
        <div className="flex items-center justify-between">
          {/* Online Toggle */}
          <div className="flex items-center gap-3 bg-white rounded-full px-4 py-2 shadow-lg">
            <button
              onClick={toggleOnline}
              className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${
                isOnline ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${
                  isOnline ? 'translate-x-8' : 'translate-x-1'
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
              onClick={handleSignOut}
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
          {activeOrder ? (
            <ActiveOrderPanel
              order={activeOrder}
              currentLocation={currentLocation}
              onUpdateStatus={handleUpdateStatus}
              loading={updating}
            />
          ) : isOnline ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Available Orders</h2>
                <span className="text-sm text-gray-500">
                  {ordersLoading ? 'Loading...' : `${availableOrders.length} orders`}
                </span>
              </div>

              {availableOrders.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📦</div>
                  <p className="text-gray-500">No orders available right now</p>
                  <p className="text-sm text-gray-400 mt-1">New orders will appear here</p>
                </div>
              ) : (
                availableOrders.map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    distance={getDistanceToOrder(order)}
                    onAccept={() => handleAcceptOrder(order.id)}
                    loading={assigning}
                  />
                ))
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🛵</div>
              <h2 className="text-xl font-bold mb-2">You're Offline</h2>
              <p className="text-gray-500">Go online to start receiving orders</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav activeTab="home" />
    </div>
  );
}
