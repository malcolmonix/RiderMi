import { formatDistance, formatDuration } from '../lib/mapbox';

export default function OrderCard({ order, distance, onAccept, loading }) {
  // Format the order date
  const orderDate = new Date(order.createdAt || order.orderDate);
  const timeAgo = getTimeAgo(orderDate);

  // Calculate items count
  const itemsCount = order.orderItems?.length || 0;
  const totalItems = order.orderItems?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🏪</span>
            <h3 className="font-bold text-gray-900">{order.restaurant}</h3>
          </div>
          <p className="text-xs text-gray-500 mt-1">Order #{order.orderId?.slice(-8) || order.id?.slice(-8)}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-green-600">
            ₦{(order.paidAmount || order.orderAmount)?.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500">{timeAgo}</p>
        </div>
      </div>

      {/* Order Items Preview */}
      <div className="mb-3 p-3 bg-gray-50 rounded-xl">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>📦</span>
          <span>{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
          {order.orderItems?.slice(0, 2).map((item, idx) => (
            <span key={idx} className="text-gray-400">
              • {item.title || item.food}
            </span>
          ))}
          {itemsCount > 2 && (
            <span className="text-gray-400">+{itemsCount - 2} more</span>
          )}
        </div>
      </div>

      {/* Delivery Address */}
      <div className="mb-4">
        <div className="flex items-start gap-2">
          <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-red-600 text-xs">📍</span>
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500">Deliver to</p>
            <p className="text-sm font-medium text-gray-900 line-clamp-2">
              {order.address || 'Address not provided'}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex items-center gap-4 mb-4 text-sm">
        {distance && (
          <div className="flex items-center gap-1 text-gray-600">
            <span>📏</span>
            <span>{formatDistance(distance)}</span>
          </div>
        )}
        {order.deliveryCharges && (
          <div className="flex items-center gap-1 text-gray-600">
            <span>🚚</span>
            <span>₦{order.deliveryCharges?.toLocaleString()}</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <span>💳</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            order.paymentMethod === 'CASH' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-blue-100 text-blue-700'
          }`}>
            {order.paymentMethod}
          </span>
        </div>
      </div>

      {/* Accept Button */}
      <button
        onClick={onAccept}
        disabled={loading}
        className="w-full py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            Accepting...
          </span>
        ) : (
          'Accept Order'
        )}
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
