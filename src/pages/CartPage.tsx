import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, ShoppingCart, Trash2, Loader2, X, AlertCircle, Clock } from 'lucide-react';
import { createOrder, CreateOrderData } from '../lib/database';
import { useCart } from '../hooks/useCart';
import JerseyImage from '../components/JerseyImage';
import shippingZoneService, { AddressValidationResult } from '../lib/shippingZoneService';
import { useBusinessHoursContext } from '../contexts/BusinessHoursContext';
import { getOrCreateClientIdentity } from '../utils/clientIdentification';
import { saveClientOrder } from '../utils/clientSpecificOrderTracking';

const POS_FEE = 0.30;

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------
interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  fulfillmentType: 'delivery' | 'pickup';
  address: string;
  citofonoNome: string;
  timing: 'asap' | 'scheduled';
  scheduledTime: string; // "HH:MM", used when timing === 'scheduled'
  paymentMethod: 'cash' | 'pos';
}

interface OrderSuccessInfo {
  orderNumber: string;
  total: number;
  pickupCode?: string;
  paymentMethod?: 'cash' | 'pos';
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------
const CartPage: React.FC = () => {
  const cart = useCart();
  const { validateOrderTime } = useBusinessHoursContext();
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<OrderSuccessInfo | null>(null);

  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    email: '',
    phone: '',
    address: '',
    citofonoNome: '',
    fulfillmentType: 'delivery',
    timing: 'asap',
    scheduledTime: '',
    paymentMethod: 'cash',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(2.5);
  const [promoCode, setPromoCode] = useState('');

  const [isValidatingAddress, setIsValidatingAddress] = useState(false);
  const [addressValidation, setAddressValidation] = useState<AddressValidationResult | null>(null);
  // Removed validationTimeout state as it caused render loops

  // ---------------------------------------------------------------------------
  // Generate delivery time options (18:00 - 22:30 in 15‑minute steps)
  // ---------------------------------------------------------------------------
  const deliveryTimeOptions: string[] = [];
  for (let hour = 18; hour <= 22; hour++) {
    const maxMinute = hour === 22 ? 30 : 45;
    for (let minute = 0; minute <= maxMinute; minute += 15) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      deliveryTimeOptions.push(time);
    }
  }

  // ---------------------------------------------------------------------------
  // Address validation (only for delivery methods that need an address)
  // ---------------------------------------------------------------------------
  // ---------------------------------------------------------------------------
  // Address validation (only for delivery methods that need an address)
  // ---------------------------------------------------------------------------
  // Extract total price to a primitive value for stable dependency
  const cartTotal = cart.getTotalPrice();

  const validateAddress = useCallback(async (address: string) => {
    if (!address.trim() || address.length < 5) {
      setAddressValidation(null);
      setDeliveryFee(2.5);
      return;
    }

    setIsValidatingAddress(true);
    try {
      // Use cartTotal here which is captured in closure
      const result = await shippingZoneService.validateDeliveryAddress(address, cartTotal);
      setAddressValidation(result);
      if (result.isValid && result.isWithinZone) {
        setDeliveryFee(result.deliveryFee);
      } else {
        setDeliveryFee(2.5);
      }
    } catch (e) {
      console.error('Address validation error', e);
      setAddressValidation({
        isValid: false,
        isWithinZone: false,
        distance: 0,
        deliveryFee: 0,
        estimatedTime: 'N/A',
        formattedAddress: address,
        coordinates: { lat: 0, lng: 0 },
        error: 'Errore nella validazione. Riprova.',
      });
      setDeliveryFee(2.5);
    } finally {
      setIsValidatingAddress(false);
    }
  }, [cartTotal]);

  // Debounce address validation when address changes
  useEffect(() => {
    if (!showCheckout || customerInfo.fulfillmentType === 'pickup') {
      setDeliveryFee(0);
      setAddressValidation(null);
      return;
    }

    if (!customerInfo.address.trim()) {
      setDeliveryFee(2.5);
      return;
    }

    const timer = setTimeout(() => {
      validateAddress(customerInfo.address);
    }, 800);

    return () => clearTimeout(timer);
  }, [customerInfo.address, showCheckout, customerInfo.fulfillmentType, validateAddress]);

