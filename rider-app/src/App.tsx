import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogIn,
  MapPin,
  Phone,
  Navigation,
  CheckCircle2,
  Package,
  User,
  Clock,
  Euro,
  FileText,
  LogOut
} from 'lucide-react';
import { supabase } from './lib/supabase';
import type { Rider, DeliveryOrder } from './lib/supabase';
import { useGPSTracking } from './hooks/useGPSTracking';
import './index.css';

function App() {
  const [rider, setRider] = useState<Rider | null>(null);
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [activeDelivery, setActiveDelivery] = useState<DeliveryOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginError, setLoginError] = useState('');

  // GPS Tracking - only active when delivering
  const { isTracking, currentPosition } = useGPSTracking({
    riderId: rider?.id || '',
    enabled: !!activeDelivery && !!rider,
    intervalMs: 5000, // Send every 5 seconds
  });

  // Load rider from localStorage on mount
  useEffect(() => {
    const savedRider = localStorage.getItem('rider');
    if (savedRider) {
      setRider(JSON.parse(savedRider));
    }
  }, []);

  // Load orders for this rider
  useEffect(() => {
    if (rider) {
      loadOrders();

      // Subscribe to realtime order updates
      const subscription = supabase
        .channel('rider-orders')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'orders', filter: `rider_id=eq.${rider.id}` },
          () => loadOrders()
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [rider]);

  const loadOrders = async () => {
    if (!rider) return;

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('rider_id', rider.id)
      .in('delivery_status', ['assigned', 'in_delivery'])
      .order('created_at', { ascending: true });

    if (!error && data) {
      setOrders(data as DeliveryOrder[]);
      // Auto-select first in_delivery order
      const inDelivery = data.find(o => o.delivery_status === 'in_delivery');
      if (inDelivery) {
        setActiveDelivery(inDelivery as DeliveryOrder);
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError('');

    const { data, error } = await supabase
      .from('riders')
      .select('*')
      .eq('email', loginEmail.toLowerCase())
      .eq('is_active', true)
      .single();

    if (error || !data) {
      setLoginError('Rider non trovato o non attivo');
    } else {
      setRider(data);
      localStorage.setItem('rider', JSON.stringify(data));
    }

    setLoading(false);
  };

  const handleLogout = () => {
    setRider(null);
    setOrders([]);
    setActiveDelivery(null);
    localStorage.removeItem('rider');
  };

  const handleStartDelivery = async (order: DeliveryOrder) => {
    setActiveDelivery(order);

    await supabase
      .from('orders')
      .update({
        delivery_status: 'in_delivery',
        dispatched_at: new Date().toISOString()
      })
      .eq('id', order.id);

    loadOrders();
  };

  const handleMarkDelivered = async () => {
    if (!activeDelivery) return;

    await supabase
      .from('orders')
      .update({
        delivery_status: 'delivered',
        delivered_at: new Date().toISOString(),
        order_status: 'delivered'
      })
      .eq('id', activeDelivery.id);

    setActiveDelivery(null);
    loadOrders();
  };

  const openNavigation = (address: string) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
    window.open(url, '_blank');
  };

  const callCustomer = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  // Login Screen
  if (!rider) {
    return (
      <div className="login-container">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="login-logo"
        >
          🛵
        </motion.div>
        <h1 className="login-title">Time Out Pizza</h1>
        <p className="login-subtitle">Rider App</p>

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="rider@timeout.it"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              required
            />
          </div>

          {loginError && (
            <p style={{ color: '#ef4444', marginBottom: '16px', fontSize: '14px' }}>
              {loginError}
            </p>
          )}

          <button type="submit" className="btn-primary" disabled={loading}>
            <LogIn size={20} />
            {loading ? 'Caricamento...' : 'Accedi'}
          </button>
        </form>
      </div>
    );
  }

  // Active Delivery View
  if (activeDelivery) {
    return (
      <div className="delivery-view">
        <div className="delivery-header">
          <div className="delivery-status-bar">
            <div className="status-step">
              <div className="status-dot active" />
              <span className="status-label">Assegnato</span>
            </div>
            <div className="status-step">
              <div className="status-dot current" />
              <span className="status-label">In Consegna</span>
            </div>
            <div className="status-step">
              <div className="status-dot" />
              <span className="status-label">Consegnato</span>
            </div>
          </div>

          {isTracking && (
            <div className="tracking-indicator">
              <span className="tracking-dot" />
              GPS Attivo - Posizione condivisa
            </div>
          )}

          <h2 style={{ fontSize: '20px', marginBottom: '4px' }}>
            Ordine #{activeDelivery.order_number}
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>
            {new Date(activeDelivery.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        <div className="customer-details">
          <div className="detail-row">
            <User className="detail-icon" size={20} />
            <div className="detail-content">
              <h4>Cliente</h4>
              <p>{activeDelivery.customer_name}</p>
            </div>
          </div>

          <div className="detail-row" onClick={() => openNavigation(activeDelivery.customer_address)} style={{ cursor: 'pointer' }}>
            <MapPin className="detail-icon" size={20} />
            <div className="detail-content">
              <h4>Indirizzo</h4>
              <p>{activeDelivery.customer_address}</p>
            </div>
            <Navigation size={20} style={{ marginLeft: 'auto', color: '#3b82f6' }} />
          </div>

          <div className="detail-row" onClick={() => callCustomer(activeDelivery.customer_phone)} style={{ cursor: 'pointer' }}>
            <Phone className="detail-icon" size={20} />
            <div className="detail-content">
              <h4>Telefono</h4>
              <p>{activeDelivery.customer_phone}</p>
            </div>
            <Phone size={20} style={{ marginLeft: 'auto', color: '#22c55e' }} />
          </div>

          <div className="detail-row">
            <Euro className="detail-icon" size={20} />
            <div className="detail-content">
              <h4>Totale</h4>
              <p>€{activeDelivery.total_amount.toFixed(2)}</p>
            </div>
          </div>

          {activeDelivery.notes && (
            <div className="detail-row">
              <FileText className="detail-icon" size={20} />
              <div className="detail-content">
                <h4>Note</h4>
                <p>{activeDelivery.notes}</p>
              </div>
            </div>
          )}

          {currentPosition && (
            <div className="detail-row" style={{ background: 'rgba(34, 197, 94, 0.1)' }}>
              <MapPin className="detail-icon" size={20} style={{ color: '#22c55e' }} />
              <div className="detail-content">
                <h4>La tua posizione</h4>
                <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                  {currentPosition.coords.latitude.toFixed(5)}, {currentPosition.coords.longitude.toFixed(5)}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="delivery-actions">
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <button
              className="btn-action btn-navigate"
              style={{ flex: 1 }}
              onClick={() => openNavigation(activeDelivery.customer_address)}
            >
              <Navigation size={18} />
              Naviga
            </button>
            <button
              className="btn-action btn-call"
              style={{ flex: 1 }}
              onClick={() => callCustomer(activeDelivery.customer_phone)}
            >
              <Phone size={18} />
              Chiama
            </button>
          </div>
          <button className="btn-primary btn-delivered" onClick={handleMarkDelivered}>
            <CheckCircle2 size={20} />
            Consegnato ✓
          </button>
        </div>
      </div>
    );
  }

  // Orders List View
  return (
    <div className="app-container">
      <div className="header">
        <h1>🍕 Consegne</h1>
        <div className="rider-badge" onClick={handleLogout} style={{ cursor: 'pointer' }}>
          <span className="dot" />
          {rider.name}
          <LogOut size={14} />
        </div>
      </div>

      <AnimatePresence>
        {orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="empty-state"
          >
            <div className="empty-icon">📦</div>
            <h2 className="empty-title">Nessuna consegna</h2>
            <p className="empty-text">In attesa di nuovi ordini...</p>
          </motion.div>
        ) : (
          <div className="orders-list">
            {orders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="order-card"
              >
                <div className="order-header">
                  <span className="order-number">#{order.order_number}</span>
                  <span className={`order-status ${order.delivery_status}`}>
                    {order.delivery_status === 'assigned' ? '⏳ Assegnato' : '🛵 In Consegna'}
                  </span>
                </div>

                <div className="order-customer">
                  <p className="customer-name">{order.customer_name}</p>
                  <p className="customer-address">
                    <MapPin size={14} />
                    {order.customer_address}
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8', fontSize: '14px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={14} />
                    {new Date(order.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span style={{ fontWeight: 'bold', color: '#22c55e' }}>
                    €{order.total_amount.toFixed(2)}
                  </span>
                </div>

                <div className="order-actions">
                  <button className="btn-action btn-call" onClick={() => callCustomer(order.customer_phone)}>
                    <Phone size={16} />
                    Chiama
                  </button>
                  <button className="btn-action btn-navigate" onClick={() => openNavigation(order.customer_address)}>
                    <Navigation size={16} />
                    Naviga
                  </button>
                  {order.delivery_status === 'assigned' && (
                    <button className="btn-action btn-start" onClick={() => handleStartDelivery(order)}>
                      <Package size={16} />
                      Inizia
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
