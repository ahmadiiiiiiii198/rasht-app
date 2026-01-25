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
  const cartTotal = cart.getTotalPrice();

  const validateAddress = useCallback(async (address: string) => {
    if (!address.trim() || address.length < 5) {
      setAddressValidation(null);
      setDeliveryFee(2.5);
      return;
    }

    setIsValidatingAddress(true);
    try {
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
      <div className="rashti-page">
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
          <h2 className="rashti-title" style={{ fontSize: '28px', marginBottom: '10px', color: 'var(--persian-emerald)' }}>Ordine Confermato!</h2>
          <p style={{ fontSize: '20px', marginBottom: '30px', fontFamily: 'Cormorant Garamond' }}>Grazie per il tuo ordine</p>
          <div className="rashti-card-light" style={{ padding: '24px', width: '100%', maxWidth: '400px', marginBottom: '30px', borderRadius: '16px' }}>
            <div style={{ marginBottom: '16px' }}>
              <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Numero Ordine</p>
              <p style={{ color: '#0d3d2e', fontSize: '22px', fontWeight: 700, fontFamily: 'Cinzel' }}>{orderSuccess.orderNumber}</p>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Totale</p>
              <p style={{ color: '#15803d', fontSize: '28px', fontWeight: 700, fontFamily: 'Cinzel' }}>€{orderSuccess.total.toFixed(2)}</p>
            </div>
            {orderSuccess.pickupCode && (
              <div style={{ marginBottom: '16px' }}>
                <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Codice Ritiro</p>
                <p style={{ color: '#b45309', fontSize: '24px', fontWeight: 600 }}>{orderSuccess.pickupCode}</p>
              </div>
            )}
            <div>
              <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Pagamento</p>
              <p style={{ fontSize: '18px', fontWeight: 600 }}>
                {orderSuccess.paymentMethod === 'pos' ? '💳 POS alla Consegna' : '💵 Contanti'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setOrderSuccess(null)}
            className="rashti-btn-primary"
            style={{ width: 'auto', padding: '0 40px' }}
          >
            Torna al Menù
          </button>
        </motion.div>
      </div>
    );
  }

  // Empty cart view
  if (cart.items.length === 0) {
    return (
      <div className="rashti-page">
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
          <h2 className="rashti-title" style={{ fontSize: '24px', marginBottom: '10px', color: 'var(--persian-emerald)' }}>Il tuo carrello è vuoto</h2>
          <p style={{ color: '#666', fontSize: '18px', fontFamily: 'Cormorant Garamond' }}>Aggiungi qualcosa dal nostro menu!</p>
        </motion.div>
      </div>
    );
  }

  // Main UI (cart list or checkout form)
  return (
    <div className="rashti-page" style={{ overflowY: 'auto' }}>
      <div style={{ padding: '20px' }}>
        {/* Cart list */}
        {!showCheckout && (
          <>
            <motion.h2 initial={{ y: -20 }} animate={{ y: 0 }} className="rashti-title" style={{ fontSize: '28px', textAlign: 'center', marginBottom: '30px', color: 'var(--persian-emerald)' }}>
              Il tuo Carrello
            </motion.h2>
            <AnimatePresence>
              {cart.items.map(item => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="rashti-card-light"
                  style={{
                    padding: '15px',
                    marginBottom: '15px',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                  }}
                >
                  <div style={{ fontSize: '30px' }}>{item.image_url ? <JerseyImage src={item.image_url} alt={item.name} style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover' }} /> : '🍽️'}</div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', color: '#0d3d2e', fontWeight: 600, fontFamily: 'Cinzel' }}>{item.name}</h3>
                    {item.isLoyaltyReward ? (
                      <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#2ed573', fontWeight: 'bold' }}>✨ {item.pointsCost} Punti</p>
                    ) : (
                      <p style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#666', fontFamily: 'Cormorant Garamond', fontWeight: 600 }}>€{(typeof item.price === 'string' ? parseFloat(item.price) : item.price).toFixed(2)} cad.</p>
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
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => cart.updateQuantity(item.id, item.quantity - 1)} style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid #c9a45c', background: 'transparent', color: '#c9a45c', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <Minus size={14} />
                    </motion.button>
                    <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#0d3d2e' }}>{item.quantity}</span>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => cart.updateQuantity(item.id, item.quantity + 1)} style={{ width: '28px', height: '28px', borderRadius: '50%', border: 'none', background: '#c9a45c', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <Plus size={14} />
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => cart.removeItem(item.id)} style={{ marginTop: '5px', border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}>
                      <Trash2 size={16} />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Order summary */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="rashti-card-light" style={{ padding: '20px', marginBottom: '20px', borderRadius: '16px' }}>
              <h3 className="rashti-title" style={{ margin: '0 0 15px 0', fontSize: '18px', borderBottom: '1px solid #eee', paddingBottom: '10px', color: '#0d3d2e' }}>Riepilogo</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontFamily: 'Cormorant Garamond', fontSize: '18px' }}>Subtotale:</span>
                <span style={{ fontWeight: 'bold', fontSize: '18px' }}>€{cart.getTotalPrice().toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontFamily: 'Cormorant Garamond', fontSize: '18px' }}>Consegna:</span>
                <span style={{ fontWeight: 'bold', fontSize: '18px' }}>€{deliveryFee.toFixed(2)}</span>
              </div>
              {customerInfo.paymentMethod === 'pos' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontFamily: 'Cormorant Garamond', fontSize: '18px' }}>Commissione POS:</span>
                  <span style={{ fontWeight: 'bold', fontSize: '18px' }}>€{POS_FEE.toFixed(2)}</span>
                </div>
              )}
              <div style={{ borderTop: '2px solid #f5f5f5', paddingTop: '15px', marginTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '22px', fontWeight: 'bold', color: '#0d3d2e' }}>
                <span className="font-cinzel">Totale:</span>
                <span className="font-cinzel">€{(cart.getTotalPrice() + deliveryFee + (customerInfo.paymentMethod === 'pos' ? POS_FEE : 0)).toFixed(2)}</span>
              </div>
            </motion.div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '15px', flexDirection: 'column' }}>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowCheckout(true)} className="rashti-btn-primary" style={{ width: '100%', height: '54px', fontSize: '16px' }}>
                <ShoppingCart size={20} style={{ marginRight: '8px' }} />
                Procedi al Checkout
              </motion.button>

              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={cart.clearCart} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ef4444', background: 'transparent', color: '#ef4444', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'Cinzel' }}>
                Svuota Carrello
              </motion.button>
            </div>
          </>
        )}

        {/* Checkout form */}
        {showCheckout && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="rashti-card-light"
            style={{ borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '600px', margin: '0 auto' }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <p style={{ margin: 0, fontSize: '12px', color: '#c9a45c', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold' }}>Passo 2 di 2</p>
                <h2 className="rashti-title" style={{ margin: '6px 0 0 0', fontSize: '24px', color: '#0d3d2e' }}>Checkout</h2>
              </div>
              <motion.button whileHover={{ scale: 1.1 }} onClick={() => setShowCheckout(false)} style={{ border: 'none', background: '#f5f5f5', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={18} color="#333" />
              </motion.button>
            </div>

            {/* Validation alert */}
            {(!customerInfo.name || !customerInfo.email || !customerInfo.phone || (customerInfo.fulfillmentType === 'delivery' && !customerInfo.address)) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '10px', background: '#fff7ed', color: '#c2410c', marginBottom: '20px', fontSize: '13px' }}>
                <AlertCircle size={18} />
                <span>Compila i campi obbligatori.</span>
              </div>
            )}

            {/* Customer info */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600, color: '#0d3d2e', fontFamily: 'Cinzel' }}>Tuoi Dati</h3>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <input type="text" value={customerInfo.name} onChange={e => setCustomerInfo(p => ({ ...p, name: e.target.value }))} placeholder="Nome Completo *" className="rashti-input" style={{ background: 'white', borderColor: '#e2e8f0', color: '#333' }} />
                </div>
                <div>
                  <input type="email" value={customerInfo.email} onChange={e => setCustomerInfo(p => ({ ...p, email: e.target.value }))} placeholder="Email *" className="rashti-input" style={{ background: 'white', borderColor: '#e2e8f0', color: '#333' }} />
                </div>
                <div>
                  <input type="tel" value={customerInfo.phone} onChange={e => setCustomerInfo(p => ({ ...p, phone: e.target.value }))} placeholder="Telefono *" className="rashti-input" style={{ background: 'white', borderColor: '#e2e8f0', color: '#333' }} />
                </div>
              </div>
            </div>

            {/* Fulfillment Type Selection (Tabs) */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600, color: '#0d3d2e', fontFamily: 'Cinzel' }}>Modalità</h3>
              {(() => {
                const hasDeliveryOnlyItems = cart.items.some(item => item.deliveryOnly);
                if (hasDeliveryOnlyItems) {
                  return (
                    <>
                      <div style={{ padding: '16px', borderRadius: '12px', textAlign: 'center', border: '2px solid #ea580c', background: '#fff7ed', fontWeight: 600, color: '#ea580c' }}>
                        🛵 Consegna a Domicilio
                      </div>
                      <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px', fontStyle: 'italic' }}>Articoli solo per consegna.</p>
                    </>
                  );
                }
                return (
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div
                      onClick={() => setCustomerInfo(p => ({ ...p, fulfillmentType: 'delivery' }))}
                      style={{
                        flex: 1, padding: '12px', borderRadius: '12px', textAlign: 'center', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s',
                        border: customerInfo.fulfillmentType === 'delivery' ? '2px solid #c9a45c' : '1px solid #e2e8f0',
                        background: customerInfo.fulfillmentType === 'delivery' ? '#fffef0' : 'white',
                        color: customerInfo.fulfillmentType === 'delivery' ? '#0d3d2e' : '#64748b'
                      }}
                    >
                      🛵 Domicilio
                    </div>
                    <div
                      onClick={() => setCustomerInfo(p => ({ ...p, fulfillmentType: 'pickup' }))}
                      style={{
                        flex: 1, padding: '12px', borderRadius: '12px', textAlign: 'center', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s',
                        border: customerInfo.fulfillmentType === 'pickup' ? '2px solid #c9a45c' : '1px solid #e2e8f0',
                        background: customerInfo.fulfillmentType === 'pickup' ? '#fffef0' : 'white',
                        color: customerInfo.fulfillmentType === 'pickup' ? '#0d3d2e' : '#64748b'
                      }}
                    >
                      🛍️ Ritiro
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Timing Selection */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div
                  onClick={() => setCustomerInfo(p => ({ ...p, timing: 'asap' }))}
                  style={{
                    padding: '14px', borderRadius: '12px', cursor: 'pointer',
                    border: customerInfo.timing === 'asap' ? '2px solid #c9a45c' : '1px solid #e2e8f0',
                    background: customerInfo.timing === 'asap' ? '#fffef0' : 'white',
                  }}
                >
                  <div style={{ fontWeight: 600, color: '#0d3d2e', marginBottom: '4px' }}>🚀 Appena Possibile</div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>~30 minuti</div>
                </div>

                <div
                  onClick={() => setCustomerInfo(p => ({ ...p, timing: 'scheduled' }))}
                  style={{
                    padding: '14px', borderRadius: '12px', cursor: 'pointer',
                    border: customerInfo.timing === 'scheduled' ? '2px solid #c9a45c' : '1px solid #e2e8f0',
                    background: customerInfo.timing === 'scheduled' ? '#fffef0' : 'white',
                  }}
                >
                  <div style={{ fontWeight: 600, color: '#0d3d2e', marginBottom: '4px' }}>🕐 Orario Specifico</div>
                </div>
              </div>

              {/* Specific time dropdown */}
              {customerInfo.timing === 'scheduled' && (
                <div style={{ marginTop: '16px' }}>
                  <select value={customerInfo.scheduledTime} onChange={e => setCustomerInfo(p => ({ ...p, scheduledTime: e.target.value }))} className="rashti-input" style={{ width: '100%', padding: '12px', background: 'white', borderColor: '#e2e8f0', color: '#333' }}>
                    <option value="">Scegli un orario...</option>
                    {deliveryTimeOptions.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Address & citofono (only for delivery) */}
            {customerInfo.fulfillmentType === 'delivery' && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <input type="text" value={customerInfo.address} onChange={e => setCustomerInfo(p => ({ ...p, address: e.target.value }))} placeholder="Indirizzo (Via, Numero, Città) *" className="rashti-input" style={{ background: 'white', borderColor: '#e2e8f0', color: '#333' }} />
                  {isValidatingAddress && <div style={{ fontSize: '12px', color: '#c9a45c', marginTop: '5px' }}>Validazione in corso...</div>}
                </div>
                <div>
                  <input type="text" value={customerInfo.citofonoNome} onChange={e => setCustomerInfo(p => ({ ...p, citofonoNome: e.target.value }))} placeholder="Nome Citofono" className="rashti-input" style={{ background: 'white', borderColor: '#e2e8f0', color: '#333' }} />
                </div>
              </div>
            )}

            {/* Payment info */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600, color: '#0d3d2e', fontFamily: 'Cinzel' }}>Pagamento</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div
                  onClick={() => setCustomerInfo(p => ({ ...p, paymentMethod: 'cash' }))}
                  style={{
                    padding: '14px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
                    border: customerInfo.paymentMethod === 'cash' ? '2px solid #c9a45c' : '1px solid #e2e8f0',
                    background: customerInfo.paymentMethod === 'cash' ? '#fffef0' : 'white',
                  }}
                >
                  <div style={{ fontSize: '20px' }}>💵</div>
                  <div>
                    <div style={{ fontWeight: 600, color: '#0d3d2e' }}>Contanti</div>
                  </div>
                </div>

                <div
                  onClick={() => setCustomerInfo(p => ({ ...p, paymentMethod: 'pos' }))}
                  style={{
                    padding: '14px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
                    border: customerInfo.paymentMethod === 'pos' ? '2px solid #c9a45c' : '1px solid #e2e8f0',
                    background: customerInfo.paymentMethod === 'pos' ? '#fffef0' : 'white',
                  }}
                >
                  <div style={{ fontSize: '20px' }}>💳</div>
                  <div>
                    <div style={{ fontWeight: 600, color: '#0d3d2e' }}>POS (Carta)</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Promo code */}
            <div style={{ marginBottom: '20px' }}>
              <input type="text" value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} placeholder="Codice Promo" className="rashti-input" style={{ flex: 1, background: 'white', borderColor: '#e2e8f0', color: '#333', textTransform: 'uppercase' }} />
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleCheckout} disabled={isSubmitting} className="rashti-btn-primary" style={{ width: '100%', height: '54px', fontSize: '16px' }}>
                {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : 'CONFERMA ORDINE'}
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
