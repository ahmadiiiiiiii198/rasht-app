import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, Clock, ChevronRight, Copy, Check, ShoppingCart, X, Plus, Minus, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../contexts/AuthContext';
import JerseyImage from '../components/JerseyImage';

interface Offer {
  id: string;
  title: string;
  description: string;
  price: number;
  original_price?: number;
  image_url: string;
  category_id: string;
  valid_until?: string;
  promo_code?: string;
  is_active: boolean;
  min_order_amount?: number;
  max_usage_per_user?: number;
  available_days?: number[]; // 0-6 (Sun-Sat)
  available_time_start?: string; // HH:MM
  available_time_end?: string; // HH:MM
  requires_points?: number;

  // New Complex Offer Fields
  extras_enabled?: boolean;
  enabled_extra_categories?: string[]; // IDs of categories allowed as extras
  are_extras_chargeable?: boolean; // If false, allowed extras are free (e.g., "Choose 2 toppings")
  max_extras?: number;
  delivery_only?: boolean;
  pickup_only?: boolean;
}

interface OfferCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  display_order: number;
}

// Interfaces for Extras Info
interface ExtraCategory {
  id: string;
  name: string;
  description?: string;
}

interface ExtraProduct {
  id: string;
  name: string;
  price: number;
  category_id: string;
  description?: string;
}

interface OffersPageProps {
  onNavigate?: (page: string) => void;
}

