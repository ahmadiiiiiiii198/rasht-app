import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, ShoppingCart, Trash2, CreditCard, Clock, Loader2, X, AlertCircle } from 'lucide-react';
import { createOrder, CreateOrderData } from '../lib/database';
import { useCart } from '../hooks/useCart';

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
}

const CartPage: React.FC = () => {
  const cart = useCart();
  const [showCheckout, setShowCheckout] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'later'>('stripe');
  const [deliveryFee, setDeliveryFee] = useState(2.50);
  const [promoCode, setPromoCode] = useState('');
  const [isValidatingAddress, setIsValidatingAddress] = useState(false);
  const [addressValidation, setAddressValidation] = useState<{
    isValid: boolean;
    isWithinZone: boolean;
    message: string;
    deliveryFee: number;
    estimatedTime: string;
  } | null>(null);

  const handleCheckout = async () => {
    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone || !customerInfo.address || !addressValidation?.isValid || !addressValidation?.isWithinZone) {
      alert('Please fill in all customer information');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderData: CreateOrderData = {
        customer_name: customerInfo.name,
        customer_email: customerInfo.email,
        customer_phone: customerInfo.phone,
        customer_address: customerInfo.address,
        total_amount: cart.getTotalPrice() + deliveryFee,
        delivery_type: 'delivery',
        payment_method: paymentMethod === 'stripe' ? 'card' : 'cash',
        special_instructions: (addressValidation?.estimatedTime ? `ETA: ${addressValidation.estimatedTime}` : 'Mobile app order') + (promoCode ? ` | Promo: ${promoCode}` : ''),
        items: cart.items.map(item => ({
          product_id: item.id,
          product_name: item.name,
          quantity: item.quantity,
          price: item.price,
          special_requests: item.specialRequests
        }))
      };

      const orderId = await createOrder(orderData);

      if (orderId) {
        alert('Order placed successfully!');
        cart.clearCart();
        setShowCheckout(false);
        setCustomerInfo({ name: '', email: '', phone: '', address: '' });
      } else {
        alert('Failed to place order. Please try again.');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Error placing order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateAddress = async (address: string) => {
    if (!address.trim()) {
      setAddressValidation(null);
      setDeliveryFee(2.5);
      return;
    }

    setIsValidatingAddress(true);
    await new Promise(resolve => setTimeout(resolve, 600));

    const isTorino = /torino|to|101/i.test(address);
    if (address.trim().length < 8) {
      setAddressValidation({
        isValid: false,
        isWithinZone: false,
        message: 'Per favore inserisci un indirizzo completo.',
        deliveryFee: 0,
        estimatedTime: 'N/A'
      });
      setIsValidatingAddress(false);
      return;
    }

    if (!isTorino) {
      setAddressValidation({
        isValid: true,
        isWithinZone: false,
        message: 'Al momento consegniamo solo a Torino e zone limitrofe.',
        deliveryFee: 0,
        estimatedTime: 'N/A'
      });
      setIsValidatingAddress(false);
      return;
    }

    setAddressValidation({
      isValid: true,
      isWithinZone: true,
      message: 'Indirizzo valido! Consegna stimata 30-40 minuti.',
      deliveryFee: 2.5,
      estimatedTime: '30-40 minuti'
    });
    setDeliveryFee(2.5);
    setIsValidatingAddress(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (showCheckout) {
        validateAddress(customerInfo.address);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [customerInfo.address, showCheckout]);

  if (cart.items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          padding: '40px 0',
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center'
        }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          style={{ fontSize: '80px', marginBottom: '20px' }}
        >
          🛒
        </motion.div>
        <h2 style={{ fontSize: '24px', marginBottom: '10px', color: '#333' }}>
          Your cart is empty
        </h2>
        <p style={{ color: '#666', fontSize: '16px' }}>
          Add some delicious items from our menu!
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ paddingBottom: '20px' }}
    >
      {!showCheckout ? (
        <>
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
            Your Cart 🛒
          </motion.h2>

          {/* Cart Items */}
          <div style={{ marginBottom: '20px' }}>
            <AnimatePresence>
              {cart.items.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.1 }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '15px',
                    padding: '20px',
                    marginBottom: '15px',
                    boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
                    border: '1px solid rgba(255,255,255,0.3)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ fontSize: '30px' }}>
                      {item.image_url ? (
                        <img 
                          src={item.image_url} 
                          alt={item.name}
                          style={{ 
                            width: '50px', 
                            height: '50px', 
                            borderRadius: '8px',
                            objectFit: 'cover'
                          }}
                        />
                      ) : '🍽️'}
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <h3 style={{ 
                        margin: '0 0 5px 0', 
                        fontSize: '16px', 
                        color: '#333',
                        fontWeight: '600'
                      }}>
                        {item.name}
                      </h3>
                      <p style={{ 
                        margin: '0 0 10px 0', 
                        fontSize: '14px', 
                        color: '#666' 
                      }}>
                        €{(item.price / 100).toFixed(2)} each
                      </p>
                      
                      {/* Extras */}
                      {item.extras && item.extras.length > 0 && (
                        <div style={{ 
                          margin: '8px 0', 
                          fontSize: '12px', 
                          color: '#22c55e',
                          fontWeight: '600'
                        }}>
                          ✓ Extras: {item.extras.map(e => `${e.name} x${e.quantity}`).join(', ')}
                        </div>
                      )}
                      
                      {/* Beverages */}
                      {item.beverages && item.beverages.length > 0 && (
                        <div style={{ 
                          margin: '8px 0', 
                          fontSize: '12px', 
                          color: '#3b82f6',
                          fontWeight: '600'
                        }}>
                          🥤 Beverages: {item.beverages.map(b => `${b.name} x${b.quantity}`).join(', ')}
                        </div>
                      )}
                      
                      {/* Special Requests */}
                      {item.specialRequests && (
                        <p style={{ 
                          margin: '8px 0 0 0', 
                          fontSize: '12px', 
                          color: '#888',
                          fontStyle: 'italic'
                        }}>
                          📝 Note: {item.specialRequests}
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => cart.updateQuantity(item.id, item.quantity - 1)}
                          style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '50%',
                            border: 'none',
                            background: '#ff4757',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          <Minus size={14} />
                        </motion.button>
                        
                        <span style={{
                          fontSize: '16px',
                          fontWeight: 'bold',
                          color: '#333',
                          minWidth: '25px',
                          textAlign: 'center'
                        }}>
                          {item.quantity}
                        </span>
                        
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => cart.updateQuantity(item.id, item.quantity + 1)}
                          style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '50%',
                            border: 'none',
                            background: '#2ed573',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          <Plus size={14} />
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => cart.removeItem(item.id)}
                          style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '50%',
                            border: 'none',
                            background: '#ff6b6b',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          <Trash2 size={14} />
                        </motion.button>
                      </div>
                      
                      <div style={{ 
                        fontSize: '16px', 
                        fontWeight: 'bold', 
                        color: '#FF6B6B',
                        textAlign: 'right'
                      }}>
                        €{(() => {
                          let total = item.price * item.quantity;
                          if (item.extras && item.extras.length > 0) {
                            total += item.extras.reduce((sum, e) => sum + (e.price * e.quantity), 0);
                          }
                          if (item.beverages && item.beverages.length > 0) {
                            total += item.beverages.reduce((sum, b) => sum + (b.price * b.quantity), 0);
                          }
                          return total.toFixed(2);
                        })()}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Order Summary */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            style={{
              background: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '15px',
              padding: '20px',
              marginBottom: '20px',
              boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
            }}
          >
            <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#333' }}>
              Order Summary
            </h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span>Subtotal ({cart.getTotalItems()} items):</span>
              <span>€{cart.getTotalPrice().toFixed(2)}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span>Delivery Fee:</span>
              <span>€{deliveryFee.toFixed(2)}</span>
            </div>
            
            <div style={{ 
              borderTop: '1px solid #eee', 
              paddingTop: '10px',
              display: 'flex', 
              justifyContent: 'space-between',
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#333'
            }}>
              <span>Total:</span>
              <span>€{(cart.getTotalPrice() + deliveryFee).toFixed(2)}</span>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={cart.clearCart}
              style={{
                flex: 1,
                padding: '15px',
                borderRadius: '12px',
                border: '2px solid #ff6b6b',
                background: 'transparent',
                color: '#ff6b6b',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Clear Cart
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowCheckout(true)}
              style={{
                flex: 2,
                padding: '15px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <ShoppingCart size={18} />
              Proceed to Checkout
            </motion.button>
          </div>
        </>
      ) : (
        // Checkout Form - Website Replica
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{
            background: 'white',
            borderRadius: '16px',
            padding: '28px',
            boxShadow: '0 25px 50px rgba(0,0,0,0.1)',
            width: '100%'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Passo 2 di 2</p>
              <h2 style={{ margin: '6px 0 0 0', fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>
                Checkout - {cart.items.length} prodotti
              </h2>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => setShowCheckout(false)}
              style={{
                border: 'none',
                background: '#f1f5f9',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={18} color="#0f172a" />
            </motion.button>
          </div>

          {/* Validation */}
          {(!customerInfo.name || !customerInfo.email || !customerInfo.phone || !customerInfo.address) && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 16px',
              borderRadius: '10px',
              background: '#fff7ed',
              color: '#c2410c',
              marginBottom: '20px'
            }}>
              <AlertCircle size={18} />
              <span>Compila tutti i campi obbligatori per completare l'ordine.</span>
            </div>
          )}

          {/* Grid layout */}
          <div className="checkout-grid">
            <div>
              {/* Customer Info */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>Informazioni Cliente</h3>
                <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: '1fr 1fr' }}>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>Nome Completo *</label>
                    <input
                      type="text"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Il tuo nome completo"
                      style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>Email *</label>
                    <input
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="la-tua-email@esempio.com"
                      style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px' }}
                    />
                  </div>
                </div>
                <div style={{ marginTop: '16px', display: 'grid', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>Telefono *</label>
                    <input
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+39 123 456 7890"
                      style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>Indirizzo di Consegna *</label>
                    <input
                      type="text"
                      value={customerInfo.address}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Via Roma 123, Milano"
                      style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Payment Tabs */}
              <div>
                <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid #e2e8f0', marginBottom: '16px' }}>
                  <button
                    onClick={() => setPaymentMethod('stripe')}
                    style={{
                      border: 'none',
                      padding: '12px 18px',
                      borderBottom: paymentMethod === 'stripe' ? '3px solid #22c55e' : '3px solid transparent',
                      background: 'transparent',
                      fontWeight: 600,
                      color: paymentMethod === 'stripe' ? '#14532d' : '#94a3b8',
                      cursor: 'pointer'
                    }}
                  >
                    Paga Subito
                  </button>
                  <button
                    onClick={() => setPaymentMethod('later')}
                    style={{
                      border: 'none',
                      padding: '12px 18px',
                      borderBottom: paymentMethod === 'later' ? '3px solid #f59e0b' : '3px solid transparent',
                      background: 'transparent',
                      fontWeight: 600,
                      color: paymentMethod === 'later' ? '#78350f' : '#94a3b8',
                      cursor: 'pointer'
                    }}
                  >
                    Paga alla Consegna
                  </button>
                </div>

                <div style={{
                  background: paymentMethod === 'stripe' ? '#ecfdf5' : '#fff7ed',
                  border: `1px solid ${paymentMethod === 'stripe' ? '#bbf7d0' : '#fed7aa'}`,
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '24px'
                }}>
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: paymentMethod === 'stripe' ? '#065f46' : '#92400e' }}>
                    {paymentMethod === 'stripe' ? 'Pagamento Sicuro con Carta' : 'Paga in Contanti alla Consegna'}
                  </h4>
                  <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: paymentMethod === 'stripe' ? '#047857' : '#b45309', lineHeight: '1.6' }}>
                    {paymentMethod === 'stripe'
                      ? 'Paga subito con carta di credito o debito. Il tuo ordine sarà confermato immediatamente.'
                      : 'Conferma ora e paga in contanti quando arriva il rider.'}
                  </p>
                </div>

                {/* Promo Code */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                    Codice Promozionale
                  </label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      placeholder="Inserisci codice"
                      style={{ 
                        flex: 1,
                        padding: '12px', 
                        borderRadius: '10px', 
                        border: '1px solid #e2e8f0', 
                        fontSize: '14px',
                        textTransform: 'uppercase'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '22px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '14px' }}>Riepilogo Ordine</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: '#475569' }}>
                {cart.items.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <strong>{item.name}</strong>
                      {item.extras && item.extras.length > 0 && (
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>Extra: {item.extras.map(extra => extra.name).join(', ')}</div>
                      )}
                      {item.specialRequests && (
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>Nota: {item.specialRequests}</div>
                      )}
                    </div>
                    <div>
                      <span>€{((item.price / 100) * item.quantity).toFixed(2)}</span>
                      <div style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'right' }}>x{item.quantity}</div>
                    </div>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>Subtotale</span>
                    <strong>€{cart.getTotalPrice().toFixed(2)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>Spese di consegna</span>
                    <strong>€{deliveryFee.toFixed(2)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                    <span>Totale</span>
                    <span>€{(cart.getTotalPrice() + deliveryFee).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleCheckout}
                  disabled={isSubmitting || !customerInfo.name || !customerInfo.email || !customerInfo.phone || !customerInfo.address}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '10px',
                    border: 'none',
                    background: isSubmitting || !customerInfo.name || !customerInfo.email || !customerInfo.phone || !customerInfo.address ? '#cbd5f5' : '#22c55e',
                    color: 'white',
                    fontSize: '15px',
                    fontWeight: 700,
                    cursor: isSubmitting || !customerInfo.name || !customerInfo.email || !customerInfo.phone || !customerInfo.address ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Conferma in corso...
                    </>
                  ) : (
                    <>
                      <CreditCard size={16} />
                      {paymentMethod === 'stripe' ? 'Procedi al pagamento' : 'Conferma Ordine'}
                    </>
                  )}
                </motion.button>
                <button
                  onClick={() => setShowCheckout(false)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: '#64748b',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Torna al carrello
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default CartPage;
