import React from 'react';
import { motion } from 'framer-motion';

interface JerseyImageProps {
    src: string;
    alt: string;
    text?: string; // Player Name
    layoutId?: string;
    className?: string;
    style?: React.CSSProperties;
    [key: string]: any;
}

// NBA Team Colors (Official Hex Codes)
const teamColors: Record<string, { primary: string; secondary: string; accent: string }> = {
    // Lakers
    'MAGIC': { primary: '#552583', secondary: '#FDB927', accent: '#FFFFFF' }, // Purple
    'KOBE': { primary: '#FDB927', secondary: '#552583', accent: '#FFFFFF' },  // Gold
    'LEBRON': { primary: '#FDB927', secondary: '#552583', accent: '#FFFFFF' }, // Gold
    'KAREEM': { primary: '#FDB927', secondary: '#552583', accent: '#FFFFFF' }, // Gold
    'GASOL': { primary: '#FFFFFF', secondary: '#552583', accent: '#FDB927' },  // White
    'O\'NEAL': { primary: '#FDB927', secondary: '#552583', accent: '#FFFFFF' }, // Gold
    'SHAQ': { primary: '#FDB927', secondary: '#552583', accent: '#FFFFFF' },    // Gold

    // Bulls
    'JORDAN': { primary: '#CE1141', secondary: '#000000', accent: '#FFFFFF' }, // Red
    'RODMAN': { primary: '#000000', secondary: '#CE1141', accent: '#FFFFFF' }, // Black
    'PIPPEN': { primary: '#CE1141', secondary: '#000000', accent: '#FFFFFF' }, // Red
    'ROSE': { primary: '#CE1141', secondary: '#000000', accent: '#FFFFFF' }, // Red

    // Warriors
    'STEPH CURRY': { primary: '#1D428A', secondary: '#FFC72C', accent: '#FFFFFF' }, // Blue
    'CURRY': { primary: '#1D428A', secondary: '#FFC72C', accent: '#FFFFFF' },       // Blue
    'DURANT': { primary: '#FFFFFF', secondary: '#1D428A', accent: '#FFC72C' },      // White
    'THOMPSON': { primary: '#1D428A', secondary: '#FFC72C', accent: '#FFFFFF' },    // Blue

    // Spurs
    'PARKER': { primary: '#C4CED4', secondary: '#000000', accent: '#000000' }, // Silver
    'LEONARD': { primary: '#000000', secondary: '#C4CED4', accent: '#FFFFFF' }, // Black
    'DUNCAN': { primary: '#FFFFFF', secondary: '#000000', accent: '#C4CED4' }, // White
    'GINOBILI': { primary: '#000000', secondary: '#C4CED4', accent: '#FFFFFF' }, // Black

    // Suns
    'STEVE NASH': { primary: '#E56020', secondary: '#1D1160', accent: '#FFFFFF' }, // Orange
    'NASH': { primary: '#E56020', secondary: '#1D1160', accent: '#FFFFFF' },       // Orange
    'BARKLEY': { primary: '#1D1160', secondary: '#E56020', accent: '#FFFFFF' },    // Purple
    'CP3': { primary: '#E56020', secondary: '#1D1160', accent: '#FFFFFF' },        // Orange

    // Celtics
    'GARNETT': { primary: '#007A33', secondary: '#FFFFFF', accent: '#FFFFFF' }, // Green
    'BIRD': { primary: '#007A33', secondary: '#FFFFFF', accent: '#FFFFFF' },    // Green
    'PIERCE': { primary: '#007A33', secondary: '#FFFFFF', accent: '#FFFFFF' },  // Green

    // Heat
    'WADE': { primary: '#98002E', secondary: '#F9A01B', accent: '#FFFFFF' }, // Crimson
    'BUTLER': { primary: '#000000', secondary: '#98002E', accent: '#FFFFFF' }, // Black

    // Mavs
    'DONCIC': { primary: '#00538C', secondary: '#B8C4CA', accent: '#FFFFFF' },  // Blue
    'NOWITZKI': { primary: '#00538C', secondary: '#B8C4CA', accent: '#FFFFFF' },// Blue
    'IRVING': { primary: '#00538C', secondary: '#B8C4CA', accent: '#FFFFFF' },  // Blue

    // Rockets
    'HARDEN': { primary: '#CE1141', secondary: '#C4CED4', accent: '#FFFFFF' },  // Red
    'OLAJUWON': { primary: '#CE1141', secondary: '#FDB927', accent: '#FFFFFF' },// Red/Gold

    // Blazers
    'LILLARD': { primary: '#000000', secondary: '#E03A3E', accent: '#FFFFFF' }, // Black
    'DREXLER': { primary: '#E03A3E', secondary: '#000000', accent: '#FFFFFF' }, // Red

    // Thunder/Sonics
    'WESTBROOK': { primary: '#007AC1', secondary: '#EF3B24', accent: '#FFFFFF' }, // Blue
    'PAYTON': { primary: '#00653A', secondary: '#FFC200', accent: '#FFFFFF' },    // Green (Sonics)

    // Other/Generic Fallbacks based on 'color' param
    'purple': { primary: '#552583', secondary: '#FDB927', accent: '#FFFFFF' },
    'gold': { primary: '#FDB927', secondary: '#552583', accent: '#FFFFFF' },
    'yellow': { primary: '#FDB927', secondary: '#552583', accent: '#FFFFFF' },
    'black': { primary: '#1d1d1d', secondary: '#FFFFFF', accent: '#FFFFFF' },
    'red': { primary: '#CE1141', secondary: '#000000', accent: '#FFFFFF' },
    'blue': { primary: '#006BB6', secondary: '#FDB927', accent: '#FFFFFF' },
    'green': { primary: '#007A33', secondary: '#FFFFFF', accent: '#FFFFFF' },
    'orange': { primary: '#E56020', secondary: '#1D1160', accent: '#FFFFFF' },
    'silver': { primary: '#C4CED4', secondary: '#000000', accent: '#000000' },
    'navy': { primary: '#0C2340', secondary: '#FDB927', accent: '#FFFFFF' },
    'white': { primary: '#F0F0F0', secondary: '#000000', accent: '#000000' },
};