  // ---------------------------------------------------------------------------
  // Checkout handling
  // ---------------------------------------------------------------------------
  const handleCheckout = async () => {
    // Basic required fields
    const hasBasicInfo = customerInfo.name && customerInfo.email && customerInfo.phone;

    // Fulfillment specific checks
    const isDelivery = customerInfo.fulfillmentType === 'delivery';
    const hasAddressInfo = isDelivery ? !!customerInfo.address : true;
    const addressOk = isDelivery ? addressValidation?.isValid && addressValidation?.isWithinZone : true;

    // Timing checks
    const hasTimeInfo = customerInfo.timing === 'asap' || (customerInfo.timing === 'scheduled' && !!customerInfo.scheduledTime);

    if (!hasBasicInfo || !hasAddressInfo || !addressOk || !hasTimeInfo) {
      alert('Compila tutti i campi obbligatori e verifica l\'indirizzo');
      return;
    }

    // Business Hours Validation
    let orderDate: Date | undefined;
    if (customerInfo.timing === 'scheduled' && customerInfo.scheduledTime) {
      const [hours, minutes] = customerInfo.scheduledTime.split(':').map(Number);
      orderDate = new Date();
      orderDate.setHours(hours, minutes, 0, 0);
    }

    const timeValidation = await validateOrderTime(orderDate);
    if (!timeValidation.valid) {
      alert(timeValidation.message);
      return;
    }

    setIsSubmitting(true);
    try {
      // Client Identity
      const clientIdentity = await getOrCreateClientIdentity();

      // Generate pickup code if needed
      const pickupCode =
        customerInfo.fulfillmentType === 'pickup'
          ? Math.random().toString(36).substring(2, 8).toUpperCase()
          : undefined;

      const deliveryTimeText =
        customerInfo.timing === 'asap'
          ? 'APPENA POSSIBILE (entro 30 minuti)'
          : `Orario richiesto: ${customerInfo.scheduledTime}`;

      const citofonoText = (isDelivery && customerInfo.citofonoNome) ? `\nCitofono: ${customerInfo.citofonoNome}` : '';
      const etaText = (isDelivery && addressValidation?.estimatedTime) ? `\nTempo stimato: ${addressValidation.estimatedTime}` : '';
      const promoText = promoCode ? `\nPromo: ${promoCode}` : '';
      const pickupText = pickupCode ? `\nCodice ritiro: ${pickupCode}` : '';

      const paymentMethodText = customerInfo.paymentMethod === 'pos' ? 'POS alla consegna' : 'Contanti alla consegna';

      const posFee = customerInfo.paymentMethod === 'pos' ? POS_FEE : 0;
      const finalTotal = cart.getTotalPrice() + deliveryFee + posFee;

      const orderData: CreateOrderData = {
        customer_name: customerInfo.name,
        customer_email: customerInfo.email,
        customer_phone: customerInfo.phone,
        customer_address: isDelivery ? customerInfo.address : '',
        total_amount: finalTotal,
        delivery_fee: deliveryFee,
        delivery_type: customerInfo.fulfillmentType,
        payment_method: 'cash',
        special_instructions: `📱 Ordine App Mobile\n${deliveryTimeText}${citofonoText}\nPagamento: ${paymentMethodText}${etaText}${promoText}${pickupText}\nClient ID: ${clientIdentity.clientId.slice(-6)}`,
        items: cart.items.map(item => ({
          product_id: item.id,
          product_name: item.name,
          quantity: item.quantity,
          price: item.price,
          special_requests: item.specialRequests,
        })),
      };

      const orderId = await createOrder(orderData);
      if (orderId) {
        const orderNumber = `ORD-${Date.now()}`;

        // Save for client tracking
        await saveClientOrder({
          id: orderId,
          order_number: orderNumber,
          customer_email: customerInfo.email,
          customer_name: customerInfo.name,
          total_amount: finalTotal,
          created_at: new Date().toISOString()
        });

        setOrderSuccess({ orderNumber, total: finalTotal, pickupCode, paymentMethod: customerInfo.paymentMethod });
        cart.clearCart();
        setShowCheckout(false);
        setCustomerInfo({
          name: '',
          email: '',
          phone: '',
          address: '',
          citofonoNome: '',
          fulfillmentType: 'delivery',
          timing: 'asap',
          scheduledTime: '',
          paymentMethod: 'cash',
        });
        setAddressValidation(null);
      } else {
        alert('Errore nella creazione dell\'ordine. Riprova.');
      }
    } catch (e) {
      console.error('Checkout error', e);
      alert('Errore durante l\'ordine. Riprova.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------
  if (orderSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          padding: '40px 20px',
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }} style={{ fontSize: '80px', marginBottom: '20px' }}>
          ✅
        </motion.div>
        <h2 style={{ fontSize: '28px', marginBottom: '10px', color: '#22c55e', fontWeight: 700 }}>Ordine Confermato!</h2>
        <p style={{ color: '#333', fontSize: '18px', marginBottom: '20px' }}>Grazie per il tuo ordine</p>
        <div
          style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '16px',
            padding: '24px',
            width: '100%',
            maxWidth: '400px',
            marginBottom: '30px',
          }}
        >
          <div style={{ marginBottom: '16px' }}>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '4px' }}>Numero Ordine</p>
            <p style={{ color: '#0f172a', fontSize: '18px', fontWeight: 700 }}>{orderSuccess.orderNumber}</p>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '4px' }}>Totale</p>
            <p style={{ color: '#22c55e', fontSize: '24px', fontWeight: 700 }}>€{orderSuccess.total.toFixed(2)}</p>
          </div>
          {orderSuccess.pickupCode && (
            <div style={{ marginBottom: '16px' }}>
              <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '4px' }}>Codice Ritiro</p>
              <p style={{ color: '#b45309', fontSize: '20px', fontWeight: 600 }}>{orderSuccess.pickupCode}</p>
            </div>
          )}
          <div>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '4px' }}>Metodo di Pagamento</p>
            <p style={{ color: '#0f172a', fontSize: '16px', fontWeight: 600 }}>
              {orderSuccess.paymentMethod === 'pos' ? '💳 POS (Carta) alla Consegna' : '💵 Contanti alla Consegna'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setOrderSuccess(null)}
          style={{
            padding: '12px 24px',
            background: '#22c55e',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          Torna al Menù
        </button>
      </motion.div>
    );
  }

  // Empty cart view
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
          textAlign: 'center',
        }}
      >
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }} style={{ fontSize: '80px', marginBottom: '20px' }}>
          🛒
        </motion.div>
        <h2 style={{ fontSize: '24px', marginBottom: '10px', color: '#333' }}>Il tuo carrello è vuoto</h2>
        <p style={{ color: '#666', fontSize: '16px' }}>Aggiungi qualcosa dal nostro menu!</p>
      </motion.div>
    );
  }

  // Main UI (cart list or checkout form)
  return (
    <div style={{ padding: '20px' }}>
      {/* Cart list */}
      {!showCheckout && (
        <>
          <motion.h2 initial={{ y: -20 }} animate={{ y: 0 }} style={{ fontSize: '28px', fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: '30px' }}>
            Il tuo Carrello 🛒
          </motion.h2>
          <AnimatePresence>
            {cart.items.map(item => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                style={{
                  background: 'rgba(255,255,255,0.9)',
                  borderRadius: '15px',
                  padding: '20px',
                  marginBottom: '15px',
                  boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                }}
              >
                <div style={{ fontSize: '30px' }}>{item.image_url ? <JerseyImage src={item.image_url} alt={item.name} style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover' }} /> : '🍽️'}</div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '16px', color: '#333', fontWeight: 600 }}>{item.name}</h3>
                  {item.isLoyaltyReward ? (
                    <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#2ed573', fontWeight: 'bold' }}>✨ {item.pointsCost} Punti</p>
                  ) : (
                    <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666' }}>€{(typeof item.price === 'string' ? parseFloat(item.price) : item.price).toFixed(2)} cad.</p>
                  )}
                  {/* Extras / Beverages / Special Requests */}
                  {item.extras && item.extras.length > 0 && (
                    <div style={{ margin: '8px 0', fontSize: '12px', color: '#22c55e', fontWeight: 600 }}>
                      ✓ Extras: {item.extras.map(e => `${e.name} x${e.quantity}`).join(', ')}
                    </div>
                  )}
                  {item.beverages && item.beverages.length > 0 && (
                    <div style={{ margin: '8px 0', fontSize: '12px', color: '#3b82f6', fontWeight: 600 }}>
                      🥤 Beverages: {item.beverages.map(b => `${b.name} x${b.quantity}`).join(', ')}
                    </div>
                  )}
                  {item.specialRequests && (
                    <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#888', fontStyle: 'italic' }}>📝 Note: {item.specialRequests}</p>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => cart.updateQuantity(item.id, item.quantity - 1)} style={{ width: '30px', height: '30px', borderRadius: '50%', border: 'none', background: '#ff4757', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Minus size={14} />
                  </motion.button>
                  <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>{item.quantity}</span>
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => cart.updateQuantity(item.id, item.quantity + 1)} style={{ width: '30px', height: '30px', borderRadius: '50%', border: 'none', background: '#2ed573', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Plus size={14} />
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => cart.removeItem(item.id)} style={{ width: '30px', height: '30px', borderRadius: '50%', border: 'none', background: '#ff6b6b', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Trash2 size={14} />
                  </motion.button>
                </div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: item.isLoyaltyReward ? '#2ed573' : '#FF6B6B', textAlign: 'right' }}>
                  {item.isLoyaltyReward ? (
                    <span>{item.pointsCost ? item.pointsCost * item.quantity : 0} Pt</span>
                  ) : (
                    `€${(() => {
                      const base = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
                      let total = base * item.quantity;
                      if (item.extras && item.extras.length > 0) {
                        total += item.extras.reduce((sum, e) => sum + ((typeof e.price === 'string' ? parseFloat(e.price) : e.price) * e.quantity), 0);
                      }
                      if (item.beverages && item.beverages.length > 0) {
                        total += item.beverages.reduce((sum, b) => sum + ((typeof b.price === 'string' ? parseFloat(b.price) : b.price) * b.quantity), 0);
                      }
                      return total.toFixed(2);
                    })()}`
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {/* Order summary */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ background: 'rgba(255,255,255,0.9)', borderRadius: '15px', padding: '20px', marginBottom: '20px', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#333' }}>Riepilogo Ordine</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span>Subtotale ({cart.getTotalItems()} {cart.getTotalItems() === 1 ? 'prodotto' : 'prodotti'}):</span>
              <span>€{cart.getTotalPrice().toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span>Costo Consegna:</span>
              <span>€{deliveryFee.toFixed(2)}</span>
            </div>
            {customerInfo.paymentMethod === 'pos' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span>Commissione POS:</span>
                <span>€{POS_FEE.toFixed(2)}</span>
              </div>
            )}
            <div style={{ borderTop: '1px solid #eee', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
              <span>Totale:</span>
              <span>€{(cart.getTotalPrice() + deliveryFee + (customerInfo.paymentMethod === 'pos' ? POS_FEE : 0)).toFixed(2)}</span>
            </div>
          </motion.div>
          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={cart.clearCart} style={{ flex: 1, padding: '15px', borderRadius: '12px', border: '2px solid #ff6b6b', background: 'transparent', color: '#ff6b6b', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
              Svuota Carrello
            </motion.button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowCheckout(true)} style={{ flex: 2, padding: '15px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
              <ShoppingCart size={18} style={{ marginRight: '8px' }} />
              Procedi al Checkout
            </motion.button>
          </div>
        </>
      )}

      {/* Checkout form */}
      {showCheckout && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ background: 'white', borderRadius: '16px', padding: '28px', boxShadow: '0 25px 50px rgba(0,0,0,0.1)', width: '100%', maxWidth: '600px', margin: '0 auto' }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Passo 2 di 2</p>
              <h2 style={{ margin: '6px 0 0 0', fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>Checkout - {cart.items.length} prodotti</h2>
            </div>
            <motion.button whileHover={{ scale: 1.05 }} onClick={() => setShowCheckout(false)} style={{ border: 'none', background: '#f1f5f9', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X size={18} color="#0f172a" />
            </motion.button>
          </div>

          {/* Validation alert */}
          {(!customerInfo.name || !customerInfo.email || !customerInfo.phone || (customerInfo.fulfillmentType === 'delivery' && !customerInfo.address)) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '10px', background: '#fff7ed', color: '#c2410c', marginBottom: '20px' }}>
              <AlertCircle size={18} />
              <span>Compila tutti i campi obbligatori per completare l'ordine.</span>
            </div>
          )}

          {/* Customer info */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>Informazioni Cliente</h3>
            <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: '1fr 1fr' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>Nome Completo *</label>
                <input type="text" value={customerInfo.name} onChange={e => setCustomerInfo(p => ({ ...p, name: e.target.value }))} placeholder="Il tuo nome completo" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px' }} />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>Email *</label>
                <input type="email" value={customerInfo.email} onChange={e => setCustomerInfo(p => ({ ...p, email: e.target.value }))} placeholder="la-tua-email@esempio.com" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px' }} />
              </div>
            </div>
            <div style={{ marginTop: '16px', display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>Telefono *</label>
                <input type="tel" value={customerInfo.phone} onChange={e => setCustomerInfo(p => ({ ...p, phone: e.target.value }))} placeholder="+39 123 456 7890" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px' }} />
              </div>
            </div>
          </div>

          {/* Fulfillment Type Selection (Tabs) */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>
              <Clock size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Modalità
            </h3>
            {(() => {
              // Check if cart has any delivery-only items
              const hasDeliveryOnlyItems = cart.items.some(item => item.deliveryOnly);

              if (hasDeliveryOnlyItems) {
                // If there are delivery-only items, disable/hide pickup option
                return (
                  <>
                    <div
                      style={{
                        flex: 1,
                        padding: '16px',
                        borderRadius: '12px',
                        textAlign: 'center',
                        border: '2px solid #ea580c',
                        background: '#fff7ed',
                        fontWeight: 600,
                        color: '#ea580c'
                      }}
                    >
                      🛵 Consegna a Domicilio
                    </div>
                    <p style={{ fontSize: '13px', color: '#64748b', marginTop: '8px', fontStyle: 'italic' }}>
                      Il carrello contiene offerte solo per consegna
                    </p>
                  </>
                );
              }

              // Normal view with both options
              return (
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div
                    onClick={() => setCustomerInfo(p => ({ ...p, fulfillmentType: 'delivery' }))}
                    style={{
                      flex: 1,
                      padding: '16px',
                      borderRadius: '12px',
                      textAlign: 'center',
                      border: customerInfo.fulfillmentType === 'delivery' ? '2px solid #ea580c' : '1px solid #e2e8f0',
                      background: customerInfo.fulfillmentType === 'delivery' ? '#fff7ed' : 'white',
                      cursor: 'pointer',
                      fontWeight: 600,
                      color: customerInfo.fulfillmentType === 'delivery' ? '#ea580c' : '#64748b'
                    }}
                  >
                    🛵 Consegna a Domicilio
                  </div>
                  <div
                    onClick={() => setCustomerInfo(p => ({ ...p, fulfillmentType: 'pickup' }))}
                    style={{
                      flex: 1,
                      padding: '16px',
                      borderRadius: '12px',
                      textAlign: 'center',
                      border: customerInfo.fulfillmentType === 'pickup' ? '2px solid #ea580c' : '1px solid #e2e8f0',
                      background: customerInfo.fulfillmentType === 'pickup' ? '#fff7ed' : 'white',
                      cursor: 'pointer',
                      fontWeight: 600,
                      color: customerInfo.fulfillmentType === 'pickup' ? '#ea580c' : '#64748b'
                    }}
                  >
                    🛍️ Ritiro in Negozio
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Timing Selection */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>
              Orario {customerInfo.fulfillmentType === 'delivery' ? 'Consegna' : 'Ritiro'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div
                onClick={() => setCustomerInfo(p => ({ ...p, timing: 'asap' }))}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: customerInfo.timing === 'asap' ? '2px solid #22c55e' : '1px solid #e2e8f0',
                  background: customerInfo.timing === 'asap' ? '#f0fdf4' : 'white',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontWeight: 600, color: '#15803d', marginBottom: '4px' }}>🚀 Appena Possibile</div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>Il tuo ordine sarà pronto tra circa 30 minuti</div>
              </div>

              <div
                onClick={() => setCustomerInfo(p => ({ ...p, timing: 'scheduled' }))}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: customerInfo.timing === 'scheduled' ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                  background: customerInfo.timing === 'scheduled' ? '#eff6ff' : 'white',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontWeight: 600, color: '#1d4ed8', marginBottom: '4px' }}>🕐 Orario Specifico</div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>Scegli un orario specifico</div>
              </div>
            </div>

            {/* Specific time dropdown */}
            {customerInfo.timing === 'scheduled' && (
              <div style={{ marginTop: '16px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>Seleziona Orario *</label>
                <select value={customerInfo.scheduledTime} onChange={e => setCustomerInfo(p => ({ ...p, scheduledTime: e.target.value }))} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px' }}>
                  <option value="">Scegli un orario...</option>
                  {deliveryTimeOptions.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>Orari disponibili dalle 18:00 alle 22:30</p>
              </div>
            )}
          </div>

          {/* Address & citofono (only for delivery) */}
          {customerInfo.fulfillmentType === 'delivery' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>Indirizzo di Consegna *</label>
                <input type="text" value={customerInfo.address} onChange={e => setCustomerInfo(p => ({ ...p, address: e.target.value }))} placeholder="Via Roma 123, Torino" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px' }} />
                {isValidatingAddress && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', color: '#6366f1' }}>
                    <Loader2 size={14} className="animate-spin" />
                    <span style={{ fontSize: '13px' }}>Validazione indirizzo...</span>
                  </div>
                )}
                {addressValidation && (
                  <div style={{ marginTop: '8px', padding: '10px', borderRadius: '8px', fontSize: '13px', background: addressValidation.isValid && addressValidation.isWithinZone ? '#f0fdf4' : '#fef2f2', color: addressValidation.isValid && addressValidation.isWithinZone ? '#15803d' : '#b91c1c' }}>
                    {addressValidation.isValid && addressValidation.isWithinZone ? (
                      <>
                        ✅ Indirizzo valido! Consegna in {addressValidation.estimatedTime}
                        {addressValidation.deliveryFee > 0 && (
                          <div style={{ marginTop: '4px' }}>Costo consegna: €{addressValidation.deliveryFee.toFixed(2)}</div>
                        )}
                      </>
                    ) : (
                      <>❌ {addressValidation.error || 'Indirizzo non valido'}</>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>Nome Citofono</label>
                <input type="text" value={customerInfo.citofonoNome} onChange={e => setCustomerInfo(p => ({ ...p, citofonoNome: e.target.value }))} placeholder="Nome sul citofono (se diverso)" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px' }} />
                <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>Inserisci il nome da suonare al citofono se diverso dal tuo</p>
              </div>
            </div>
          )}

          {/* Payment info (cash only) */}

          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>Metodo di Pagamento</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div
                onClick={() => setCustomerInfo(p => ({ ...p, paymentMethod: 'cash' }))}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: customerInfo.paymentMethod === 'cash' ? '2px solid #ea580c' : '1px solid #e2e8f0',
                  background: customerInfo.paymentMethod === 'cash' ? '#fff7ed' : 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div style={{ fontSize: '20px' }}>💵</div>
                <div>
                  <div style={{ fontWeight: 600, color: '#ea580c' }}>Contanti alla Consegna</div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>Paga direttamente al rider in contanti</div>
                </div>
              </div>

              <div
                onClick={() => setCustomerInfo(p => ({ ...p, paymentMethod: 'pos' }))}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: customerInfo.paymentMethod === 'pos' ? '2px solid #ea580c' : '1px solid #e2e8f0',
                  background: customerInfo.paymentMethod === 'pos' ? '#fff7ed' : 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div style={{ fontSize: '20px' }}>💳</div>
                <div>
                  <div style={{ fontWeight: 600, color: '#ea580c' }}>POS (Carta) alla Consegna</div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>Paga con carta al rider (+€{POS_FEE.toFixed(2)} commissione)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Promo code */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>Codice Promozionale</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input type="text" value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} placeholder="Inserisci codice" style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', textTransform: 'uppercase' }} />
            </div>
          </div>

          {/* Order summary (same as above) */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ background: 'rgba(255,255,255,0.9)', borderRadius: '15px', padding: '20px', marginBottom: '20px', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#333' }}>Riepilogo Ordine</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span>Subtotale ({cart.getTotalItems()} {cart.getTotalItems() === 1 ? 'prodotto' : 'prodotti'}):</span>
              <span>€{cart.getTotalPrice().toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span>Costo Consegna:</span>
              <span>€{deliveryFee.toFixed(2)}</span>
            </div>
            {customerInfo.paymentMethod === 'pos' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span>Commissione POS:</span>
                <span>€{POS_FEE.toFixed(2)}</span>
              </div>
            )}
            <div style={{ borderTop: '1px solid #eee', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
              <span>Totale:</span>
              <span>€{(cart.getTotalPrice() + deliveryFee + (customerInfo.paymentMethod === 'pos' ? POS_FEE : 0)).toFixed(2)}</span>
            </div>
          </motion.div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={cart.clearCart} style={{ flex: 1, padding: '15px', borderRadius: '12px', border: '2px solid #ff6b6b', background: 'transparent', color: '#ff6b6b', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
              Svuota Carrello
            </motion.button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleCheckout} disabled={isSubmitting} style={{ flex: 2, padding: '15px', borderRadius: '12px', background: '#22c55e', color: 'white', border: 'none', fontSize: '16px', fontWeight: 'bold', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
              {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : 'Conferma Ordine'}
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CartPage;
