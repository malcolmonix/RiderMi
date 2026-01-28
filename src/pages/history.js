import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from '@apollo/client';
import { GET_RIDER_HISTORY, GET_RIDER_EARNINGS } from '../lib/graphql';
import BottomNav from '../components/BottomNav';

export default function History({ user, loading }) {
  const router = useRouter();
  const [filter, setFilter] = useState('all');
  const [dateRange, setDateRange] = useState('week'); // week, month, all
  const [showEarnings, setShowEarnings] = useState(true);

  // Map date range to days for earnings query
  const dateRangeDaysMap = {
    week: 7,
    month: 30,
    all: 365 // Use 1 year as "all time" for performance
  };

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
    fetchPolicy: 'network-only' // Always get fresh history
  });

  // Fetch earnings data for the selected period
  const { data: earningsData, loading: earningsLoading } = useQuery(GET_RIDER_EARNINGS, {
    variables: { periodDays: dateRangeDaysMap[dateRange] },
    skip: !user,
    fetchPolicy: 'network-only'
  });

  // Handle query errors with useEffect
  useEffect(() => {
    if (error) {
      console.error('❌ Error fetching rider history:', error);
      console.error('Error details:', error.message);
      console.error('GraphQL errors:', error.graphQLErrors);
      console.error('Network error:', error.networkError);
    }
  }, [error]);

  const orders = data?.riderRides || [];
  const earnings = earningsData?.riderEarnings || {
    totalEarnings: 0,
    totalRides: 0,
    averagePerRide: 0,
    rides: []
  };

  // Filter orders based on date range and status
  const filteredOrders = orders.filter(order => {
    // Status filter
    if (filter !== 'all' && order.status !== filter) {
      return false;
    }

    // Date range filter
    if (dateRange !== 'all') {
      const orderDate = new Date(order.createdAt);
      const now = new Date();
      const daysAgo = dateRangeDaysMap[dateRange];
      const cutoffDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
      
      if (orderDate < cutoffDate) {
        return false;
      }
    }

    return true;
  });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-black text-white p-6 pt-12 pb-8">
        <h1 className="text-2xl font-bold mb-2">Delivery History</h1>
        <p className="text-gray-300">Track your rides and earnings</p>
      </div>

      {/* Earnings Summary Card */}
      {showEarnings && (
        <div className="mx-4 -mt-4 mb-6">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Earnings Summary</h2>
              <button
                onClick={() => setShowEarnings(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Date Range Selector */}
            <div className="flex gap-2 mb-4">
              {[
                { id: 'week', label: 'Week' },
                { id: 'month', label: 'Month' },
                { id: 'all', label: 'All Time' }
              ].map(period => (
                <button
                  key={period.id}
                  onClick={() => setDateRange(period.id)}
                  className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-colors ${dateRange === period.id
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  {period.label}
                </button>
              ))}
            </div>

            {earningsLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-500">Loading earnings...</p>
              </div>
            ) : (
              <>
                {/* Total Earnings */}
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-500 mb-1">Total Earnings ({dateRange})</p>
                  <p className="text-3xl font-bold text-green-600">
                    ₦{earnings.totalEarnings.toLocaleString()}
                  </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <p className="text-xl font-bold text-gray-900">{earnings.totalRides}</p>
                    <p className="text-xs text-gray-500">Completed Rides</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <p className="text-xl font-bold text-gray-900">
                      ₦{Math.round(earnings.averagePerRide).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">Avg per Ride</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Filter Section */}
      <div className="bg-white mx-4 rounded-2xl shadow-sm p-4 mb-4">
        {/* Status Filter Tabs */}
        <div className="flex gap-2 mb-3">
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

        {/* Results Summary */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{filteredOrders.length} rides found</span>
          {!showEarnings && (
            <button
              onClick={() => setShowEarnings(true)}
              className="text-green-600 hover:text-green-700 font-medium"
            >
              Show Earnings
            </button>
          )}
        </div>
      </div>

      {/* Orders List */}
      <div className="p-4 space-y-4">
        {historyLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-200"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
            <div className="text-red-500 mb-2 text-4xl">⚠️</div>
            <div className="text-red-500 mb-2 font-medium">Error loading history</div>
            <p className="text-xs text-gray-500 mb-4">{error.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
            <div className="text-4xl mb-4">📋</div>
            <p className="text-gray-500 font-medium mb-2">No rides found</p>
            <p className="text-gray-400 text-sm">
              {filter !== 'all' 
                ? `No ${filter.toLowerCase()} rides in the selected period`
                : `No rides in the selected period`
              }
            </p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <div
              key={order.id}
              className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Order Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">📍</span>
                    <h3 className="font-bold text-gray-900 line-clamp-1 text-sm">{order.pickupAddress}</h3>
                  </div>
                  <p className="text-xs text-gray-500">Ride ID: {order.rideId}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${order.status === 'COMPLETED'
                    ? 'bg-green-100 text-green-800'
                    : order.status === 'CANCELLED'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                    }`}>
                    {order.status === 'COMPLETED' ? 'Completed' : 
                     order.status === 'CANCELLED' ? 'Cancelled' : order.status}
                  </span>
                  <p className="font-bold text-green-600 text-lg">
                    ₦{order.fare ? order.fare.toLocaleString() : '0'}
                  </p>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="flex items-start gap-2 mb-3">
                <span className="text-gray-400">🏁</span>
                <p className="text-sm text-gray-600 line-clamp-1">{order.dropoffAddress}</p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div>
                  <p className="text-sm text-gray-500">
                    {formatDate(order.createdAt)}
                  </p>
                  {/* Rating Display */}
                  {order.status === 'COMPLETED' && (
                    <div className="flex items-center gap-1 mt-1">
                      {order.rating ? (
                        <>
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={`text-sm ${i < order.rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                          ))}
                          <span className="text-xs text-gray-500 ml-1">({order.rating})</span>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">No rating yet</span>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Distance and Duration */}
                <div className="text-right">
                  {order.distance && (
                    <p className="text-xs text-gray-500">
                      {(order.distance / 1000).toFixed(1)} km
                    </p>
                  )}
                  {order.duration && (
                    <p className="text-xs text-gray-500">
                      {Math.round(order.duration / 60)} min
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}

        {/* Load More Button (if needed) */}
        {filteredOrders.length > 0 && filteredOrders.length >= 20 && (
          <div className="text-center pt-4">
            <button className="bg-gray-100 text-gray-600 px-6 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors">
              Load More Rides
            </button>
          </div>
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
