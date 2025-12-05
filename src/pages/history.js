import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import BottomNav from '../components/BottomNav';

export default function History({ user, loading }) {
  const router = useRouter();
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Mock order history - would come from API in production
  const orders = [
    {
      id: '1',
      orderId: 'ORD-001',
      restaurant: 'Pizza Palace',
      address: '123 Main Street, Lagos',
      amount: 2500,
      status: 'DELIVERED',
      date: '2025-12-04T14:30:00Z'
    },
    {
      id: '2',
      orderId: 'ORD-002',
      restaurant: 'Chicken Republic',
      address: '456 Victoria Island, Lagos',
      amount: 1800,
      status: 'DELIVERED',
      date: '2025-12-04T12:15:00Z'
    },
    {
      id: '3',
      orderId: 'ORD-003',
      restaurant: 'KFC',
      address: '789 Lekki Phase 1, Lagos',
      amount: 2200,
      status: 'DELIVERED',
      date: '2025-12-04T10:00:00Z'
    },
    {
      id: '4',
      orderId: 'ORD-004',
      restaurant: 'Dominos Pizza',
      address: '321 Ikeja GRA, Lagos',
      amount: 3500,
      status: 'CANCELLED',
      date: '2025-12-03T18:45:00Z'
    },
    {
      id: '5',
      orderId: 'ORD-005',
      restaurant: 'The Place',
      address: '654 Surulere, Lagos',
      amount: 1500,
      status: 'DELIVERED',
      date: '2025-12-03T15:20:00Z'
    },
  ];

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(o => o.status === filter);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white p-6 pt-12 border-b border-gray-200">
        <h1 className="text-2xl font-bold mb-4">Order History</h1>
        
        {/* Filter Tabs */}
        <div className="flex gap-2">
          {[
            { id: 'all', label: 'All' },
            { id: 'DELIVERED', label: 'Completed' },
            { id: 'CANCELLED', label: 'Cancelled' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`py-2 px-4 rounded-full text-sm font-medium transition-colors ${
                filter === tab.id
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
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📋</div>
            <p className="text-gray-500">No orders found</p>
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
                    <span className="text-lg">🏪</span>
                    <h3 className="font-bold text-gray-900">{order.restaurant}</h3>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">#{order.orderId}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  order.status === 'DELIVERED' 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {order.status === 'DELIVERED' ? 'Completed' : 'Cancelled'}
                </span>
              </div>

              {/* Delivery Address */}
              <div className="flex items-start gap-2 mb-3">
                <span className="text-gray-400">📍</span>
                <p className="text-sm text-gray-600 line-clamp-1">{order.address}</p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  {formatDate(order.date)}
                </p>
                <p className="font-bold text-green-600">
                  ₦{order.amount.toLocaleString()}
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
