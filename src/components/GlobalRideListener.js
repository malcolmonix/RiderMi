import { useEffect, useState, useRef } from 'react';
import { useQuery } from '@apollo/client';
import { GET_AVAILABLE_RIDES } from '../lib/graphql';
import { useRouter } from 'next/router';

// Simple notification sound
const NOTIFICATION_SOUND_URL = 'https://cdn.freesound.org/previews/320/320655_5260872-lq.mp3';

export default function GlobalRideListener({ user, isOnline }) {
    const router = useRouter();
    const [previousRideCount, setPreviousRideCount] = useState(0);
    const audioRef = useRef(null);

    // Poll for available rides
    const { data } = useQuery(GET_AVAILABLE_RIDES, {
        skip: !user || !isOnline,
        pollInterval: 5000,
        fetchPolicy: 'network-only'
    });

    useEffect(() => {
        // Initialize audio
        audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
    }, []);

    useEffect(() => {
        if (data?.availableRides) {
            const currentCount = data.availableRides.length;

            // If we have more rides than before, and it's not the initial load (approx)
            if (currentCount > previousRideCount && previousRideCount >= 0) {
                console.log('🔔 New ride detected! Playing sound...');

                // Play sound
                if (audioRef.current) {
                    // Reset and play
                    audioRef.current.currentTime = 0;
                    audioRef.current.play().catch(e => console.error('Audio play failed:', e));
                }

                // Show browser notification if possible
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('New Ride Request!', {
                        body: 'A new delivery request is available nearby.',
                        icon: '/icons/icon-192x192.png'
                    });
                }
            }

            setPreviousRideCount(currentCount);
        }
    }, [data, previousRideCount]);

    // Request notification permission on mount
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    return null; // Invisible component
}
