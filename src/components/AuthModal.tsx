import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, X, Loader2, LogIn, UserPlus, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (userId: string) => void;
}

type AuthMode = 'login' | 'signup';

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [mode, setMode] = useState<AuthMode>('signup');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        fullName: ''
    });
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!formData.username) {
            setError('Please enter your username');
            return;
        }

        if (!formData.password) {
            setError('Please enter your password');
            return;
        }

        if (mode === 'signup' && formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (mode === 'signup' && !formData.fullName) {
            setError('Please enter your full name');
            return;
        }

        setLoading(true);

        try {
            // Check if user exists
            const { data: existingUser, error: fetchError } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('username', formData.username)
                .single();

            if (mode === 'login') {
                if (!existingUser) {
                    throw new Error('Account not found. Please sign up first.');
                }

                // Verify password
                if (existingUser.password !== formData.password) {
                    throw new Error('Incorrect password.');
                }

                // Login successful
                localStorage.setItem('customer_username', formData.username);
                localStorage.setItem('customer_email', existingUser.email || '');
                window.dispatchEvent(new Event('auth-state-changed'));
                onSuccess(existingUser.id);
                onClose();
            } else {
                // Sign Up Mode
                if (existingUser) {
                    throw new Error('Username already exists. Please choose another or log in.');
                }

                // Create new user
                const newProfile = {
                    id: (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
                        ? crypto.randomUUID()
                        : `user_${Date.now()}`,
                    username: formData.username,
                    password: formData.password, // In production, this should be hashed!
                    full_name: formData.fullName,
                    email: `${formData.username}@customer.local`, // Generate placeholder email
                    preferences: {
                        notifications: true,
                        newsletter: false
                    }
                };

                const { data: createdUser, error: createError } = await supabase
                    .from('user_profiles')
                    .insert(newProfile)
                    .select()
                    .single();

                if (createError) throw createError;

                localStorage.setItem('customer_username', formData.username);
                localStorage.setItem('customer_email', newProfile.email);
                window.dispatchEvent(new Event('auth-state-changed'));
                onSuccess(createdUser.id);
                onClose();
            }

        } catch (err: any) {
            console.error('Auth error:', err);
            // Handle "PGRST116" (JSON object requested, multiple (or no) rows returned) which means not found in single()
            if (err.code === 'PGRST116' && mode === 'login') {
                setError('Account not found. Please sign up.');
            } else {
                setError(err.message || 'Authentication failed');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(5, 26, 20, 0.9)', // Emerald Dark overlay
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2000,
                        padding: '20px',
                        backdropFilter: 'blur(8px)'
                    }}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        style={{
                            background: '#fffef5', // Cream
                            borderRadius: '24px',
                            width: '100%',
                            maxWidth: '380px',
                            overflow: 'hidden',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                            border: '1px solid #c9a45c' // Gold border
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header with Tabs */}
                        <div style={{
                            background: 'linear-gradient(135deg, #0d3d2e 0%, #1a5c48 100%)', // Emerald Gradient
                            padding: '25px 20px 0 20px',
                            textAlign: 'center',
                            color: '#c9a45c', // Gold text
                            position: 'relative'
                        }}>
                            <button
                                onClick={onClose}
                                style={{
                                    position: 'absolute',
                                    top: '15px',
                                    right: '15px',
                                    background: 'rgba(201, 164, 92, 0.2)', // Gold tint
                                    border: 'none',
                                    color: '#c9a45c',
                                    cursor: 'pointer',
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'background 0.2s'
                                }}
                            >
                                <X size={18} />
                            </button>

                            <div style={{ marginBottom: '20px' }}>
                                <h2 style={{ margin: '0 0 5px 0', fontSize: '24px', fontWeight: 'bold', fontFamily: 'Cinzel' }}>
                                    {mode === 'login' ? 'Bentornato' : 'Crea Account'}
                                </h2>
                                <p style={{ margin: 0, opacity: 0.9, fontSize: '14px', fontFamily: 'Cormorant Garamond', color: '#e5e7eb' }}>
                                    {mode === 'login' ? 'Accedi per le tue offerte' : 'Unisciti a noi per offerte speciali!'}
                                </p>
                            </div>

                            {/* Tabs */}
                            <div style={{ display: 'flex', gap: '10px', paddingBottom: '0' }}>
                                <button
                                    onClick={() => setMode('login')}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        background: mode === 'login' ? '#fffef5' : 'rgba(255,255,255,0.1)',
                                        color: mode === 'login' ? '#0d3d2e' : '#c9a45c',
                                        border: 'none',
                                        borderRadius: '12px 12px 0 0',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        fontSize: '14px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px',
                                        fontFamily: 'Cinzel'
                                    }}
                                >
                                    <LogIn size={16} /> Login
                                </button>
                                <button
                                    onClick={() => setMode('signup')}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        background: mode === 'signup' ? '#fffef5' : 'rgba(255,255,255,0.1)',
                                        color: mode === 'signup' ? '#0d3d2e' : '#c9a45c',
                                        border: 'none',
                                        borderRadius: '12px 12px 0 0',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        fontSize: '14px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px',
                                        fontFamily: 'Cinzel'
                                    }}
                                >
                                    <UserPlus size={16} /> Registrati
                                </button>
                            </div>
                        </div>

                        {/* Form */}
                        <div style={{ padding: '30px', background: '#fffef5' }}>
                            <form onSubmit={handleSubmit}>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        style={{
                                            background: '#FFF0F0',
                                            color: '#FF4D4D',
                                            padding: '12px',
                                            borderRadius: '12px',
                                            fontSize: '13px',
                                            marginBottom: '20px',
                                            textAlign: 'center',
                                            border: '1px solid #FFD1D1',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        <span>⚠️</span> {error}
                                    </motion.div>
                                )}

                                {mode === 'signup' && (
                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#666', marginBottom: '8px', paddingLeft: '4px', fontFamily: 'Cinzel' }}>Nome Completo</label>
                                        <div style={{ position: 'relative' }}>
                                            <User style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#c9a45c' }} size={18} />
                                            <input
                                                type="text"
                                                placeholder="Mario Rossi"
                                                value={formData.fullName}
                                                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                                className="rashti-input"
                                                style={{
                                                    width: '100%',
                                                    padding: '12px 12px 12px 42px',
                                                    background: 'white',
                                                    borderColor: '#e2e8f0',
                                                    color: '#333'
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#666', marginBottom: '8px', paddingLeft: '4px', fontFamily: 'Cinzel' }}>Username</label>
                                    <div style={{ position: 'relative' }}>
                                        <User style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#c9a45c' }} size={18} />
                                        <input
                                            type="text"
                                            placeholder="mariorossi"
                                            value={formData.username}
                                            onChange={e => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
                                            className="rashti-input"
                                            style={{
                                                width: '100%',
                                                padding: '12px 12px 12px 42px',
                                                background: 'white',
                                                borderColor: '#e2e8f0',
                                                color: '#333'
                                            }}
                                        />
                                    </div>
                                </div>

                                <div style={{ marginBottom: mode === 'signup' ? '15px' : '25px' }}>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#666', marginBottom: '8px', paddingLeft: '4px', fontFamily: 'Cinzel' }}>Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <Lock style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#c9a45c' }} size={18} />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                            className="rashti-input"
                                            style={{
                                                width: '100%',
                                                padding: '12px 42px 12px 42px',
                                                background: 'white',
                                                borderColor: '#e2e8f0',
                                                color: '#333'
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            style={{
                                                position: 'absolute',
                                                right: '12px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                color: '#c9a45c',
                                                padding: '4px',
                                                display: 'flex',
                                                alignItems: 'center'
                                            }}
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="rashti-btn-primary"
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '10px',
                                        marginTop: '10px'
                                    }}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="animate-spin" size={20} />
                                            {mode === 'login' ? 'Accesso...' : 'Creazione...'}
                                        </>
                                    ) : (
                                        mode === 'login' ? 'Accedi' : 'Crea Account'
                                    )}
                                </button>

                                <p style={{ textAlign: 'center', fontSize: '12px', color: '#666', marginTop: '20px', fontFamily: 'Cormorant Garamond' }}>
                                    {mode === 'login'
                                        ? "Non hai un account? Registrati."
                                        : "Hai già un account? Accedi."}
                                </p>
                            </form>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default AuthModal;
