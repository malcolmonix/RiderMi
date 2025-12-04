import { useState } from 'react';

export default function ActiveOrderPanel({ order, currentLocation, onUpdateStatus, loading }) {
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [deliveryCode, setDeliveryCode] = useState('');

  const status = order?.orderStatus;
  const isPickedUp = order?.isPickedUp || status === 'PICKED_UP' || status === 'OUT_FOR_DELIVERY';

  // Get status step number
  const getStatusStep = () => {
    switch (status) {
      case 'ASSIGNED':
        return 1;
      case 'PICKED_UP':
      case 'OUT_FOR_DELIVERY':
        return 2;
      case 'DELIVERED':
        return 3;
      default:
        return 0;
    }
  };

  const currentStep = getStatusStep();

  // Handle mark as picked up
  const handlePickedUp = () => {
    onUpdateStatus('PICKED_UP');
  };

  // Handle start delivery
  const handleStartDelivery = () => {
    onUpdateStatus('OUT_FOR_DELIVERY');
  };

  // Handle delivery complete
  const handleDelivered = () => {
    if (order.paymentMethod !== 'CASH') {
      // For non-cash orders, require delivery code
      setShowCodeInput(true);
    } else {
      onUpdateStatus('DELIVERED');
    }
  };

  // Submit delivery code
  const handleSubmitCode = () => {
    if (deliveryCode.length === 6) {
      onUpdateStatus('DELIVERED', deliveryCode);
      setShowCodeInput(false);
      setDeliveryCode('');
    }
  };

  if (!order) return null;

  return (
    <div className="space-y-4">
      {/* Order Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Active Order</h2>
          <p className="text-sm text-gray-500">#{order.orderId?.slice(-8)}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusBadgeClass(status)}`}>
          {formatStatus(status)}
        </span>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between px-2">
        <StepIndicator step={1} currentStep={currentStep} label="Accept" icon="✓" />
        <StepConnector active={currentStep >= 1} />
        <StepIndicator step={2} currentStep={currentStep} label="Pick Up" icon="📦" />
        <StepConnector active={currentStep >= 2} />
        <StepIndicator step={3} currentStep={currentStep} label="Deliver" icon="🏠" />
      </div>

      {/* Restaurant Info */}
      <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white">🏪</span>
          </div>
          <div>
            <p className="font-bold text-blue-900">{order.restaurant}</p>
            <p className="text-sm text-blue-700">Pickup Location</p>
          </div>
        </div>
        {order.pickupCode && !isPickedUp && (
          <div className="mt-3 p-2 bg-white rounded-lg">
            <p className="text-xs text-gray-500">Pickup Code</p>
            <p className="text-2xl font-mono font-bold text-center tracking-wider">
              {order.pickupCode}
            </p>
          </div>
        )}
      </div>

      {/* Delivery Address */}
      <div className="p-4 bg-gray-50 rounded-xl">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white">📍</span>
          </div>
          <div className="flex-1">
            <p className="font-bold text-gray-900">Delivery Address</p>
            <p className="text-sm text-gray-600">{order.address || 'No address provided'}</p>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="p-4 bg-gray-50 rounded-xl">
        <p className="font-bold text-gray-900 mb-2">Order Items</p>
        <div className="space-y-2">
          {order.orderItems?.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span className="text-gray-600">
                {item.quantity}x {item.title || item.food}
              </span>
              <span className="text-gray-900">₦{item.total?.toLocaleString()}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between font-bold">
          <span>Total</span>
          <span>₦{order.paidAmount?.toLocaleString()}</span>
        </div>
        {order.paymentMethod === 'CASH' && (
          <div className="mt-2 text-sm text-orange-600 flex items-center gap-1">
            <span>💵</span>
            <span>Collect ₦{order.paidAmount?.toLocaleString()} on delivery</span>
          </div>
        )}
      </div>

      {/* Delivery Code Input */}
      {showCodeInput && (
        <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
          <p className="font-bold text-yellow-900 mb-2">Enter Delivery Code</p>
          <p className="text-sm text-yellow-700 mb-3">
            Ask the customer for the 6-digit delivery code
          </p>
          <input
            type="text"
            value={deliveryCode}
            onChange={(e) => setDeliveryCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            className="w-full p-3 text-center text-2xl font-mono tracking-widest border border-yellow-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500"
            maxLength={6}
          />
          <button
            onClick={handleSubmitCode}
            disabled={deliveryCode.length !== 6 || loading}
            className="w-full mt-3 py-3 bg-yellow-500 text-white rounded-xl font-bold disabled:opacity-50"
          >
            Confirm Delivery
          </button>
        </div>
      )}

      {/* Action Buttons */}
      {!showCodeInput && (
        <div className="space-y-2">
          {!isPickedUp && status !== 'DELIVERED' && (
            <button
              onClick={handlePickedUp}
              disabled={loading}
              className="w-full py-4 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Updating...' : '📦 Mark as Picked Up'}
            </button>
          )}

          {isPickedUp && status !== 'DELIVERED' && status !== 'OUT_FOR_DELIVERY' && (
            <button
              onClick={handleStartDelivery}
              disabled={loading}
              className="w-full py-4 bg-purple-500 text-white rounded-xl font-bold hover:bg-purple-600 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Updating...' : '🚚 Start Delivery'}
            </button>
          )}

          {(status === 'PICKED_UP' || status === 'OUT_FOR_DELIVERY') && status !== 'DELIVERED' && (
            <button
              onClick={handleDelivered}
              disabled={loading}
              className="w-full py-4 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Updating...' : '✅ Complete Delivery'}
            </button>
          )}
        </div>
      )}

      {/* Customer Contact */}
      {order.instructions && (
        <div className="p-3 bg-gray-100 rounded-xl">
          <p className="text-xs text-gray-500 mb-1">Special Instructions</p>
          <p className="text-sm text-gray-700">{order.instructions}</p>
        </div>
      )}
    </div>
  );
}

// Step indicator component
function StepIndicator({ step, currentStep, label, icon }) {
  const isComplete = currentStep >= step;
  const isCurrent = currentStep === step - 1;

  return (
    <div className="flex flex-col items-center">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-colors ${
          isComplete
            ? 'bg-green-500 text-white'
            : isCurrent
            ? 'bg-blue-500 text-white'
            : 'bg-gray-200 text-gray-500'
        }`}
      >
        {isComplete ? '✓' : icon}
      </div>
      <p className={`text-xs mt-1 ${isComplete ? 'text-green-600' : 'text-gray-500'}`}>
        {label}
      </p>
    </div>
  );
}

// Step connector line
function StepConnector({ active }) {
  return (
    <div
      className={`flex-1 h-1 mx-1 rounded-full transition-colors ${
        active ? 'bg-green-500' : 'bg-gray-200'
      }`}
    />
  );
}

// Get status badge class
function getStatusBadgeClass(status) {
  switch (status) {
    case 'ASSIGNED':
      return 'bg-blue-100 text-blue-800';
    case 'PICKED_UP':
      return 'bg-yellow-100 text-yellow-800';
    case 'OUT_FOR_DELIVERY':
      return 'bg-purple-100 text-purple-800';
    case 'DELIVERED':
      return 'bg-green-100 text-green-800';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

// Format status for display
function formatStatus(status) {
  switch (status) {
    case 'ASSIGNED':
      return 'Assigned';
    case 'PICKED_UP':
      return 'Picked Up';
    case 'OUT_FOR_DELIVERY':
      return 'On the Way';
    case 'DELIVERED':
      return 'Delivered';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return status;
  }
}
