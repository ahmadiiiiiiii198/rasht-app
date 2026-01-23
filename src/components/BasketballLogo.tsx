import React from 'react';
import { motion } from 'framer-motion';

interface RashtLogoProps {
    className?: string;
}

const RashtLogo: React.FC<RashtLogoProps> = ({ className }) => {
    return (
        <motion.div
            className={className}
            style={{
                width: '100%',
                height: '100%',
                position: 'absolute',
                top: 0,
                left: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                borderRadius: '50%',
                backgroundColor: '#0d3d2e'
            }}
        >
            {/* Video Logo - Auto playing, looped, muted */}
            <video
                src="/rasht-logo.mp4"
                autoPlay
                loop
                muted
                playsInline
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center center',
                    borderRadius: '50%'
                }}
            />
        </motion.div>
    );
};

export default RashtLogo;
