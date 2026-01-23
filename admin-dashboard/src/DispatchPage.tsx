import { useState, useEffect } from 'react';
import { Truck, User, MapPin, Clock, Phone, Check, AlertCircle } from 'lucide-react';
import { supabase } from './lib/supabase';
import AdminRiderMap from './AdminRiderMap';

interface Order {
    id: string;
    order_number: string;
    customer_name: string;
    customer_phone: string;
    customer_address: string;
    total_amount: number;
    delivery_status: string;
    delivery_type: string;
    created_at: string;
    rider_id?: string;
}

interface Rider {
    id: string;
    name: string;
    phone: string;
    is_active: boolean;
}

export default function DispatchPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [riders, setRiders] = useState<Rider[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRider, setSelectedRider] = useState<{ [orderId: string]: string }>({});

    useEffect(() => {
        loadData();

        // Subscribe to realtime updates
        const subscription = supabase
            .channel('dispatch-updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => loadData())
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const loadData = async () => {
        // Load pending delivery orders
        const { data: ordersData } = await supabase
            .from('orders')
            .select('*')
            .eq('delivery_type', 'delivery')
            .in('delivery_status', ['pending', 'assigned', 'in_delivery'])
            .order('created_at', { ascending: true });

        // Load active riders
        const { data: ridersData } = await supabase
            .from('riders')
            .select('*')
            .eq('is_active', true);

        setOrders(ordersData || []);
        setRiders(ridersData || []);
        setLoading(false);
    };

    const handleAssignRider = async (orderId: string) => {
        const riderId = selectedRider[orderId];
        if (!riderId) {
            alert('Seleziona un rider prima!');
            return;
        }

        const { error } = await supabase
            .from('orders')
            .update({
                rider_id: riderId,
                delivery_status: 'assigned'
            })
            .eq('id', orderId);

        if (error) {
            alert('Errore nell\'assegnazione: ' + error.message);
        } else {
            loadData();
        }
    };

    const handleMarkOutForDelivery = async (orderId: string) => {
        await supabase
            .from('orders')
            .update({
                delivery_status: 'in_delivery',
                dispatched_at: new Date().toISOString()
            })
            .eq('id', orderId);

        loadData();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return '#f59e0b';
            case 'assigned': return '#3b82f6';
            case 'in_delivery': return '#22c55e';
            default: return '#6b7280';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending': return '⏳ In Attesa';
            case 'assigned': return '👤 Assegnato';
            case 'in_delivery': return '🛵 In Consegna';
            default: return status;
        }
    };

    if (loading) {
        return <div style={{ padding: '40px', textAlign: 'center' }}>Caricamento...</div>;
    }

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Truck size={28} />
                    Dispatch Consegne
                </h2>
                <div style={{
                    padding: '8px 16px',
                    background: '#22c55e20',
                    borderRadius: '20px',
                    color: '#22c55e',
                    fontWeight: 'bold'
                }}>
                    {riders.length} Rider Attivi
                </div>
            </div>

            {/* Live Rider Map */}
            <AdminRiderMap height="350px" />

            {orders.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    background: '#f8fafc',
                    borderRadius: '16px'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
                    <h3 style={{ marginBottom: '8px' }}>Nessun ordine in attesa</h3>
                    <p style={{ color: '#64748b' }}>Gli ordini per consegna appariranno qui</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                    {orders.map(order => (
                        <div
                            key={order.id}
                            style={{
                                background: 'white',
                                borderRadius: '16px',
                                padding: '20px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                border: '1px solid #e2e8f0'
                            }}
                        >
                            {/* Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                <div>
                                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ea580c' }}>
                                        #{order.order_number}
                                    </div>
                                    <div style={{ fontSize: '14px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                        <Clock size={14} />
                                        {new Date(order.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                                <span style={{
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    background: `${getStatusColor(order.delivery_status)}20`,
                                    color: getStatusColor(order.delivery_status)
                                }}>
                                    {getStatusLabel(order.delivery_status)}
                                </span>
                            </div>

                            {/* Customer Info */}
                            <div style={{ marginBottom: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <User size={16} color="#64748b" />
                                    <span style={{ fontWeight: '600' }}>{order.customer_name}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                                    <MapPin size={16} color="#64748b" style={{ marginTop: '2px' }} />
                                    <span style={{ color: '#475569', fontSize: '14px' }}>{order.customer_address}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Phone size={16} color="#64748b" />
                                    <a href={`tel:${order.customer_phone}`} style={{ color: '#3b82f6', fontSize: '14px' }}>
                                        {order.customer_phone}
                                    </a>
                                </div>
                            </div>

                            {/* Amount */}
                            <div style={{
                                padding: '12px 16px',
                                background: '#f1f5f9',
                                borderRadius: '10px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '16px'
                            }}>
                                <span style={{ color: '#64748b' }}>Totale</span>
                                <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#22c55e' }}>
                                    €{order.total_amount.toFixed(2)}
                                </span>
                            </div>

                            {/* Actions based on status */}
                            {order.delivery_status === 'pending' && (
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <select
                                        value={selectedRider[order.id] || ''}
                                        onChange={(e) => setSelectedRider({ ...selectedRider, [order.id]: e.target.value })}
                                        style={{
                                            flex: 1,
                                            padding: '12px',
                                            borderRadius: '10px',
                                            border: '1px solid #e2e8f0',
                                            fontSize: '14px'
                                        }}
                                    >
                                        <option value="">Seleziona Rider...</option>
                                        {riders.map(rider => (
                                            <option key={rider.id} value={rider.id}>
                                                🛵 {rider.name}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={() => handleAssignRider(order.id)}
                                        style={{
                                            padding: '12px 20px',
                                            borderRadius: '10px',
                                            border: 'none',
                                            background: '#3b82f6',
                                            color: 'white',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}
                                    >
                                        <Check size={18} />
                                        Assegna
                                    </button>
                                </div>
                            )}

                            {order.delivery_status === 'assigned' && (
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <div style={{
                                        flex: 1,
                                        padding: '12px 16px',
                                        background: '#dbeafe',
                                        borderRadius: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}>
                                        <User size={18} color="#3b82f6" />
                                        <span style={{ color: '#1e40af', fontWeight: '600' }}>
                                            {riders.find(r => r.id === order.rider_id)?.name || 'Rider'}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleMarkOutForDelivery(order.id)}
                                        style={{
                                            padding: '12px 20px',
                                            borderRadius: '10px',
                                            border: 'none',
                                            background: '#22c55e',
                                            color: 'white',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}
                                    >
                                        <Truck size={18} />
                                        Invia in Consegna
                                    </button>
                                </div>
                            )}

                            {order.delivery_status === 'in_delivery' && (
                                <div style={{
                                    padding: '12px 16px',
                                    background: '#dcfce7',
                                    borderRadius: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    justifyContent: 'center'
                                }}>
                                    <div style={{
                                        width: '10px',
                                        height: '10px',
                                        background: '#22c55e',
                                        borderRadius: '50%',
                                        animation: 'pulse 1.5s infinite'
                                    }} />
                                    <span style={{ color: '#166534', fontWeight: '600' }}>
                                        🛵 In consegna - {riders.find(r => r.id === order.rider_id)?.name}
                                    </span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Riders Panel */}
            <div style={{ marginTop: '32px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <User size={20} />
                    Rider Disponibili
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                    {riders.map(rider => (
                        <div
                            key={rider.id}
                            style={{
                                padding: '16px',
                                background: 'white',
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px'
                            }}
                        >
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: '#ea580c20',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '20px'
                            }}>
                                🛵
                            </div>
                            <div>
                                <div style={{ fontWeight: '600' }}>{rider.name}</div>
                                <div style={{ fontSize: '12px', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ width: '6px', height: '6px', background: '#22c55e', borderRadius: '50%' }} />
                                    Attivo
                                </div>
                            </div>
                        </div>
                    ))}
                    {riders.length === 0 && (
                        <div style={{
                            padding: '20px',
                            background: '#fef3c7',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}>
                            <AlertCircle size={20} color="#d97706" />
                            <span style={{ color: '#92400e' }}>Nessun rider attivo</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
