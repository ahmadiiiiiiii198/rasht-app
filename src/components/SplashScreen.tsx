import React from 'react';
import { motion } from 'framer-motion';

const SplashScreen: React.FC = () => {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, #0d3d2e 0%, #0a4a3a 50%, #0d3d2e 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            overflow: 'hidden'
        }}>
            {/* Main Logo Container */}
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{
                    width: '280px',
                    height: '280px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'transparent'
                }}
            >
                {/* Logo Image */}
                <img
                    src="/rasht-logo.png"
                    alt="Gastronomia Rasht"
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        objectPosition: 'center center'
                    }}
                />
            </motion.div>

            {/* Loading Indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                style={{
                    marginTop: '40px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '16px'
                }}
            >
                {/* Animated Dots */}
                <div style={{ display: 'flex', gap: '10px' }}>
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            animate={{
                                scale: [1, 1.4, 1],
                                opacity: [0.4, 1, 0.4]
                            }}
                            transition={{
                                duration: 1.2,
                                repeat: Infinity,
                                delay: i * 0.2
                            }}
                            style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                backgroundColor: '#c9a45c'
                            }}
                        />
                    ))}
                </div>

                <motion.span
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{
                        fontFamily: '"Cormorant Garamond", serif',
                        fontSize: '14px',
                        color: 'rgba(201, 164, 92, 0.8)',
                        letterSpacing: '2px',
                        fontStyle: 'italic'
                    }}
                >
                    Caricamento...
                </motion.span>
            </motion.div>
        </div>
    );
};

export default SplashScreen;
