import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from '@apollo/client';
import BottomNav from '../components/BottomNav';
import { GET_RIDER_EARNINGS } from '../lib/graphql';

export default function Earnings({ user, loading }) {
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState('today');

  // Map period to days
  const periodDaysMap = {
    today: 1,
    week: 7,
    month: 30
  };

  // Fetch real earnings data from API
  const { data: earningsData, loading: earningsLoading, error: earningsError } = useQuery(
    GET_RIDER_EARNINGS,
    {
      variables: { periodDays: periodDaysMap[selectedPeriod] },
      skip: !user,
      fetchPolicy: 'network-only', // Always get fresh data
    }
  );

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

  // Get earnings from API response or use defaults
  const earnings = earningsData?.riderEarnings || {
    totalEarnings: 0,
    totalRides: 0,
    averagePerRide: 0,
    rides: []
  };

  // Helper to format relative time
  const formatRelativeTime = (dateString) => {
    if (!dateString) return 'Recently';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  // Format pickup address to show a shorter version
  const formatAddress = (address) => {
    if (!address) return 'Unknown location';
    // Take first part before comma or first 30 chars
    const parts = address.split(',');
    const shortAddr = parts[0].trim();
    return shortAddr.length > 30 ? shortAddr.substring(0, 27) + '...' : shortAddr;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-black text-white p-6 pt-12 pb-20 rounded-b-3xl">
        <h1 className="text-2xl font-bold mb-2">Earnings</h1>
        <p className="text-gray-300">Track your delivery earnings</p>
      </div>

      {/* Earnings Card */}
      <div className="mx-4 -mt-12">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {/* Period Selector */}
          <div className="flex gap-2 mb-6">
            {['today', 'week', 'month'].map(period => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-colors ${selectedPeriod === period
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>

          {/* Loading State */}
          {earningsLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-500">Loading earnings...</p>
            </div>
          )}

          {/* Error State */}
          {earningsError && (
            <div className="text-center py-8">
              <p className="text-red-500 text-sm">Failed to load earnings</p>
              <p className="text-gray-400 text-xs mt-1">{earningsError.message}</p>
            </div>
          )}

          {/* Earnings Display */}
          {!earningsLoading && !earningsError && (
            <>
              {/* Total Earnings */}
              <div className="text-center mb-6">
                <p className="text-sm text-gray-500 mb-1">Total Earnings</p>
                <p className="text-4xl font-bold text-green-600">
                  ₦{earnings.totalEarnings.toLocaleString()}
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <p className="text-2xl font-bold text-gray-900">{earnings.totalRides}</p>
                  <p className="text-xs text-gray-500">Rides</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <p className="text-2xl font-bold text-gray-900">
                    ₦{Math.round(earnings.averagePerRide).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">Avg/Ride</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <p className="text-2xl font-bold text-orange-600">
                    {selectedPeriod === 'today' ? '1d' : selectedPeriod === 'week' ? '7d' : '30d'}
                  </p>
                  <p className="text-xs text-gray-500">Period</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="mx-4 mt-6">
        <h2 className="text-lg font-bold mb-4">Recent Deliveries</h2>

        {earningsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-4 bg-white rounded-xl shadow-sm animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                  </div>
                  <div className="h-5 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        ) : earnings.rides.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-xl shadow-sm">
            <p className="text-gray-400 text-3xl mb-2">📦</p>
            <p className="text-gray-500">No deliveries in this period</p>
            <p className="text-gray-400 text-sm mt-1">Complete rides to see your earnings here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {earnings.rides.slice(0, 10).map(ride => (
              <div
                key={ride.id}
                className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-100">
                    <span>🛵</span>
                  </div>
                  <div>
                    <div className="flex flex-col">
                      <p className="font-medium text-gray-900">{formatAddress(ride.dropoffAddress)}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-gray-500">{formatRelativeTime(ride.updatedAt || ride.createdAt)}</p>
                        {ride.rating ? (
                          <div className="flex items-center gap-0.5">
                            <span className="text-yellow-400 text-xs">★</span>
                            <span className="text-xs font-medium text-gray-700">{ride.rating}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">No rating</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <p className="font-bold text-green-600">
                  +₦{(ride.fare || 0).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav activeTab="earnings" />
    </div>
  );
}
