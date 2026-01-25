import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Clock, Truck, ChefHat, MapPin, Phone, Package, Search } from 'lucide-react';
import { getUserOrders, getOrderItems, Order, OrderItem } from '../lib/database';
import { useAuth } from '../contexts/AuthContext';
import OrderTrackingMap from '../components/OrderTrackingMap';

interface OrderWithItems extends Order {
  items?: OrderItem[];
}

const statusConfig = {
  pending: {
    icon: <Clock size={24} />,
    color: '#eab308', // Goldish
    label: 'In Attesa',
    description: 'Ordine ricevuto'
  },
  confirmed: {
    icon: <CheckCircle size={24} />,
    color: '#059669', // Emerald 600
    label: 'Confermato',
    description: 'Ordine confermato'
  },
  preparing: {
    icon: <ChefHat size={24} />,
    color: '#d97706', // Amber 600
    label: 'In Preparazione',
    description: 'Stiamo preparando il tuo ordine'
  },
  ready: {
    icon: <Package size={24} />,
    color: '#16a34a', // Green 600
    label: 'Pronto',
    description: 'Pronto per ritiro/consegna'
  },
  in_delivery: {
    icon: <Truck size={24} />,
    color: '#ea580c', // Orange 600
    label: 'In Consegna',
    description: 'Il rider sta arrivando'
  },
  delivered: {
    icon: <Truck size={24} />,
    color: '#15803d', // Green 700
    label: 'Consegnato',
    description: 'Ordine consegnato'
  },
  cancelled: {
    icon: <Clock size={24} />,
    color: '#525252',
    label: 'Cancellato',
    description: 'Ordine cancellato'
  }
};

