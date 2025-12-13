import { useState } from 'react';
import { formatDistance, formatDuration } from '../lib/mapbox';

const RIDE_STATUSES = {
  ACCEPTED: { label: '✓ Accepted', icon: '✓', color: 'blue' },
  ARRIVED_AT_PICKUP: { label: '📍 Arrived at Pickup', icon: '📍', color: 'blue' },
  PICKED_UP: { label: '📦 Picked Up', icon: '📦', color: 'purple' },
  ARRIVED_AT_DROPOFF: { label: '📍 Arrived at Dropoff', icon: '📍', color: 'orange' },
  COMPLETED: { label: '✅ Completed', icon: '✅', color: 'green' },
  CANCELLED: { label: '❌ Cancelled', icon: '❌', color: 'red' }
};

const getNextStatus = (current) => {
  const sequence = ['ACCEPTED', 'ARRIVED_AT_PICKUP', 'PICKED_UP', 'ARRIVED_AT_DROPOFF', 'COMPLETED'];
  const currentIdx = sequence.indexOf(current);
  return currentIdx >= 0 && currentIdx < sequence.length - 1 ? sequence[currentIdx + 1] : null;
};

export default function ActiveRidePanel({ ride, currentLocation, onUpdateStatus, loading }) {
  const [deliveryCode, setDeliveryCode] = useState('');
  const [codeError, setCodeError] = useState(null);
  const statusInfo = RIDE_STATUSES[ride.status] || { label: ride.status, icon: '🚗', color: 'gray' };
  const nextStatus = getNextStatus(ride.status);
  const isDeliveryStep = ride.status === 'ARRIVED_AT_DROPOFF';

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setDeliveryCode(value);
    if (value.length === 6) {
      setCodeError(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Ride Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-4 text-white">
        <h2 className="text-xl font-bold mb-2">Ride #{ride.rideId?.slice(-6) || 'N/A'}</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-blue-100">Fare</p>
            <p className="font-bold text-lg">₦{ride.fare?.toLocaleString() || '0'}</p>
          </div>
          <div>
            <p className="text-blue-100">Distance</p>
            <p className="font-bold text-lg">{ride.distance ? `${(ride.distance / 1000).toFixed(1)}km` : 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Status Timeline */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
        <p className="text-sm text-blue-600 mb-1">Current Status</p>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{statusInfo.icon}</span>
          <p className="font-bold text-lg text-gray-900">{statusInfo.label}</p>
        </div>
      </div>

      {/* Pickup & Dropoff Locations - Compact */}
      <div className="space-y-2">
        {/* Pickup Location */}
        <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
          <p className="text-xs text-blue-600 font-semibold mb-1">📍 FROM</p>
          <p className="font-medium text-gray-900 text-sm line-clamp-1">{ride.pickupAddress || 'Address not provided'}</p>
          {ride.pickupLat && ride.pickupLng && (
            <p className="text-xs text-gray-500 mt-0.5">{ride.pickupLat.toFixed(4)}, {ride.pickupLng.toFixed(4)}</p>
          )}
        </div>

        {/* Dropoff Location */}
        <div className="bg-orange-50 rounded-xl p-3 border border-orange-100">
          <p className="text-xs text-orange-600 font-semibold mb-1">📍 TO</p>
          <p className="font-medium text-gray-900 text-sm line-clamp-1">{ride.dropoffAddress || 'Address not provided'}</p>
          {ride.dropoffLat && ride.dropoffLng && (
            <p className="text-xs text-gray-500 mt-0.5">{ride.dropoffLat.toFixed(4)}, {ride.dropoffLng.toFixed(4)}</p>
          )}
        </div>
      </div>

      {/* Next Action Button */}
      {nextStatus && (
        <div className="space-y-2">
          {/* Delivery Code Input (only for ARRIVED_AT_DROPOFF → COMPLETED) */}
          {isDeliveryStep && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 space-y-3">
              <p className="text-sm text-yellow-800 font-medium">
                🔐 Ask customer for 6-digit delivery code:
              </p>
              <input
                type="text"
                inputMode="numeric"
                value={deliveryCode}
                onChange={handleCodeChange}
                placeholder="Enter 6-digit code"
                maxLength="6"
                className="w-full px-4 py-3 text-center text-2xl font-bold tracking-widest border-2 border-yellow-300 rounded-lg focus:outline-none focus:border-yellow-500"
              />
              {codeError && (
                <p className="text-sm text-red-600 text-center">{codeError}</p>
              )}
            </div>
          )}

          {/* Single-click status update button (no confirmation needed except for delivery code) */}
          <button
            onClick={async () => {
              if (isDeliveryStep) {
                // Completing delivery - require code
                if (!deliveryCode || deliveryCode.length !== 6) {
                  setCodeError('❌ Please enter a 6-digit code from customer');
                  return;
                }
                await onUpdateStatus('COMPLETED', deliveryCode);
                setDeliveryCode('');
                setCodeError(null);
              } else {
                // All other status updates - instant, no confirmation
                await onUpdateStatus(nextStatus);
              }
            }}
            disabled={loading || (isDeliveryStep && deliveryCode.length !== 6)}
            className="w-full bg-black text-white font-bold py-3 rounded-xl transition-all hover:bg-gray-900 disabled:opacity-50"
          >
            {loading ? 'Updating...' : isDeliveryStep ? 'Complete Delivery' : (RIDE_STATUSES[nextStatus]?.label || `Mark as ${nextStatus}`)}
          </button>
        </div>
      )}

      {ride.status === 'COMPLETED' && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
          <p className="text-green-700 font-bold">🎉 Ride Completed!</p>
          <p className="text-sm text-green-600 mt-1">Thank you for using our service</p>
        </div>
      )}
    </div>
  );
}
