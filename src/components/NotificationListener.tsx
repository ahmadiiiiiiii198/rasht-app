import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X } from 'lucide-react';

interface NotificationListenerProps { }

interface Message {
    id: string;
    content: string;
    created_at: string;
    sender: string;
}

const NotificationListener: React.FC<NotificationListenerProps> = () => {
    const [notification, setNotification] = useState<Message | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        // Initialize Audio
        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');

        // Identify User
        const checkUser = async () => {
            const email = localStorage.getItem('customer_email');
            if (email) {
                const { data } = await supabase
                    .from('user_profiles')
                    .select('id')
                    .eq('email', email)
                    .single();

                if (data) {
                    setUserId(data.id);
                }
            }
        };

        checkUser();

        // Listen for storage events in case login happens in another tab or AuthModal updates localStorage
        const handleStorageChange = () => checkUser();
        window.addEventListener('storage', handleStorageChange);

        // Custom event dispatcher if we want to trigger update from AuthModal
        window.addEventListener('auth-state-changed', handleStorageChange);

        // Listen for FCM push notifications (when app is in foreground on native)
        const handleFCMNotification = (event: CustomEvent) => {
            console.log('📱 [FCM] Push notification received in foreground:', event.detail);
            const { title, body } = event.detail;

            // Show the notification
            setNotification({
                id: Date.now().toString(),
                content: body || title || 'New notification',
                created_at: new Date().toISOString(),
                sender: 'admin'
            });

            // Play sound
            if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(err => console.error('Audio play error:', err));
            }

            // Vibrate
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate(500);
            }

            setTimeout(() => setNotification(null), 6000);
        };

        window.addEventListener('fcm-notification', handleFCMNotification as EventListener);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('auth-state-changed', handleStorageChange);
            window.removeEventListener('fcm-notification', handleFCMNotification as EventListener);
        };
    }, []);

    // Subscribe to BROADCAST messages unconditionally (no login needed)
    useEffect(() => {
        console.log('🔔 Setting up Broadcast listener...');

        const handleNewMessage = (payload: any) => {
            console.log('🔔 BROADCAST message received!', payload);
            const newMessage = payload.new as Message;

            setNotification(newMessage);

            if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(err => console.error('Audio play error:', err));
            }

            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate(500);
            }

            setTimeout(() => setNotification(null), 6000);
        };

        const broadcastChannel = supabase
            .channel('broadcast-messages')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: 'user_id=is.null'
                },
                handleNewMessage
            )
            .subscribe((status) => {
                console.log('📡 Broadcast channel status:', status);
            });

        return () => {
            broadcastChannel.unsubscribe();
        };
    }, []);

    // Subscribe to PERSONAL messages (requires login)
    useEffect(() => {
        if (!userId) {
            console.log('⏳ Waiting for user login to subscribe to personal messages...');
            return;
        }

        console.log('🔔 Setting up Personal listener for user:', userId);

        const handleNewMessage = (payload: any) => {
            console.log('🔔 PERSONAL message received!', payload);
            const newMessage = payload.new as Message;

            setNotification(newMessage);

            if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(err => console.error('Audio play error:', err));
            }

            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate(500);
            }

            setTimeout(() => setNotification(null), 6000);
        };

        const personalChannel = supabase
            .channel(`personal-messages-${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `user_id=eq.${userId}`
                },
                handleNewMessage
            )
            .subscribe((status) => {
                console.log('📡 Personal channel status:', status);
            });

        return () => {
            personalChannel.unsubscribe();
        };
    }, [userId]);

    return (
        <AnimatePresence>
            {notification && (
                <motion.div
                    initial={{ opacity: 0, y: -50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -50, scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    style={{
                        position: 'fixed',
                        top: '20px',
                        left: '50%',
                        x: '-50%',
                        zIndex: 9999,
                        width: '90%',
                        maxWidth: '400px',
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '16px',
                        padding: '16px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                        border: '1px solid rgba(255,255,255,0.5)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px'
                    }}
                >
                    <div style={{
                        background: 'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 99%, #FECFEF 100%)',
                        padding: '10px',
                        borderRadius: '12px',
                        color: '#D946EF'
                    }}>
                        <MessageSquare size={24} />
                    </div>

                    <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '700', color: '#1A202C' }}>
                            New Message
                        </h4>
                        <p style={{ margin: 0, fontSize: '14px', color: '#4A5568', lineHeight: '1.4' }}>
                            {notification.content}
                        </p>
                        <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#A0AEC0' }}>
                            Just now • {notification.sender}
                        </p>
                    </div>

                    <button
                        onClick={() => setNotification(null)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#A0AEC0',
                            cursor: 'pointer',
                            padding: '4px'
                        }}
                    >
                        <X size={18} />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default NotificationListener;
