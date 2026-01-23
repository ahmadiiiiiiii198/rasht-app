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
                    password: formData.password, // NOTE: In production, this should be hashed!
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
                        background: 'rgba(0,0,0,0.6)',
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
                            background: 'white',
                            borderRadius: '24px',
                            width: '100%',
                            maxWidth: '380px',
                            overflow: 'hidden',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header with Tabs */}
                        <div style={{
                            background: 'linear-gradient(135deg, #667eea, #764ba2)',
                            padding: '25px 20px 0 20px',
                            textAlign: 'center',
                            color: 'white',
                            position: 'relative'
                        }}>
                            <button
                                onClick={onClose}
                                style={{
                                    position: 'absolute',
                                    top: '15px',
                                    right: '15px',
                                    background: 'rgba(255,255,255,0.2)',
                                    border: 'none',
                                    color: 'white',
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
                                <h2 style={{ margin: '0 0 5px 0', fontSize: '24px', fontWeight: 'bold' }}>
                                    {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                                </h2>
                                <p style={{ margin: 0, opacity: 0.9, fontSize: '14px' }}>
                                    {mode === 'login' ? 'Login to access your offers' : 'Join us to unlock special offers!'}
                                </p>
                            </div>

                            {/* Tabs */}
                            <div style={{ display: 'flex', gap: '10px', paddingBottom: '0' }}>
                                <button
                                    onClick={() => setMode('login')}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        background: mode === 'login' ? 'white' : 'rgba(255,255,255,0.2)',
                                        color: mode === 'login' ? '#667eea' : 'white',
                                        border: 'none',
                                        borderRadius: '12px 12px 0 0',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        fontSize: '14px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <LogIn size={16} /> Login
                                </button>
                                <button
                                    onClick={() => setMode('signup')}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        background: mode === 'signup' ? 'white' : 'rgba(255,255,255,0.2)',
                                        color: mode === 'signup' ? '#667eea' : 'white',
                                        border: 'none',
                                        borderRadius: '12px 12px 0 0',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        fontSize: '14px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <UserPlus size={16} /> Sign Up
                                </button>
                            </div>
                        </div>

                        {/* Form */}
                        <div style={{ padding: '30px', background: 'white' }}>
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
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#666', marginBottom: '8px', paddingLeft: '4px' }}>Full Name</label>
                                        <div style={{ position: 'relative' }}>
                                            <User style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#A0AEC0' }} size={18} />
                                            <input
                                                type="text"
                                                placeholder="John Doe"
                                                value={formData.fullName}
                                                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                                style={{
                                                    width: '100%',
                                                    padding: '12px 12px 12px 42px',
                                                    borderRadius: '12px',
                                                    border: '2px solid #EDF2F7',
                                                    fontSize: '15px',
                                                    outline: 'none',
                                                    boxSizing: 'border-box',
                                                    transition: 'border-color 0.2s',
                                                    color: '#2D3748'
                                                }}
                                                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                                                onBlur={(e) => e.target.style.borderColor = '#EDF2F7'}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#666', marginBottom: '8px', paddingLeft: '4px' }}>Username</label>
                                    <div style={{ position: 'relative' }}>
                                        <User style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#A0AEC0' }} size={18} />
                                        <input
                                            type="text"
                                            placeholder="johndoe"
                                            value={formData.username}
                                            onChange={e => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
                                            style={{
                                                width: '100%',
                                                padding: '12px 12px 12px 42px',
                                                borderRadius: '12px',
                                                border: '2px solid #EDF2F7',
                                                fontSize: '15px',
                                                outline: 'none',
                                                boxSizing: 'border-box',
                                                transition: 'border-color 0.2s',
                                                color: '#2D3748'
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = '#667eea'}
                                            onBlur={(e) => e.target.style.borderColor = '#EDF2F7'}
                                        />
                                    </div>
                                </div>

                                <div style={{ marginBottom: mode === 'signup' ? '15px' : '25px' }}>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#666', marginBottom: '8px', paddingLeft: '4px' }}>Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <Lock style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#A0AEC0' }} size={18} />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '12px 42px 12px 42px',
                                                borderRadius: '12px',
                                                border: '2px solid #EDF2F7',
                                                fontSize: '15px',
                                                outline: 'none',
                                                boxSizing: 'border-box',
                                                transition: 'border-color 0.2s',
                                                color: '#2D3748'
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = '#667eea'}
                                            onBlur={(e) => e.target.style.borderColor = '#EDF2F7'}
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
                                                color: '#A0AEC0',
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
                                    style={{
                                        width: '100%',
                                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                        color: 'white',
                                        padding: '14px',
                                        borderRadius: '12px',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        border: 'none',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        opacity: loading ? 0.7 : 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '10px',
                                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                                        marginTop: '10px'
                                    }}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="animate-spin" size={20} />
                                            {mode === 'login' ? 'Logging in...' : 'Creating Account...'}
                                        </>
                                    ) : (
                                        mode === 'login' ? 'Login' : 'Create Account'
                                    )}
                                </button>

                                <p style={{ textAlign: 'center', fontSize: '12px', color: '#A0AEC0', marginTop: '20px' }}>
                                    {mode === 'login'
                                        ? "Don't have an account? Switch to Sign Up tab."
                                        : "Already have an account? Switch to Login tab."}
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