const JerseyImage: React.FC<JerseyImageProps> = ({ src, alt, text = '', layoutId, style, className, forceGenerator = false, ...props }) => {
    // Check if using protocol or direct image (though we are moving everything to protocol)
    // Check for specific protocol
    const isJerseyProtocol = src && src.startsWith('jersey://');

    // We render the SVG Generator if:
    // 1. It IS a jersey:// protocol string
    // 2. forceGenerator is TRUE (e.g. used as an icon)
    const shouldRenderGenerator = isJerseyProtocol || forceGenerator;

    const uniqueId = React.useMemo(() => (src || text || 'jersey').replace(/[^a-z0-9]/gi, '') + Math.random().toString(36).substr(2, 9), [src, text]);

    if (!shouldRenderGenerator) {
        return (
            <motion.div
                layoutId={layoutId}
                className={className}
                whileHover={{ scale: 1.05, filter: 'brightness(1.1)' }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'transparent',
                    ...style
                }}
                {...props}
            >
                <img
                    src={src || ''}
                    alt={alt}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        filter: 'drop-shadow(0px 10px 20px rgba(0,0,0,0.5))'
                    }}
                />
            </motion.div>
        );
    }

    // Parse params: jersey://NUMBER/COLOR
    // If we are forcing generator with NO src (or non-jersey src), we need defaults
    let number = '00';
    let colorParam = 'white';

    if (isJerseyProtocol) {
        const path = src.replace('jersey://', '').split('?')[0];
        const parts = path.split('/');
        number = parts[0] || '00';
        colorParam = parts[1] || 'white';
    } else {
        // Extract from Text "23 JORDAN" -> Number: 23
        const match = text.match(/^(\d+)/);
        if (match) {
            number = match[1];
        } else {
            // Random default or hash based? Let's default to 00
            number = '00';
        }
        // Color param is derived from name in the colorMap/teamColors lookup anyway
    }

    // 1. Determine Team Style based on Name first, then Color Param
    let colors = teamColors[colorParam.toLowerCase()] || teamColors['white'];

    // Attempt to match player name for exact colors
    if (text) {
        const cleanName = text.trim().toUpperCase().replace(/^\d+\s+/, ''); // Remove leading numbers
        // Check for exact match or partial (e.g. "LEBRON" matches "6 LEBRON")
        const playerKey = Object.keys(teamColors).find(key => cleanName.includes(key));
        if (playerKey) {
            colors = teamColors[playerKey];
        }
    }

    const { primary, secondary, accent } = colors;

    return (
        <motion.div
            layoutId={layoutId}
            className={className}
            whileHover={{ scale: 1.05, zIndex: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                filter: 'drop-shadow(0px 20px 30px rgba(0,0,0,0.5))',
                ...style
            }}
            {...props}
        >
            <svg viewBox="0 0 500 600" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                <defs>
                    {/* Realistic Jersey Shape Clip */}
                    <clipPath id={'jerseyClip' + uniqueId}>
                        <path d="M 130,20 Q 250,80 370,20 L 400,20 Q 440,20 440,100 L 430,220 Q 420,400 440,580 L 60,580 Q 80,400 70,220 L 60,100 Q 60,20 100,20 Z" />
                    </clipPath>

                    {/* Gradient for realistic silky sheen */}
                    <linearGradient id={'sheenGradient' + uniqueId} x1="0%" y1="0%" x2="100%" y2="50%">
                        <stop offset="0%" stopColor="white" stopOpacity="0.1" />
                        <stop offset="40%" stopColor="white" stopOpacity="0" />
                        <stop offset="60%" stopColor="white" stopOpacity="0" />
                        <stop offset="100%" stopColor="white" stopOpacity="0.2" />
                    </linearGradient>

                    {/* Gradient for generic vertical folds */}
                    <linearGradient id={'foldGradient' + uniqueId} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="10%" stopColor="black" stopOpacity="0.3" />
                        <stop offset="20%" stopColor="black" stopOpacity="0.1" />
                        <stop offset="50%" stopColor="black" stopOpacity="0.0" />
                        <stop offset="80%" stopColor="black" stopOpacity="0.1" />
                        <stop offset="90%" stopColor="black" stopOpacity="0.3" />
                    </linearGradient>
                </defs>

                <g clipPath={'url(#jerseyClip' + uniqueId + ')'}>
                    {/* 1. Base Texture Layer (Fabric) */}
                    <image
                        href="/jersey-texture-hq.png"
                        x="-50" y="-50"
                        width="600" height="700"
                        preserveAspectRatio="xMidYMid slice"
                        style={{ filter: 'contrast(1.2)' }}
                    />

                    {/* 2. Color Layer (Multiply) */}
                    <rect x="0" y="0" width="500" height="600" fill={primary} style={{ mixBlendMode: 'multiply', opacity: 0.9 }} />

                    {/* 3. Sheen/Highlight Layer (Soft Light) */}
                    <rect x="0" y="0" width="500" height="600" fill={'url(#sheenGradient' + uniqueId + ')'} style={{ mixBlendMode: 'soft-light' }} />

                    {/* 4. Folds/Shadows (Multiply) for Depth */}
                    <rect x="0" y="0" width="500" height="600" fill={'url(#foldGradient' + uniqueId + ')'} style={{ mixBlendMode: 'multiply', opacity: 0.5 }} />

                    {/* 5. Deep Shadows at Edges */}
                    <path d="M 60,100 Q 80,350 60,580 L 100,580 Q 120,350 100,100 Z" fill="black" opacity="0.3" filter="blur(20px)" />
                    <path d="M 440,100 Q 420,350 440,580 L 400,580 Q 380,350 400,100 Z" fill="black" opacity="0.3" filter="blur(20px)" />
                </g>

                {/* 6. Collar & Arm Trims */}
                {/* Neck Trim - Dual Layer for realism */}
                <path d="M 130,20 Q 250,80 370,20" fill="none" stroke={secondary} strokeWidth="16" strokeLinecap="round" />
                <path d="M 130,20 Q 250,80 370,20" fill="none" stroke={accent} strokeWidth="4" strokeLinecap="round" strokeDasharray="10 5" opacity="0.8" />

                {/* Arm Trims */}
                <path d="M 100,20 Q 60,20 60,100 L 70,220" fill="none" stroke={secondary} strokeWidth="10" strokeLinecap="round" />
                <path d="M 400,20 Q 440,20 440,100 L 430,220" fill="none" stroke={secondary} strokeWidth="10" strokeLinecap="round" />

                {/* 7. Side Panels (If Bulls/Heat etc - Simulated generic panel) */}
                <path d="M 70,220 L 80,580" fill="none" stroke={secondary} strokeWidth="20" opacity="0.8" style={{ mixBlendMode: 'multiply' }} />
                <path d="M 430,220 L 420,580" fill="none" stroke={secondary} strokeWidth="20" opacity="0.8" style={{ mixBlendMode: 'multiply' }} />


                {/* 8. Text & Branding */}
                <g style={{ filter: 'drop-shadow(1px 2px 3px rgba(0,0,0,0.3))' }}>
                    {/* Player Name */}
                    {text && (
                        <>
                            <path id={'curve' + uniqueId} d="M 100,230 Q 250,170 400,230" fill="none" />
                            <text fill={accent} fontSize="38" fontWeight="bold" fontFamily="Arial, sans-serif" letterSpacing="4">
                                <textPath href={'#curve' + uniqueId} startOffset="50%" textAnchor="middle">
                                    {text.replace(/^\d+\s*/, '').toUpperCase()}
                                </textPath>
                            </text>

                            {/* Text Border/Outline for better visibility */}
                            <text fill="none" stroke={secondary} strokeWidth="1" fontSize="38" fontWeight="bold" fontFamily="Arial, sans-serif" letterSpacing="4" opacity="0.5">
                                <textPath href={'#curve' + uniqueId} startOffset="50%" textAnchor="middle">
                                    {text.replace(/^\d+\s*/, '').toUpperCase()}
                                </textPath>
                            </text>
                        </>
                    )}

                    {/* Number */}
                    <text x="250" y="420" textAnchor="middle" fill={accent} fontSize="170" fontFamily="'Impact', sans-serif" fontWeight="900" letterSpacing="-5">
                        {number}
                    </text>
                    <text x="250" y="420" textAnchor="middle" fill="none" stroke={secondary} strokeWidth="3" fontSize="170" fontFamily="'Impact', sans-serif" fontWeight="900" letterSpacing="-5">
                        {number}
                    </text>
                </g>

                {/* 9. Nike/Brand Swoosh (Simulated) */}
                <path d="M 350,100 Q 370,100 390,90 L 380,110 Q 360,110 350,100 Z" fill={accent} />

                {/* 10. NBA Logo Patch (Simulated) */}
                <rect x="310" y="90" width="15" height="30" fill="white" rx="2" />
                <path d="M 317,92 L 317,118" stroke="red" strokeWidth="3" />
                <path d="M 312,105 L 323,105" stroke="blue" strokeWidth="3" opacity="0.5" />

            </svg>
        </motion.div>
    );
};

export default JerseyImage;
