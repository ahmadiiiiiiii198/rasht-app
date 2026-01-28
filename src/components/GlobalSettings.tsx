import React, { useEffect, useState, useRef } from 'react';
import { supabase, AppSettings } from '../lib/supabase';
import { Music, Volume2, VolumeX, Play, Pause } from 'lucide-react';

export const GlobalSettings: React.FC = () => {
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [hasUserInteracted, setHasUserInteracted] = useState(false);

    useEffect(() => {
        fetchSettings();

        // Listen for any user interaction to unlock audio and auto-play
        const handleInteraction = () => {
            setHasUserInteracted(true);
            if (audioRef.current && !isPlaying && settings?.background_music_url) {
                const playPromise = audioRef.current.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => setIsPlaying(true)).catch(console.error);
                }
            }
            // We don't remove listeners immediately if we want to ensure it works,
            // but usually one interaction is enough to unlock the audio context.
            // However, we only want to auto-play ONCE.
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('keydown', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
        };

        window.addEventListener('click', handleInteraction);
        window.addEventListener('keydown', handleInteraction);
        window.addEventListener('touchstart', handleInteraction);

        return () => {
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('keydown', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
        };
    }, [settings, isPlaying]); // Add settings and isPlaying to dependency to capture latest state

    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('app_settings')
                .select('*')
                .eq('setting_key', 'global')
                .single();

            if (error) {
                console.error('Error fetching settings:', error);
                return;
            }

            if (data) {
                setSettings(data);
                applySettings(data);
            }
        } catch (err) {
            console.error('Error in fetchSettings:', err);
        }
    };

    const applySettings = (data: AppSettings) => {
        // Apply Background Image
        if (data.background_image_url) {
            const styleElement = document.createElement('style');
            styleElement.innerHTML = `
        body, .app, .rashti-page, .rashti-page-dark { 
          background: url('${data.background_image_url}') no-repeat center center fixed !important; 
          background-size: cover !important;
        }
        .background-static { display: none !important; } 
      `;
            document.head.appendChild(styleElement);
        }
    };

    useEffect(() => {
        if (settings?.background_music_url && audioRef.current) {
            // Prepare audio
            audioRef.current.src = settings.background_music_url;
            audioRef.current.load();

            // Try to auto-play immediately (might be blocked by browser, but worth a try)
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => setIsPlaying(true))
                    .catch((e) => {
                        console.log("Auto-play blocked, waiting for interaction", e);
                    });
            }
        }
    }, [settings?.background_music_url]);

    const togglePlay = () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        setIsPlaying(true);
                    })
                    .catch(error => {
                        console.error("Audio play failed:", error);
                    });
            }
        }
    };

    const toggleMute = () => {
        if (!audioRef.current) return;
        audioRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    if (!settings) return null;

    return (
        <>
            {/* Hidden Audio Element */}
            {settings.background_music_url && (
                <audio
                    ref={audioRef}
                    loop
                    preload="auto"
                    onError={(e) => console.error("Audio error:", e)}
                >
                    <source src={settings.background_music_url} type="audio/mpeg" />
                </audio>
            )}

            {/* Floating Music Control - Simplified Speaker Icon Only */}
            {settings.background_music_url && (
                <button
                    onClick={toggleMute}
                    style={{
                        position: 'fixed',
                        bottom: '170px', /* Stacked above Cart button (which is at ~100px) */
                        right: '16px',
                        zIndex: 90,
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'rgba(13, 61, 46, 0.6)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(201, 164, 92, 0.4)',
                        color: 'var(--persian-gold)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                    }}
                >
                    {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
            )}
        </>
    );
};
