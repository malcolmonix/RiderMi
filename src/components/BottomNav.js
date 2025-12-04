import Link from 'next/link';
import { useRouter } from 'next/router';

export default function BottomNav({ activeTab = 'home' }) {
  const router = useRouter();

  const tabs = [
    { id: 'home', label: 'Home', icon: '🏠', href: '/' },
    { id: 'earnings', label: 'Earnings', icon: '💰', href: '/earnings' },
    { id: 'history', label: 'History', icon: '📋', href: '/history' },
    { id: 'profile', label: 'Profile', icon: '👤', href: '/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-bottom">
      <div className="flex items-center justify-around py-2">
        {tabs.map(tab => (
          <Link
            key={tab.id}
            href={tab.href}
            className={`flex flex-col items-center py-2 px-4 rounded-xl transition-colors ${
              activeTab === tab.id
                ? 'text-black'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <span className="text-xl mb-1">{tab.icon}</span>
            <span className={`text-xs ${activeTab === tab.id ? 'font-bold' : ''}`}>
              {tab.label}
            </span>
            {activeTab === tab.id && (
              <div className="absolute bottom-0 w-8 h-1 bg-black rounded-t-full" />
            )}
          </Link>
        ))}
      </div>
    </nav>
  );
}
