import { formatDistance, formatDuration } from '../lib/mapbox';

export default function RideCard({ ride, distance, onAccept, loading }) {
  // Format the ride creation time
  const rideDate = new Date(ride.createdAt);
  const timeAgo = getTimeAgo(rideDate);

  // Calculate time to pickup/delivery
  const estimatedTime = ride.duration ? formatDuration(ride.duration) : 'N/A';

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🚗</span>
            <h3 className="font-bold text-gray-900">Ride Request</h3>
          </div>
          <p className="text-xs text-gray-500 mt-1">Ride #{ride.rideId?.slice(-8) || ride.id?.slice(-8)}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-green-600">
            ₦{(ride.fare)?.toLocaleString() || '0'}
          </p>
          <p className="text-xs text-gray-500">{timeAgo}</p>
        </div>
      </div>

      {/* Pickup Address */}
      <div className="mb-3">
        <div className="flex items-start gap-2">
          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-green-600 text-xs">📍</span>
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500">Pickup from</p>
            <p className="text-sm font-medium text-gray-900 line-clamp-2">
              {ride.pickupAddress || 'Address not provided'}
            </p>
          </div>
        </div>
      </div>

      {/* Dropoff Address */}
      <div className="mb-4">
        <div className="flex items-start gap-2">
          <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-red-600 text-xs">📍</span>
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500">Deliver to</p>
            <p className="text-sm font-medium text-gray-900 line-clamp-2">
              {ride.dropoffAddress || 'Address not provided'}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex items-center gap-4 mb-4 text-sm flex-wrap">
        <div className="flex items-center gap-1 text-gray-600">
          <span>📏</span>
          <span>{ride.distance ? `${(ride.distance / 1000).toFixed(1)}km` : 'N/A'}</span>
        </div>
        <div className="flex items-center gap-1 text-gray-600">
          <span>⏱️</span>
          <span>{estimatedTime}</span>
        </div>
        <div className="flex items-center gap-1">
          <span>💳</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            ride.paymentMethod === 'CASH' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-blue-100 text-blue-700'
          }`}>
            {ride.paymentMethod || 'CASH'}
          </span>
        </div>
      </div>

      {/* Accept Button */}
      <button
        onClick={onAccept}
        disabled={loading}
        className="w-full bg-black text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
      >
        {loading ? 'Accepting...' : 'Accept Ride'}
      </button>
    </div>
  );
}

function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
