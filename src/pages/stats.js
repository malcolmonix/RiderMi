import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from '@apollo/client';
import { GET_RIDER_HISTORY, GET_RIDER_EARNINGS } from '../lib/graphql';
import BottomNav from '../components/BottomNav';

export default function PerformanceStats({ user, loading: pageLoading }) {
    const router = useRouter();

    // Fetch all-time earnings (30 days for now)
    const { data: earningsData, loading: earningsLoading } = useQuery(GET_RIDER_EARNINGS, {
        variables: { periodDays: 30 },
        skip: !user,
        fetchPolicy: 'network-only'
    });

    // Fetch ride history for stats
    const { data: historyData, loading: historyLoading } = useQuery(GET_RIDER_HISTORY, {
        skip: !user,
        fetchPolicy: 'network-only'
    });

    useEffect(() => {
        if (!pageLoading && !user) {
            router.push('/login');
        }
    }, [user, pageLoading, router]);

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

    const allRides = historyData?.riderRides || [];
    const completedRides = allRides.filter(r => r.status === 'COMPLETED');
    const cancelledRides = allRides.filter(r => r.status === 'CANCELLED');

    const earnings = earningsData?.riderEarnings || { totalEarnings: 0, totalRides: 0 };

    // Calculate stats
    const totalTrips = completedRides.length;
    const completionRate = allRides.length > 0
        ? Math.round((completedRides.length / allRides.length) * 100)
        : 0;
    const totalEarnings = completedRides.reduce((sum, r) => sum + (r.fare || 0), 0);

    // Calculate this week's stats
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const thisWeekRides = completedRides.filter(r => new Date(r.createdAt) >= oneWeekAgo);
    const thisWeekEarnings = thisWeekRides.reduce((sum, r) => sum + (r.fare || 0), 0);

    const isLoading = earningsLoading || historyLoading;

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
                <h1 className="text-2xl font-bold">Performance Stats</h1>
                <p className="text-gray-300 text-sm mt-1">Your delivery performance overview</p>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black"></div>
                </div>
            ) : (
                <div className="p-4 space-y-4">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 gap-4">
                        <StatCard
                            icon="🛵"
                            label="Total Trips"
                            value={totalTrips}
                            color="bg-blue-50"
                        />
                        <StatCard
                            icon="💰"
                            label="Total Earnings"
                            value={`₦${totalEarnings.toLocaleString()}`}
                            color="bg-green-50"
                        />
                        <StatCard
                            icon="✅"
                            label="Completion Rate"
                            value={`${completionRate}%`}
                            color="bg-purple-50"
                        />
                        <StatCard
                            icon="⭐"
                            label="This Week"
                            value={`₦${thisWeekEarnings.toLocaleString()}`}
                            subtitle={`${thisWeekRides.length} trips`}
                            color="bg-orange-50"
                        />
                    </div>

                    {/* Detailed Stats */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm">
                        <h2 className="font-bold text-gray-800 mb-4">Ride Breakdown</h2>
                        <div className="space-y-3">
                            <StatRow label="Completed Rides" value={completedRides.length} icon="✓" iconColor="text-green-500" />
                            <StatRow label="Cancelled Rides" value={cancelledRides.length} icon="✕" iconColor="text-red-500" />
                            <StatRow label="Total Rides" value={allRides.length} icon="📋" iconColor="text-blue-500" />
                        </div>
                    </div>

                    {/* Earnings Breakdown */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm">
                        <h2 className="font-bold text-gray-800 mb-4">Earnings Breakdown</h2>
                        <div className="space-y-3">
                            <StatRow
                                label="Average per Trip"
                                value={totalTrips > 0 ? `₦${Math.round(totalEarnings / totalTrips).toLocaleString()}` : '₦0'}
                                icon="📊"
                                iconColor="text-purple-500"
                            />
                            <StatRow
                                label="This Month (30d)"
                                value={`₦${earnings.totalEarnings?.toLocaleString() || 0}`}
                                icon="📅"
                                iconColor="text-blue-500"
                            />
                        </div>
                    </div>

                    {/* Motivational Card */}
                    <div className="bg-gradient-to-r from-green-400 to-green-600 rounded-2xl p-5 text-white">
                        <div className="flex items-center gap-3">
                            <span className="text-3xl">🏆</span>
                            <div>
                                <p className="font-bold">Keep up the great work!</p>
                                <p className="text-sm text-green-100">
                                    {totalTrips > 0
                                        ? `You've completed ${totalTrips} deliveries. More rides = more earnings!`
                                        : 'Complete your first delivery to start earning!'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <BottomNav activeTab="profile" />
        </div>
    );
}

function StatCard({ icon, label, value, subtitle, color }) {
    return (
        <div className={`${color} rounded-2xl p-4 text-center`}>
            <span className="text-2xl">{icon}</span>
            <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
            <p className="text-xs text-gray-600">{label}</p>
            {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
    );
}

function StatRow({ label, value, icon, iconColor }) {
    return (
        <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
            <div className="flex items-center gap-2">
                <span className={iconColor}>{icon}</span>
                <span className="text-gray-600">{label}</span>
            </div>
            <span className="font-bold text-gray-900">{value}</span>
        </div>
    );
}
