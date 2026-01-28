import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, QrCode, Copy, Check, X, Gift } from 'lucide-react';
import { supabase } from './lib/supabase';
import QRCode from 'react-qr-code';

interface Offer {
    id: string;
    title: string;
    description: string | null;
    price: number;
    discount_value: number | null;
    discount_type: string | null;
    valid_until: string | null;
    is_active: boolean;
    verification_code: string | null;
    qr_code_data: string | null;
    used_count: number;
    usage_limit: number | null;
    image_url: string | null;
}

const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'RASHT-';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

const OffersManager = () => {
    const [offers, setOffers] = useState<Offer[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
    const [showQRModal, setShowQRModal] = useState<Offer | null>(null);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: 0,
        discount_value: 0,
        discount_type: 'percentage',
        valid_until: '',
        is_active: true,
        usage_limit: 0
    });

    useEffect(() => {
        fetchOffers();
    }, []);

    const fetchOffers = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('special_offers')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) setOffers(data);
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const verificationCode = generateCode();
        const qrCodeData = `OFFER:${verificationCode}`;

        const payload = {
            ...formData,
            verification_code: editingOffer?.verification_code || verificationCode,
            qr_code_data: editingOffer?.qr_code_data || qrCodeData,
            used_count: editingOffer?.used_count || 0
        };

        if (editingOffer) {
            await supabase
                .from('special_offers')
                .update(payload)
                .eq('id', editingOffer.id);
        } else {
            await supabase
                .from('special_offers')
                .insert([payload]);
        }

        setShowModal(false);
        setEditingOffer(null);
        resetForm();
        fetchOffers();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this offer?')) return;
        await supabase.from('special_offers').delete().eq('id', id);
        fetchOffers();
    };

    const handleEdit = (offer: Offer) => {
        setEditingOffer(offer);
        setFormData({
            title: offer.title,
            description: offer.description || '',
            price: offer.price,
            discount_value: offer.discount_value || 0,
            discount_type: offer.discount_type || 'percentage',
            valid_until: offer.valid_until ? offer.valid_until.split('T')[0] : '',
            is_active: offer.is_active,
            usage_limit: offer.usage_limit || 0
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            price: 0,
            discount_value: 0,
            discount_type: 'percentage',
            valid_until: '',
            is_active: true,
            usage_limit: 0
        });
    };

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h3 style={{ margin: 0 }}>Offers & Promotions</h3>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>Create and manage special offers with QR codes</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => { resetForm(); setEditingOffer(null); setShowModal(true); }}
                >
                    <Plus size={20} /> New Offer
                </button>
            </div>

            {/* Offers Grid */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>Loading...</div>
            ) : offers.length === 0 ? (
                <div className="card" style={{ padding: '3rem', textAlign: 'center', borderStyle: 'dashed' }}>
                    <Gift size={48} color="#cbd5e1" style={{ margin: '0 auto 1rem' }} />
                    <h3>No offers yet</h3>
                    <p style={{ color: '#64748b' }}>Create your first offer to generate QR codes for customers.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                    {offers.map(offer => (
                        <div key={offer.id} className="card" style={{ padding: '1.25rem' }}>
                            {/* Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <span style={{
                                    padding: '4px 10px',
                                    borderRadius: 20,
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    background: offer.is_active ? '#dcfce7' : '#fee2e2',
                                    color: offer.is_active ? '#166534' : '#991b1b'
                                }}>
                                    {offer.is_active ? 'Active' : 'Inactive'}
                                </span>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => setShowQRModal(offer)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1' }}
                                        title="View QR Code"
                                    >
                                        <QrCode size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleEdit(offer)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                                        title="Edit"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(offer.id)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                                        title="Delete"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <h4 style={{ margin: '0 0 0.5rem' }}>{offer.title}</h4>
                            <p style={{ margin: '0 0 1rem', color: '#64748b', fontSize: '0.875rem' }}>{offer.description}</p>

                            {/* Stats */}
                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                                <span>💰 €{offer.price}</span>
                                <span>📊 {offer.used_count}/{offer.usage_limit || '∞'} used</span>
                            </div>

                            {/* Code */}
                            <div style={{
                                marginTop: '1rem',
                                padding: '0.75rem',
                                background: '#f8fafc',
                                borderRadius: 8,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                fontFamily: 'monospace'
                            }}>
                                <span>{offer.verification_code}</span>
                                <button
                                    onClick={() => copyCode(offer.verification_code || '')}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1' }}
                                >
                                    {copiedCode === offer.verification_code ? <Check size={16} /> : <Copy size={16} />}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div className="card" style={{ width: '100%', maxWidth: 500, padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>{editingOffer ? 'Edit Offer' : 'Create New Offer'}</h3>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid #e2e8f0' }}
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid #e2e8f0' }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Price (€)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid #e2e8f0' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Usage Limit</label>
                                    <input
                                        type="number"
                                        value={formData.usage_limit}
                                        onChange={e => setFormData({ ...formData, usage_limit: parseInt(e.target.value) })}
                                        placeholder="0 = unlimited"
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid #e2e8f0' }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Valid Until</label>
                                <input
                                    type="date"
                                    value={formData.valid_until}
                                    onChange={e => setFormData({ ...formData, valid_until: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid #e2e8f0' }}
                                />
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.is_active}
                                        onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                    />
                                    Active (visible to customers)
                                </label>
                            </div>

                            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                                {editingOffer ? 'Save Changes' : 'Create Offer'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* QR Code Modal */}
            {showQRModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div className="card" style={{ width: '100%', maxWidth: 400, padding: '2rem', textAlign: 'center' }}>
                        <button
                            onClick={() => setShowQRModal(null)}
                            style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                            <X size={24} />
                        </button>

                        <h3 style={{ marginBottom: '1.5rem' }}>{showQRModal.title}</h3>

                        <div style={{ background: 'white', padding: '1.5rem', borderRadius: 12, display: 'inline-block', marginBottom: '1.5rem' }}>
                            <QRCode value={showQRModal.qr_code_data || showQRModal.verification_code || ''} size={200} />
                        </div>

                        <div style={{
                            padding: '1rem',
                            background: '#f8fafc',
                            borderRadius: 8,
                            fontFamily: 'monospace',
                            fontSize: '1.25rem',
                            letterSpacing: '2px'
                        }}>
                            {showQRModal.verification_code}
                        </div>

                        <button
                            onClick={() => copyCode(showQRModal.verification_code || '')}
                            className="btn"
                            style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}
                        >
                            <Copy size={18} /> Copy Code
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OffersManager;
