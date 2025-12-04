import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import BottomNav from '../components/BottomNav';

export default function Earnings({ user }) {
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState('today');

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  // Mock earnings data - would come from API in production
  const earnings = {
    today: {
      amount: 15000,
      orders: 8,
      hours: 6.5,
      tips: 2500
    },
    week: {
      amount: 85000,
      orders: 45,
      hours: 38,
      tips: 12000
    },
    month: {
      amount: 320000,
      orders: 180,
      hours: 152,
      tips: 45000
    }
  };

  const currentEarnings = earnings[selectedPeriod];

  if (!user) return null;

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
                className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-colors ${
                  selectedPeriod === period
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>

          {/* Total Earnings */}
          <div className="text-center mb-6">
            <p className="text-sm text-gray-500 mb-1">Total Earnings</p>
            <p className="text-4xl font-bold text-green-600">
              ₦{currentEarnings.amount.toLocaleString()}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <p className="text-2xl font-bold text-gray-900">{currentEarnings.orders}</p>
              <p className="text-xs text-gray-500">Orders</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <p className="text-2xl font-bold text-gray-900">{currentEarnings.hours}h</p>
              <p className="text-xs text-gray-500">Online</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <p className="text-2xl font-bold text-orange-600">₦{currentEarnings.tips.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Tips</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="mx-4 mt-6">
        <h2 className="text-lg font-bold mb-4">Recent Transactions</h2>
        
        <div className="space-y-3">
          {[
            { id: 1, restaurant: 'Pizza Palace', amount: 2500, time: '2 hours ago', type: 'delivery' },
            { id: 2, restaurant: 'Chicken Republic', amount: 1800, time: '4 hours ago', type: 'delivery' },
            { id: 3, restaurant: 'Tip', amount: 500, time: '4 hours ago', type: 'tip' },
            { id: 4, restaurant: 'KFC', amount: 2200, time: '6 hours ago', type: 'delivery' },
            { id: 5, restaurant: 'Dominos Pizza', amount: 2000, time: 'Yesterday', type: 'delivery' },
          ].map(transaction => (
            <div 
              key={transaction.id}
              className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  transaction.type === 'tip' ? 'bg-orange-100' : 'bg-green-100'
                }`}>
                  <span>{transaction.type === 'tip' ? '💵' : '🛵'}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{transaction.restaurant}</p>
                  <p className="text-xs text-gray-500">{transaction.time}</p>
                </div>
              </div>
              <p className={`font-bold ${
                transaction.type === 'tip' ? 'text-orange-600' : 'text-green-600'
              }`}>
                +₦{transaction.amount.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      <BottomNav activeTab="earnings" />
    </div>
  );
}
