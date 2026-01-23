import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, Keyboard, CheckCircle, XCircle, Search } from 'lucide-react';
import { supabase } from './lib/supabase';

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
            const scanner = new Html5Qrcode('qr-reader');
            scannerRef.current = scanner;
            setIsScanning(true);
            setResult(null);

            await scanner.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                (decodedText) => {
                    handleCodeVerification(decodedText);
                    scanner.stop();
                    setIsScanning(false);
                },
                () => { } // Ignore errors during scanning
            );
        } catch (err) {
            console.error('Scanner error:', err);
            setResult({ success: false, message: 'Camera access denied or not available.' });
            setIsScanning(false);
        }
    };

    const stopScanner = () => {
        if (scannerRef.current?.isScanning) {
            scannerRef.current.stop();
            setIsScanning(false);
        }
    };

    const handleCodeVerification = async (code: string) => {
        setResult(null);

        // First check Offers (special_offers table)
        const { data: offer, error: offerError } = await supabase
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
        const { data: reward, error: rewardError } = await supabase
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
                message: `🎉 Loyalty Reward Verified: FREE PIZZA!`,
                data: reward
            });
            return;
        }

        // Not found
        setResult({
            success: false,
            message: 'Code not found or already redeemed.'
        });
    };

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (manualCode.trim()) {
            handleCodeVerification(manualCode.trim());
        }
    };

    return (
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Verify Offer / Loyalty Reward</h3>

            {/* Mode Switcher */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <button
                    className={`btn ${mode === 'scan' ? 'btn-primary' : ''}`}
                    onClick={() => { setMode('scan'); stopScanner(); }}
                    style={{ flex: 1, justifyContent: 'center', background: mode === 'scan' ? '' : '#f1f5f9', color: mode === 'scan' ? '' : '#64748b' }}
                >
                    <Camera size={20} /> Scan QR
                </button>
                <button
                    className={`btn ${mode === 'manual' ? 'btn-primary' : ''}`}
                    onClick={() => { setMode('manual'); stopScanner(); }}
                    style={{ flex: 1, justifyContent: 'center', background: mode === 'manual' ? '' : '#f1f5f9', color: mode === 'manual' ? '' : '#64748b' }}
                >
                    <Keyboard size={20} /> Enter Code
                </button>
            </div>

            {/* Scanner View */}
            {mode === 'scan' && (
                <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <div
                        id="qr-reader"
                        style={{
                            width: '100%',
                            maxWidth: 400,
                            margin: '0 auto 1rem',
                            borderRadius: 12,
                            overflow: 'hidden',
                            background: '#1e293b'
                        }}
                    />
                    {!isScanning ? (
                        <button className="btn btn-primary" onClick={startScanner} style={{ width: '100%', justifyContent: 'center' }}>
                            <Camera size={20} /> Start Camera
                        </button>
                    ) : (
                        <button className="btn" onClick={stopScanner} style={{ width: '100%', justifyContent: 'center', background: '#ef4444', color: 'white' }}>
                            Stop Scanning
                        </button>
                    )}
                </div>
            )}

            {/* Manual Entry */}
            {mode === 'manual' && (
                <form onSubmit={handleManualSubmit} className="card" style={{ padding: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                        Enter Verification Code
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                            type="text"
                            value={manualCode}
                            onChange={(e) => setManualCode(e.target.value)}
                            placeholder="e.g., PIZZA-1234-ABCD"
                            style={{
                                flex: 1,
                                padding: '0.75rem 1rem',
                                borderRadius: 8,
                                border: '1px solid #e2e8f0',
                                fontSize: '1rem'
                            }}
                        />
                        <button type="submit" className="btn btn-primary">
                            <Search size={20} /> Verify
                        </button>
                    </div>
                </form>
            )}

            {/* Result Display */}
            {result && (
                <div
                    className="card"
                    style={{
                        marginTop: '1.5rem',
                        padding: '1.5rem',
                        textAlign: 'center',
                        background: result.success ? '#f0fdf4' : '#fef2f2',
                        borderColor: result.success ? '#86efac' : '#fecaca'
                    }}
                >
                    {result.success ? (
                        <CheckCircle size={48} color="#22c55e" style={{ marginBottom: '1rem' }} />
                    ) : (
                        <XCircle size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
                    )}
                    <h4 style={{ margin: 0, color: result.success ? '#166534' : '#991b1b' }}>
                        {result.message}
                    </h4>
                    {result.data?.title && (
                        <p style={{ marginTop: '0.5rem', color: '#64748b' }}>
                            {result.data.description}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default VerifyPage;
