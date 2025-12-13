import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import BottomNav from '../components/BottomNav';

export default function Notifications({ user, loading: pageLoading }) {
    const router = useRouter();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!pageLoading && !user) {
            router.push('/login');
        }
    }, [user, pageLoading, router]);

    // Subscribe to notifications for this rider
    useEffect(() => {
        if (!user) return;

        try {
            const notificationsRef = collection(db, 'rider-notifications');
            const q = query(
                notificationsRef,
                where('riderId', '==', user.uid),
                orderBy('createdAt', 'desc')
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const notifs = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setNotifications(notifs);
                setLoading(false);
            }, (error) => {
                console.error('Error fetching notifications:', error);
                // Fallback to empty array on error (collection might not exist yet)
                setNotifications([]);
                setLoading(false);
            });

            return () => unsubscribe();
        } catch (error) {
            console.error('Error setting up notifications listener:', error);
            setLoading(false);
        }
    }, [user]);

    const markAsRead = async (notifId) => {
        try {
            const notifRef = doc(db, 'rider-notifications', notifId);
            await updateDoc(notifRef, { read: true });
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return 'Yesterday';
        return date.toLocaleDateString();
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'new_ride': return '🛵';
            case 'ride_cancelled': return '❌';
            case 'payment': return '💰';
            case 'rating': return '⭐';
            case 'promo': return '🎉';
            default: return '📣';
        }
    };

    if (pageLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading RiderMi...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-black text-white p-6 pt-12 pb-8 rounded-b-3xl">
                <button
                    onClick={() => router.back()}
                    className="mb-4 text-gray-300 hover:text-white flex items-center gap-2"
                >
                    <span>←</span> Back
                </button>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Notifications</h1>
                        <p className="text-gray-300 text-sm mt-1">
                            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                        </p>
                    </div>
                    <span className="text-3xl">🔔</span>
                </div>
            </div>

            {/* Notifications List */}
            <div className="p-4">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black"></div>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="text-center py-16">
                        <span className="text-5xl mb-4 block">🔕</span>
                        <h2 className="text-xl font-bold text-gray-700 mb-2">No Notifications</h2>
                        <p className="text-gray-500">
                            You're all caught up! New ride requests and updates will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {notifications.map((notif) => (
                            <div
                                key={notif.id}
                                onClick={() => !notif.read && markAsRead(notif.id)}
                                className={`bg-white rounded-xl p-4 shadow-sm cursor-pointer transition-all ${!notif.read ? 'border-l-4 border-green-500' : ''
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <span className="text-2xl">{getNotificationIcon(notif.type)}</span>
                                    <div className="flex-1">
                                        <p className={`${!notif.read ? 'font-bold' : 'font-medium'} text-gray-900`}>
                                            {notif.title}
                                        </p>
                                        <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                                        <p className="text-xs text-gray-400 mt-2">{formatTime(notif.createdAt)}</p>
                                    </div>
                                    {!notif.read && (
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <BottomNav activeTab="profile" />
        </div>
    );
}
