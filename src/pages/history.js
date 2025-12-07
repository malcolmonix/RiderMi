import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from '@apollo/client';
import { GET_RIDER_HISTORY } from '../lib/graphql';
import BottomNav from '../components/BottomNav';

export default function History({ user, loading }) {
  const router = useRouter();
  const [filter, setFilter] = useState('all');

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

  // Fetch rider history from API
  const { data, loading: historyLoading, error } = useQuery(GET_RIDER_HISTORY, {
    skip: !user,
    fetchPolicy: 'network-only', // Always get fresh history
    onError: (error) => {
      console.error('❌ Error fetching rider history:', error);
      console.error('Error details:', error.message);
      console.error('GraphQL errors:', error.graphQLErrors);
      console.error('Network error:', error.networkError);
    }
  });

  const orders = data?.riderRides || [];

  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter(o => o.status === filter);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white p-6 pt-12 border-b border-gray-200">
        <h1 className="text-2xl font-bold mb-4">Ride History</h1>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {[
            { id: 'all', label: 'All' },
            { id: 'COMPLETED', label: 'Completed' },
            { id: 'CANCELLED', label: 'Cancelled' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`py-2 px-4 rounded-full text-sm font-medium transition-colors ${filter === tab.id
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="p-4 space-y-4">
        {historyLoading ? (
          <div className="text-center py-12 text-gray-400">Loading history...</div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-500 mb-2">Error loading history</div>
            <p className="text-xs text-gray-500">{error.message}</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📋</div>
            <p className="text-gray-500">No rides found</p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <div
              key={order.id}
              className="bg-white rounded-2xl p-4 shadow-sm"
            >
              {/* Order Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📍</span>
                    <h3 className="font-bold text-gray-900 line-clamp-1">{order.pickupAddress}</h3>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Ride ID: {order.rideId}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${order.status === 'COMPLETED'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
                  }`}>
                  {order.status === 'COMPLETED' ? 'Completed' : 'Cancelled'}
                </span>
              </div>

              {/* Delivery Address */}
              <div className="flex items-start gap-2 mb-3">
                <span className="text-gray-400">🏁</span>
                <p className="text-sm text-gray-600 line-clamp-1">{order.dropoffAddress}</p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  {formatDate(order.createdAt)}
                </p>
                <p className="font-bold text-green-600">
                  ₦{order.fare ? order.fare.toLocaleString() : '0'}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <BottomNav activeTab="history" />
    </div>
  );
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return `Today at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  } else if (diffDays === 1) {
    return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
