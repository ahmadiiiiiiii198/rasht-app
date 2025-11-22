import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Clock, Truck, ChefHat, MapPin, Phone, Mail, Package } from 'lucide-react';
import { getUserOrders, getOrderItems, Order, OrderItem } from '../lib/database';

interface OrderWithItems extends Order {
  items?: OrderItem[];
}

const statusConfig = {
  pending: {
    icon: <Clock size={24} />,
    color: '#FF6B6B',
    label: 'Pending',
    description: 'Order received and being processed'
  },
  confirmed: {
    icon: <CheckCircle size={24} />,
    color: '#4ECDC4',
    label: 'Confirmed',
    description: 'Order confirmed and being prepared'
  },
  preparing: {
    icon: <ChefHat size={24} />,
    color: '#FFA726',
    label: 'Preparing',
    description: 'Your order is being prepared'
  },
  ready: {
    icon: <Package size={24} />,
    color: '#66BB6A',
    label: 'Ready',
    description: 'Order ready for pickup/delivery'
  },
  delivered: {
    icon: <Truck size={24} />,
    color: '#2ed573',
    label: 'Delivered',
    description: 'Order has been delivered'
  },
  cancelled: {
    icon: <Clock size={24} />,
    color: '#757575',
    label: 'Cancelled',
    description: 'Order has been cancelled'
  }
};

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [customerEmail, setCustomerEmail] = useState('');

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
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          padding: '40px 20px',
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          color: '#666'
        }}
      >
        Loading your orders...
      </motion.div>
    );
  }

  if (!customerEmail) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          padding: '40px 20px',
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center'
        }}
      >
        <div style={{ fontSize: '60px', marginBottom: '20px' }}>📧</div>
        <h2 style={{ fontSize: '24px', marginBottom: '10px', color: '#333' }}>
          Email Required
        </h2>
        <p style={{ color: '#666', fontSize: '16px', marginBottom: '20px' }}>
          Please provide your email to view your orders
        </p>
        <div style={{ width: '100%', maxWidth: '300px' }}>
          <input
            type="email"
            placeholder="Enter your email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              marginBottom: '10px',
              fontSize: '16px'
            }}
          />
          <button
            onClick={() => {
              if (customerEmail) {
                localStorage.setItem('customer_email', customerEmail);
                loadOrders(customerEmail);
              }
            }}
            style={{
              width: '100%',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              background: '#667eea',
              color: 'white',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            View Orders
          </button>
        </div>
      </motion.div>

    );
  }

  if (orders.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          padding: '40px 20px',
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center'
        }}
      >
        <div style={{ fontSize: '80px', marginBottom: '20px' }}>📦</div>
        <h2 style={{ fontSize: '24px', marginBottom: '10px', color: '#333' }}>
          No Orders Yet
        </h2>
        <p style={{ color: '#666', fontSize: '16px' }}>
          You haven't placed any orders yet. Start shopping!
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ padding: '20px 0', paddingBottom: '40px' }}
    >
      <motion.h2
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        style={{
          fontSize: '28px',
          fontWeight: 'bold',
          color: '#333',
          textAlign: 'center',
          marginBottom: '30px'
        }}
      >
        Your Orders 📦
      </motion.h2>

      <div style={{ display: 'grid', gap: '20px' }}>
        {orders.map((order, index) => {
          const config = getStatusConfig(order.status);
          return (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedOrder(selectedOrder === order.id ? null : order.id)}
              style={{
                background: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '20px',
                padding: '25px',
                boxShadow: '0 5px 20px rgba(0,0,0,0.1)',
                border: '1px solid rgba(255,255,255,0.3)',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Status indicator */}
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
                    <h3 style={{ color: '#333', margin: 0, fontSize: '18px' }}>
                      #{order.order_number}
                    </h3>
                    <p style={{
                      color: config.color,
                      margin: '2px 0 0 0',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}>
                      {config.label}
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#333' }}>
                    €{order.total_amount.toFixed(2)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {order.items?.length || 0} items
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={16} color="#666" />
                  <span style={{ fontSize: '14px', color: '#666' }}>
                    {formatDate(order.created_at)}
                  </span>
                </div>
                {order.estimated_delivery_time && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Truck size={16} color="#FF6B6B" />
                    <span style={{ fontSize: '14px', color: '#FF6B6B', fontWeight: '600' }}>
                      ETA: {new Date(order.estimated_delivery_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
              </div>

              {order.customer_address && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                  <MapPin size={16} color="#666" />
                  <span style={{ fontSize: '14px', color: '#666' }}>
                    {order.customer_address}
                  </span>
                </div>
              )}

              {order.customer_phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                  <Phone size={16} color="#666" />
                  <span style={{ fontSize: '14px', color: '#666' }}>
                    {order.customer_phone}
                  </span>
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
                      borderTop: '1px solid rgba(0,0,0,0.1)',
                      paddingTop: '15px',
                      marginTop: '15px'
                    }}
                  >
                    <h4 style={{ color: '#333', margin: '0 0 10px 0', fontSize: '16px' }}>
                      Order Items:
                    </h4>
                    {order.items.map((item, itemIndex) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: itemIndex * 0.1 }}
                        style={{
                          background: 'rgba(0,0,0,0.05)',
                          padding: '10px 15px',
                          borderRadius: '10px',
                          marginBottom: '8px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '14px', color: '#333', fontWeight: '600' }}>
                            {item.product_name} x{item.quantity}
                          </div>
                          {item.special_requests && (
                            <div style={{ fontSize: '12px', color: '#666', fontStyle: 'italic' }}>
                              Note: {item.special_requests}
                            </div>
                          )}
                        </div>
                        <div style={{ fontSize: '14px', color: '#FF6B6B', fontWeight: 'bold' }}>
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
  );
};

export default OrdersPage;