const OffersPage: React.FC<OffersPageProps> = ({ onNavigate }) => {
  const { isLoggedIn } = useAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [categories, setCategories] = useState<OfferCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // New State for Fulfillment
  const [fulfillmentType, setFulfillmentType] = useState<'delivery' | 'pickup'>('pickup');
  const [showAddedFeedback, setShowAddedFeedback] = useState(false);

  // Cart Hook
  const { addItem, getTotalItems } = useCart();

  // Extras State
  const [extraCategories, setExtraCategories] = useState<ExtraCategory[]>([]);
  const [extraProducts, setExtraProducts] = useState<ExtraProduct[]>([]);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [loadingExtras, setLoadingExtras] = useState(false);

  // Dynamic Header Image
  const [activeOfferImage, setActiveOfferImage] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const offerRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    if (!isLoggedIn) {
      setUserId(null);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    loadData();
    checkUserAuth();
  }, []);

  // Fetch Extras when offer is selected
  useEffect(() => {
    if (selectedOffer) {
      setFulfillmentType('pickup');

      if (selectedOffer.extras_enabled && selectedOffer.enabled_extra_categories?.length) {
        fetchExtras(selectedOffer.enabled_extra_categories);
      } else {
        setExtraCategories([]);
        setExtraProducts([]);
        setSelectedExtras([]);
      }
    }
  }, [selectedOffer]);

  const fetchExtras = async (categoryIds: string[]) => {
    setLoadingExtras(true);
    try {
      // 1. Fetch Categories
      const { data: catData, error: catError } = await supabase
        .from('categories')
        .select('*')
        .in('id', categoryIds)
        .order('sort_order', { ascending: true });

      if (catError) throw catError;
      setExtraCategories(catData || []);

      // 2. Fetch Products
      const { data: prodData, error: prodError } = await supabase
        .from('products')
        .select('*')
        .in('category_id', categoryIds)
        .eq('is_active', true)
        .order('name');

      if (prodError) throw prodError;
      setExtraProducts(prodData || []);
    } catch (error) {
      console.error('Error loading extras:', error);
    } finally {
      setLoadingExtras(false);
    }
  };

  const toggleExtra = (extraId: string) => {
    setSelectedExtras(prev =>
      prev.includes(extraId)
        ? prev.filter(id => id !== extraId)
        : [...prev, extraId]
    );
  };

  const calculateTotal = () => {
    if (!selectedOffer) return 0;
    let total = selectedOffer.price;

    // Only add extras price if chargeable (default to true)
    if (selectedOffer.are_extras_chargeable !== false) {
      selectedExtras.forEach(id => {
        const extra = extraProducts.find(p => p.id === id);
        if (extra) total += extra.price;
      });
    }
    return total;
  };

  const checkUserAuth = async () => {
    const email = localStorage.getItem('customer_email');
    if (email) {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('email', email)
          .single();

        if (data) {
          setUserId(data.id);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Load Categories
      const { data: catData, error: catError } = await supabase
        .from('offer_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (catData) setCategories(catData);

      // 2. Load Offers
      const now = new Date().toISOString();
      const { data: offersData, error: offersError } = await supabase
        .from('offers')
        .select('*')
        .eq('is_active', true)
        // .gte('valid_until', now) // Optional: filter expired
        .order('price', { ascending: true });

      if (offersData) {
        setOffers(offersData);
        if (offersData.length > 0) {
          setActiveOfferImage(offersData[0].image_url);
        }
      }

    } catch (error) {
      console.error('Error loading offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleAddToCart = () => {
    if (!selectedOffer) return;

    // Resolve extra objects
    const resolvedExtras = selectedExtras.map(id => {
      const p = extraProducts.find(prod => prod.id === id);
      return p ? {
        id: p.id,
        name: p.name,
        price: selectedOffer.are_extras_chargeable === false ? 0 : p.price,
        quantity: 1
      } : null;
    }).filter(Boolean) as any[];

    // Add delivery flag to special requests logic or separate field
    const deliveryNote = fulfillmentType === 'delivery' ? '[DELIVERY ONLY]' : '';

    addItem({
      id: selectedOffer.id,
      name: selectedOffer.title,
      price: selectedOffer.price, // Base price
      quantity: 1,
      image_url: selectedOffer.image_url,
      extras: resolvedExtras,
      deliveryOnly: fulfillmentType === 'delivery', // Custom flag for Cart
      specialRequests: `${deliveryNote} ${selectedOffer.description}`.trim()
    });

    setShowAddedFeedback(true);
    setTimeout(() => {
      setShowAddedFeedback(false);
      setSelectedOffer(null); // Close modal
    }, 1500);
  };

  // Scroll Observer Logic (Similar to MenuPage)
  useEffect(() => {
    if (loading || offers.length === 0) return;

    const options = {
      root: null,
      rootMargin: '-50% 0px 0px 0px',
      threshold: 0.1
    };

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const offerId = entry.target.getAttribute('data-id');
          const offer = offers.find(o => o.id === offerId);
          if (offer) {
            setActiveOfferImage(offer.image_url);
          }
        }
      });
    }, options);

    Object.values(offerRefs.current).forEach((el) => {
      if (el) observerRef.current?.observe(el);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [loading, offers, selectedCategory]);

  const filteredOffers = useMemo(() => {
    if (selectedCategory === 'all') return offers;
    return offers.filter(o => o.category_id === selectedCategory);
  }, [offers, selectedCategory]);

  return (
    <div className="rashti-page-dark">

      {/* 1. Header & Categories */}
      <div className="rashti-header-container" style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingTop: 'calc(60px + env(safe-area-inset-top))',
        paddingLeft: '80px',
        paddingRight: '20px',
        paddingBottom: '20px',
        boxSizing: 'border-box'
      }}>
        <h2 className="rashti-title" style={{ fontSize: '24px', margin: '0 0 10px 0', textAlign: 'left' }}>
          Offerte Speciali
        </h2>

        {/* Categories Scroller */}
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '0 0 5px 0', scrollbarWidth: 'none' }}>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`rashti-chip ${selectedCategory === 'all' ? 'active' : ''}`}
          >
            Tutte
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`rashti-chip ${selectedCategory === cat.id ? 'active' : ''}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Hero Background */}
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(circle at center, transparent 0%, rgba(13, 61, 46, 0.4) 100%)'
      }}>
        <AnimatePresence mode="wait">
          {activeOfferImage && (
            <motion.div
              key={activeOfferImage}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7 }}
              style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: '40vh',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                paddingTop: '60px',
              }}
            >
              <img
                src={activeOfferImage}
                alt="Offer"
                style={{
                  width: '90%', height: '90%', objectFit: 'contain',
                  filter: 'drop-shadow(0px 20px 50px rgba(0,0,0,0.6))'
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
        <div style={{ position: 'absolute', top: '30vh', left: 0, right: 0, bottom: 0, background: 'linear-gradient(180deg, rgba(8, 41, 32, 0) 0%, rgba(8, 41, 32, 1) 60%)' }} />
      </div>

      {/* 3. Offers List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        marginTop: '50vh',
        position: 'relative',
        zIndex: 10,
        background: 'linear-gradient(180deg, rgba(8, 41, 32, 0.95) 0%, #051a14 100%)',
        borderTopLeftRadius: '30px',
        borderTopRightRadius: '30px',
        paddingTop: '20px',
        paddingBottom: '80px',
        scrollSnapType: 'y mandatory',
      }}>
        {loading ? (
          <div className="text-gold" style={{ textAlign: 'center', padding: '40px' }}>Caricamento offerte...</div>
        ) : (
          filteredOffers.map((offer) => (
            <div
              key={offer.id}
              ref={(el) => { offerRefs.current[offer.id] = el; }}
              data-id={offer.id}
              style={{
                minHeight: '40vh',
                scrollSnapAlign: 'start',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
              }}
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="rashti-card"
                style={{ width: '100%', maxWidth: '500px' }}
                onClick={() => setSelectedOffer(offer)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <h3 className="rashti-title" style={{ fontSize: '20px', margin: 0, lineHeight: 1.2 }}>{offer.title}</h3>
                  <div style={{ background: 'var(--persian-gold)', color: '#000', padding: '4px 8px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px' }}>
                    €{offer.price.toFixed(2)}
                  </div>
                </div>

                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginBottom: '15px' }}>
                  {offer.description}
                </p>

                {offer.promo_code && (
                  <div
                    onClick={(e) => handleCopyCode(offer.promo_code!, e)}
                    style={{
                      background: 'rgba(255,255,255,0.1)', border: '1px dashed #c9a45c',
                      padding: '10px', borderRadius: '10px', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', gap: '8px', cursor: 'pointer', marginBottom: '15px'
                    }}
                  >
                    <Tag size={16} color="#c9a45c" />
                    <span style={{ color: '#c9a45c', fontWeight: 'bold', letterSpacing: '1px' }}>
                      {offer.promo_code}
                    </span>
                    {copiedCode === offer.promo_code ? <Check size={16} color="#4ade80" /> : <Copy size={16} color="#c9a45c" />}
                  </div>
                )}

                <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {offer.delivery_only && <span className="rashti-chip" style={{ fontSize: '10px', padding: '4px 8px' }}>Solo Delivery</span>}
                    {offer.pickup_only && <span className="rashti-chip" style={{ fontSize: '10px', padding: '4px 8px' }}>Solo Ritiro</span>}
                  </div>
                  <button className="rashti-btn-primary" style={{ height: '36px', padding: '0 16px', fontSize: '12px' }}>
                    DETTAGLI
                  </button>
                </div>
              </motion.div>
            </div>
          ))
        )}
      </div>

      {/* Offer Detail Modal */}
      <AnimatePresence>
        {selectedOffer && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              zIndex: 100,
              background: '#051a14',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Modal Header */}
            <div style={{ padding: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedOffer(null)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <img src={selectedOffer.image_url} alt={selectedOffer.title} style={{ width: '200px', height: '200px', objectFit: 'contain', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))' }} />
              </div>

              <h2 className="rashti-title" style={{ fontSize: '28px', marginBottom: '8px' }}>{selectedOffer.title}</h2>
              <p style={{ color: '#ccc', fontSize: '16px', marginBottom: '20px' }}>{selectedOffer.description}</p>

              {/* Fulfillment Selection */}
              {(selectedOffer.delivery_only || selectedOffer.pickup_only) ? (
                <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(201, 164, 92, 0.1)', borderRadius: '12px', color: '#c9a45c', textAlign: 'center' }}>
                  {selectedOffer.delivery_only ? '⚠ Disponibile solo per Consegna' : '⚠ Disponibile solo per Ritiro'}
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
                  <div
                    onClick={() => setFulfillmentType('pickup')}
                    className={`rashti-chip ${fulfillmentType === 'pickup' ? 'active' : ''}`}
                    style={{ flex: 1, textAlign: 'center', padding: '12px 0' }}
                  >
                    Ritiro
                  </div>
                  <div
                    onClick={() => setFulfillmentType('delivery')}
                    className={`rashti-chip ${fulfillmentType === 'delivery' ? 'active' : ''}`}
                    style={{ flex: 1, textAlign: 'center', padding: '12px 0' }}
                  >
                    Domicilio
                  </div>
                </div>
              )}

              {/* Extras Selection */}
              {extraCategories.length > 0 && (
                <div style={{ marginBottom: '30px' }}>
                  <h3 className="rashti-title" style={{ fontSize: '18px', marginBottom: '15px' }}>Personalizza</h3>
                  {extraCategories.map(cat => (
                    <div key={cat.id} style={{ marginBottom: '20px' }}>
                      <h4 style={{ color: '#c9a45c', marginBottom: '10px', fontFamily: 'Cinzel' }}>{cat.name}</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px' }}>
                        {extraProducts.filter(p => p.category_id === cat.id).map(prod => (
                          <div
                            key={prod.id}
                            onClick={() => toggleExtra(prod.id)}
                            style={{
                              border: selectedExtras.includes(prod.id) ? '1px solid #c9a45c' : '1px solid rgba(255,255,255,0.1)',
                              background: selectedExtras.includes(prod.id) ? 'rgba(201, 164, 92, 0.2)' : 'rgba(255,255,255,0.05)',
                              padding: '10px', borderRadius: '12px', cursor: 'pointer', textAlign: 'center'
                            }}
                          >
                            <div style={{ color: 'white', fontSize: '14px', marginBottom: '4px' }}>{prod.name}</div>
                            {selectedOffer.are_extras_chargeable !== false && (
                              <div style={{ color: '#aaa', fontSize: '12px' }}>+€{prod.price.toFixed(2)}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sticky Footer Action */}
            <div style={{ padding: '20px', background: 'rgba(5, 26, 20, 0.95)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <span style={{ color: '#ccc' }}>Totale:</span>
                <span className="text-gold" style={{ fontSize: '20px', fontWeight: 'bold' }}>€{calculateTotal().toFixed(2)}</span>
              </div>
              <button
                onClick={handleAddToCart}
                className="rashti-btn-primary"
                style={{ width: '100%', height: '54px' }}
              >
                {showAddedFeedback ? 'AGGIUNTO!' : 'AGGIUNGI AL CARRELLO'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Cart Button */}
      {getTotalItems() > 0 && (
        <button
          onClick={() => onNavigate?.('cart')}
          className="rashti-btn-icon"
          style={{
            position: 'fixed', bottom: '20px', left: '20px',
            width: '60px', height: '60px',
            zIndex: 90
          }}
        >
          <div style={{ position: 'relative' }}>
            <ShoppingCart size={24} color="#082920" />
            <span style={{
              position: 'absolute', top: '-8px', right: '-8px', background: '#082920', color: '#c9a45c',
              fontSize: '12px', fontWeight: 'bold', width: '20px', height: '20px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #c9a45c'
            }}>
              {getTotalItems()}
            </span>
          </div>
        </button>
      )}

    </div>
  );
};

export default OffersPage;
