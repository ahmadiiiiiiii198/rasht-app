import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { RiderLocation } from '../lib/supabase';

interface GPSTrackingOptions {
    riderId: string;
    intervalMs?: number;
    enabled?: boolean;
}

export function useGPSTracking({ riderId, intervalMs = 5000, enabled = true }: GPSTrackingOptions) {
    const [isTracking, setIsTracking] = useState(false);
    const [currentPosition, setCurrentPosition] = useState<GeolocationPosition | null>(null);
    const [error, setError] = useState<string | null>(null);
    const watchIdRef = useRef<number | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const sendLocationToServer = useCallback(async (position: GeolocationPosition) => {
        if (!riderId) return;

        const location: RiderLocation = {
            rider_id: riderId,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            heading: position.coords.heading || undefined,
            speed: position.coords.speed || undefined,
        };

        try {
            const { error: insertError } = await supabase
                .from('rider_locations')
                .insert(location);

            if (insertError) {
                console.error('Error sending location:', insertError);
            } else {
                console.log('📍 Location sent:', location.latitude, location.longitude);
            }
        } catch (err) {
            console.error('Failed to send location:', err);
        }
    }, [riderId]);

    const startTracking = useCallback(() => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by this browser');
            return;
        }

        setIsTracking(true);
        setError(null);

        // Watch position with high accuracy
        watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                setCurrentPosition(position);
                setError(null);
            },
            (err) => {
                console.error('Geolocation error:', err);
                setError(err.message);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );

        // Send to server at intervals
        intervalRef.current = setInterval(() => {
            if (currentPosition) {
                sendLocationToServer(currentPosition);
            } else {
                // Try to get current position if watch hasn't fired yet
                navigator.geolocation.getCurrentPosition(
                    (pos) => sendLocationToServer(pos),
                    (err) => console.error('getCurrentPosition error:', err),
                    { enableHighAccuracy: true }
                );
            }
        }, intervalMs);

        // Send immediately on start
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setCurrentPosition(pos);
                sendLocationToServer(pos);
            },
            (err) => setError(err.message),
            { enableHighAccuracy: true }
        );
    }, [currentPosition, intervalMs, sendLocationToServer]);

    const stopTracking = useCallback(() => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setIsTracking(false);
    }, []);

    useEffect(() => {
        if (enabled && riderId) {
            startTracking();
        }

        return () => {
            stopTracking();
        };
    }, [enabled, riderId, startTracking, stopTracking]);

    return {
        isTracking,
        currentPosition,
        error,
        startTracking,
        stopTracking,
    };
}
