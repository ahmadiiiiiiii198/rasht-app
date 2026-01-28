import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, Keyboard, CheckCircle, XCircle, Search, ScanLine } from 'lucide-react';
import { supabase } from './lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

type VerificationResult = {
    success: boolean;
    message: string;
    data?: any;
};

const VerifyPage = () => {
    const [mode, setMode] = useState<'scan' | 'manual'>('scan');
    const [manualCode, setManualCode] = useState('');
    const [result, setResult] = useState<VerificationResult | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const scannerRef = useRef<Html5Qrcode | null>(null);

    useEffect(() => {
        return () => {
            // Cleanup scanner on unmount
            if (scannerRef.current?.isScanning) {
                scannerRef.current.stop();
            }
        };
    }, []);

    const startScanner = async () => {
        try {
            // Ensure any previous instance is stopped
            if (scannerRef.current?.isScanning) {
                await scannerRef.current.stop();
            }

            const scanner = new Html5Qrcode('qr-reader');
            scannerRef.current = scanner;
            setIsScanning(true);
            setResult(null);

            await scanner.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                (decodedText) => {
                    handleCodeVerification(decodedText);
                    scanner.stop().then(() => setIsScanning(false));
                },
                () => { } // Ignore errors during scanning
            );
        } catch (err) {
            console.error('Scanner error:', err);
            setResult({ success: false, message: 'Camera access denied or not available. Please verify permissions.' });
            setIsScanning(false);
        }
    };

    const stopScanner = async () => {
        if (scannerRef.current?.isScanning) {
            await scannerRef.current.stop();
            setIsScanning(false);
        }
    };

    const handleCodeVerification = async (code: string) => {
        console.log("Verifying code:", code);
        setResult(null);

        try {
            // First check Offers (special_offers table)
            const { data: offer } = await supabase
                .from('special_offers')
                .select('*')
                .or(`qr_code_data.eq.${code},verification_code.eq.${code}`)
                .single();

            if (offer) {
                // Mark as used (increment used_count)
                await supabase
                    .from('special_offers')
                    .update({ used_count: (offer.used_count || 0) + 1 })
                    .eq('id', offer.id);

                setResult({
                    success: true,
                    message: `✔️ Offer Verified: ${offer.title}`,
                    data: offer
                });
                return;
            }

            // Then check User Rewards (loyalty free pizza)
            const { data: reward } = await supabase
                .from('user_rewards')
                .select('*')
                .or(`qr_code.eq.${code},verification_code.eq.${code}`)
                .eq('is_redeemed', false)
                .single();

            if (reward) {
                // Mark as redeemed
                await supabase
                    .from('user_rewards')
                    .update({
                        is_redeemed: true,
                        redeemed_at: new Date().toISOString(),
                        redemption_method: mode === 'scan' ? 'qr_scan' : 'manual_code'
                    })
                    .eq('id', reward.id);

                setResult({
                    success: true,
                    message: '🎉 Free Product Redeemed Successfully!',
                    data: reward
                });
                return;
            }

            setResult({ success: false, message: '❌ Invalid or Expired Code' });
        } catch (err) {
            console.error(err);
            setResult({ success: false, message: 'An error occurred during verification.' });
        }
    };



    useEffect(() => {
        if (mode === 'scan' && !isScanning) {
            // Don't auto-start, wait for user interaction to avoid permission loops on load
        } else {
            stopScanner();
        }
    }, [mode]);

    return (
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
            <h2 className="page-title" style={{ textAlign: 'center', marginBottom: '2rem' }}>Verify & Redeem</h2>

            <div className="card" style={{ padding: '1rem', overflow: 'hidden' }}>
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
                    <button
                        onClick={() => setMode('scan')}
                        style={{
                            flex: 1,
                            padding: '1rem',
                            background: mode === 'scan' ? 'var(--bg-secondary)' : 'transparent',
                            color: mode === 'scan' ? 'var(--persian-gold)' : 'var(--text-muted)',
                            borderBottom: mode === 'scan' ? '2px solid var(--persian-gold)' : 'none',
                            border: 'none',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <Camera size={20} /> Scan QR
                    </button>
                    <button
                        onClick={() => setMode('manual')}
                        style={{
                            flex: 1,
                            padding: '1rem',
                            background: mode === 'manual' ? 'var(--bg-secondary)' : 'transparent',
                            color: mode === 'manual' ? 'var(--persian-gold)' : 'var(--text-muted)',
                            borderBottom: mode === 'manual' ? '2px solid var(--persian-gold)' : 'none',
                            border: 'none',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <Keyboard size={20} /> Enter Code
                    </button>
                </div>

                <div style={{ padding: '1rem' }}>
                    {mode === 'scan' ? (
                        <div style={{ minHeight: 320 }}>
                            <div id="qr-reader" style={{ width: '100%', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-color)' }}></div>

                            {!isScanning && (
                                <div style={{
                                    padding: '3rem 1rem',
                                    background: 'var(--bg-secondary)',
                                    borderRadius: 12,
                                    border: '1px dashed var(--border-color)',
                                    marginTop: '1rem'
                                }}>
                                    <ScanLine size={48} color="var(--persian-gold)" style={{ opacity: 0.5, marginBottom: '1rem' }} />
                                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Camera is currently off</p>
                                    <button onClick={startScanner} className="btn btn-primary">
                                        <Camera size={18} /> Start Camera
                                    </button>
                                </div>
                            )}

                            {isScanning && (
                                <button onClick={stopScanner} className="btn btn-danger" style={{ marginTop: '1.5rem' }}>
                                    Stop Camera
                                </button>
                            )}
                        </div>
                    ) : (
                        <div style={{ padding: '2rem 0' }}>
                            <div style={{ position: 'relative', maxWidth: 400, margin: '0 auto' }}>
                                <input
                                    type="text"
                                    placeholder="Enter 6-digit code..."
                                    value={manualCode}
                                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                                    style={{
                                        width: '100%',
                                        padding: '1rem 1rem 1rem 3rem',
                                        fontSize: '1.25rem',
                                        letterSpacing: '2px',
                                        textAlign: 'center',
                                        borderRadius: 12,
                                        border: '1px solid var(--border-color)',
                                        background: 'var(--bg-primary)',
                                        color: 'var(--text-primary)'
                                    }}
                                />
                                <Keyboard
                                    size={20}
                                    color="var(--text-muted)"
                                    style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }}
                                />
                            </div>

                            <button
                                onClick={() => handleCodeVerification(manualCode)}
                                className="btn btn-primary"
                                style={{ marginTop: '1.5rem', width: '100%', maxWidth: 400, padding: '1rem' }}
                                disabled={!manualCode}
                            >
                                <Search size={18} /> Verify Code
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {result && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="card"
                        style={{
                            marginTop: '1.5rem',
                            padding: '2rem',
                            borderLeft: `4px solid ${result.success ? 'var(--success)' : 'var(--danger)'}`,
                            background: result.success ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)'
                        }}
                    >
                        <div style={{
                            width: 64, height: 64, margin: '0 auto 1rem',
                            background: result.success ? 'var(--success)' : 'var(--danger)',
                            borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: result.success ? '0 4px 12px rgba(16, 185, 129, 0.3)' : '0 4px 12px rgba(239, 68, 68, 0.3)'
                        }}>
                            {result.success ? <CheckCircle size={32} color="white" /> : <XCircle size={32} color="white" />}
                        </div>
                        <h3 style={{
                            color: result.success ? 'var(--success)' : 'var(--danger)',
                            margin: '0 0 0.5rem 0',
                            fontSize: '1.5rem'
                        }}>
                            {result.success ? 'Verified Successfully' : 'Verification Failed'}
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', margin: 0 }}>
                            {result.message}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default VerifyPage;