const OrdersPage: React.FC = () => {
  const { isLoggedIn, userEmail: authEmail } = useAuth();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [customerEmail, setCustomerEmail] = useState('');

  // React to auth changes - reset when logged out
  useEffect(() => {
    if (!isLoggedIn) {
      setOrders([]);
      setCustomerEmail('');
    }
  }, [isLoggedIn]);

  useEffect(() => {
    // For demo purposes, we'll ask user for email to show their orders
    // In a real app, this would come from authentication
    const email = localStorage.getItem('customer_email');
    if (email) {
      setCustomerEmail(email);
      loadOrders(email);
    } else {
      setLoading(false);
    }
  }, []);

  const loadOrders = async (email: string) => {
    setLoading(true);
    try {
      const ordersData = await getUserOrders(email);

      // Load items for each order
      const ordersWithItems = await Promise.all(
        ordersData.map(async (order) => {
          const items = await getOrderItems(order.id);
          return { ...order, items };
        })
      );

      setOrders(ordersWithItems);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string | null) => {
    const normalizedStatus = status?.toLowerCase() || 'pending';
    return statusConfig[normalizedStatus as keyof typeof statusConfig]?.color || '#666';
  };

  const getStatusConfig = (status: string | null) => {
    const normalizedStatus = status?.toLowerCase() || 'pending';
    return statusConfig[normalizedStatus as keyof typeof statusConfig] || statusConfig.pending;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="rashti-page" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-gold" style={{ fontSize: '18px', fontFamily: 'Cinzel' }}>
          Caricamento ordini...
        </motion.div>
      </div>
    );
  }

  if (!customerEmail) {
    return (
      <div className="rashti-page" style={{ alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rashti-card-light"
          style={{
            padding: '40px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            maxWidth: '350px',
            width: '100%',
            borderRadius: '20px'
          }}
        >
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>📧</div>
          <h2 className="rashti-title" style={{ fontSize: '24px', marginBottom: '10px', color: '#0d3d2e' }}>
            I Tuoi Ordini
          </h2>
          <p style={{ color: '#666', fontSize: '16px', marginBottom: '20px', fontFamily: 'Cormorant Garamond' }}>
            Inserisci la tua email per vedere lo storico degli ordini.
          </p>
          <div style={{ width: '100%' }}>
            <input
              type="email"
              placeholder="latua@email.com"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="rashti-input"
              style={{
                background: 'white',
                borderColor: '#e2e8f0',
                color: '#333',
                marginBottom: '15px'
              }}
            />
            <button
              onClick={() => {
                if (customerEmail) {
                  localStorage.setItem('customer_email', customerEmail);
                  loadOrders(customerEmail);
                }
              }}
              className="rashti-btn-primary"
              style={{ width: '100%' }}
            >
              Visualizza Ordini
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="rashti-page" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ textAlign: 'center' }}
        >
          <div style={{ fontSize: '80px', marginBottom: '20px' }}>📦</div>
          <h2 className="rashti-title" style={{ fontSize: '24px', marginBottom: '10px', color: '#0d3d2e' }}>
            Nessun Ordine
          </h2>
          <p style={{ color: '#666', fontSize: '18px', fontFamily: 'Cormorant Garamond' }}>
            Non hai ancora effettuato ordini.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="rashti-page" style={{ overflowY: 'auto' }}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ padding: '20px 0', paddingBottom: '40px' }}
      >
        <motion.h2
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          className="rashti-title"
          style={{
            fontSize: '28px',
            textAlign: 'center',
            marginBottom: '30px',
            color: '#0d3d2e'
          }}
        >
          Storico Ordini
        </motion.h2>

        <div style={{ display: 'grid', gap: '20px', padding: '0 20px' }}>
          {orders.map((order, index) => {
            const config = getStatusConfig(order.status);
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ delay: index * 0.05, type: 'spring', stiffness: 40, damping: 15 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedOrder(selectedOrder === order.id ? null : order.id)}
                className="rashti-card-light"
                style={{
                  padding: '20px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Status indicator bar */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: config.color
                  }}
                />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ color: config.color }}>
                      {config.icon}
                    </div>
                    <div>
                      <h3 style={{ color: '#0d3d2e', margin: 0, fontSize: '18px', fontFamily: 'Cinzel', fontWeight: 700 }}>
                        #{order.order_number.slice(-6)}
                      </h3>
                      <p style={{
                        color: config.color,
                        margin: '2px 0 0 0',
                        fontSize: '12px',
                        fontWeight: '700',
                        fontFamily: 'Cinzel',
                        textTransform: 'uppercase'
                      }}>
                        {config.label}
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#0d3d2e', fontFamily: 'Cinzel' }}>
                      €{order.total_amount.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {order.items?.length || 0} prodotti
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={14} color="#666" />
                    <span style={{ fontSize: '13px', color: '#666' }}>
                      {formatDate(order.created_at)}
                    </span>
                  </div>
                </div>

                {/* Live Tracking Map for orders in delivery */}
                {((order as any).delivery_status === 'in_delivery' || (order as any).delivery_status === 'assigned') && (order as any).rider_id && (
                  <div style={{ marginBottom: '15px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #c9a45c' }} onClick={(e) => e.stopPropagation()}>
                    <OrderTrackingMap
                      orderId={order.id}
                      riderId={(order as any).rider_id}
                      customerAddress={order.customer_address || ''}
                      customerLat={(order as any).customer_lat}
                      customerLng={(order as any).customer_lng}
                      onDelivered={() => loadOrders(customerEmail)}
                    />
                  </div>
                )}

                {/* Order Items */}
                <AnimatePresence>
                  {selectedOrder === order.id && order.items && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{
                        borderTop: '1px solid rgba(0,0,0,0.05)',
                        paddingTop: '15px',
                        marginTop: '10px'
                      }}
                    >
                      <h4 style={{ color: '#0d3d2e', margin: '0 0 10px 0', fontSize: '14px', fontFamily: 'Cinzel' }}>
                        Dettaglio Ordine:
                      </h4>
                      {order.items.map((item, itemIndex) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: itemIndex * 0.1 }}
                          style={{
                            padding: '8px 0',
                            borderBottom: '1px dashed #eee',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div>
                            <div style={{ fontSize: '14px', color: '#333', fontWeight: '600' }}>
                              {item.product_name} x {item.quantity}
                            </div>
                            {item.special_requests && (
                              <div style={{ fontSize: '12px', color: '#666', fontStyle: 'italic' }}>
                                Note: {item.special_requests}
                              </div>
                            )}
                          </div>
                          <div style={{ fontSize: '14px', color: '#c9a45c', fontWeight: 'bold' }}>
                            €{item.subtotal.toFixed(2)}
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default OrdersPage;
