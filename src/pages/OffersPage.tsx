import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Copy, CheckCircle, Tag, QrCode, ChevronLeft, Bike, Store, ShoppingCart } from 'lucide-react';
import { supabase, Offer, OfferCategory, ExtraCategory, ExtraProduct } from '../lib/supabase';
import JerseyImage from '../components/JerseyImage';
import QRCode from 'react-qr-code';
import AuthModal from '../components/AuthModal';
import { useCart, CartItem } from '../hooks/useCart';
import { useAuth } from '../contexts/AuthContext';

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
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  // New State for Fulfillment
  const [fulfillmentType, setFulfillmentType] = useState<'delivery' | 'pickup'>('pickup');
  const [showAddedFeedback, setShowAddedFeedback] = useState(false);

  // Cart Hook
  const { addItem, getTotalItems } = useCart();

  // Header State
  const [headerState, setHeaderState] = useState<'default' | 'selected'>('default');
  const containerRef = useRef<HTMLDivElement>(null);

  // Extras State
  const [extraCategories, setExtraCategories] = useState<ExtraCategory[]>([]);
  const [extraProducts, setExtraProducts] = useState<ExtraProduct[]>([]);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [loadingExtras, setLoadingExtras] = useState(false);

  // Scroll handler for parallax effect
  const [scrollTop, setScrollTop] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  // Dynamic Header Image (like MenuPage)
  const [activeOfferImage, setActiveOfferImage] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const offerRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // React to auth changes - reset userId when logged out
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
      // Reset fulfillment type to pickup by default or keep persistent?
      // Let's reset to ensure choice
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
          console.log('👤 User identified:', data.id);
          setUserId(data.id);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    }
  };

  const loadData = async () => {
    console.log('🔄 Loading offers data...');
    setLoading(true);
    try {
      // 1. Load Categories
      const { data: catData, error: catError } = await supabase
        .from('offer_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (catData) {
        setCategories(catData);
      }

      // 2. Load Offers
      const { data, error } = await supabase
        .from('special_offers')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setOffers(data);
      } else {
        console.log('No offers found in database.');
      }
    } catch (error) {
      console.error('💥 Error loading offers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper to generate QR data
  const generateQRData = (offer: Offer) => {
    return JSON.stringify({
      offer_id: offer.id,
      user_id: userId,
      type: 'offer_redemption',
      timestamp: Date.now(),
      extras: selectedExtras,
      total_price: calculateTotal()
    });
  };

  const handleOfferClick = (offer: Offer) => {
    setSelectedOffer(offer);
    setHeaderState('selected');
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToOffers = () => {
    setHeaderState('default');
    setTimeout(() => setSelectedOffer(null), 300);
  };

  // Handle hardware back button
  useEffect(() => {
    if (selectedOffer) {
      const handlePopState = (e: PopStateEvent) => {
        e.preventDefault();
        handleBackToOffers();
      };

      window.history.pushState(null, '', window.location.pathname);
      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [selectedOffer]);

  const handleRedeemClick = () => {
    if (!userId) {
      setShowAuthModal(true);
    } else {
      setShowQRModal(true);
    }
  };

  const handleAuthSuccess = (newUserId: string) => {
    setUserId(newUserId);
    // If it was QR flow, show it now
    if (fulfillmentType === 'pickup' && selectedOffer) {
      setShowQRModal(true);
    }
  };

  const handleAddToOrder = () => {
    if (!selectedOffer) return;

    const extras = selectedExtras.map(id => {
      const product = extraProducts.find(p => p.id === id);
      return product ? {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1
      } : null;
    }).filter(e => e !== null) as any[]; // Cast to match CartItem extras

    const cartItem: CartItem = {
      id: selectedOffer.id,
      name: selectedOffer.title,
      price: selectedOffer.price, // Use base price, extras added separately in cart logic usually? NO, useCart adds extras price.
      quantity: 1,
      image_url: selectedOffer.image_url,
      extras: extras,
      deliveryOnly: true // Mark this item as delivery-only since user chose delivery
    };

    addItem(cartItem);
    setShowAddedFeedback(true);

    // Provide visual feedback then close
    setTimeout(() => {
      setShowAddedFeedback(false);
      handleBackToOffers();
    }, 1500);
  };

  // Compute filtered offers with useMemo to ensure stable reference
  const filteredOffers = React.useMemo(() => offers.filter(offer =>
    selectedCategory === 'all' || offer.category_id === selectedCategory
  ), [offers, selectedCategory]);

  if (loading) return <div style={{ color: 'white', textAlign: 'center', paddingTop: '100px' }}>Loading Offers...</div>;

  const handleScroll = () => {
    if (contentRef.current) {
      setScrollTop(contentRef.current.scrollTop);
    }
  };

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        background: '#0f172a',
        position: 'relative',
        fontFamily: '"Inter", sans-serif',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* 1. Simple Header */}
      <div style={{
        padding: '24px 24px 12px 24px',
        zIndex: 20
      }}>
        <h1 style={{ color: 'white', fontSize: '28px', fontWeight: '800', lineHeight: 1.2, margin: 0 }}>
          Special Offers <span style={{ fontSize: '24px' }}>🎁</span>
        </h1>
        <p style={{ color: '#94a3b8', marginTop: '6px', fontSize: '15px' }}>
          Best deals selected for you
        </p>
      </div>

      {/* 2. Scrollable Content Area */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 20px 100px 20px', // Bottom padding for navigation
          zIndex: 20
        }}
      >
        {/* Category Filter */}
        {categories.length > 0 && (
          <div style={{
            marginBottom: '24px',
            display: 'flex',
            gap: '12px',
            overflowX: 'auto',
            paddingBottom: '8px',
            scrollbarWidth: 'none',
          }}>
            <motion.button
              onClick={() => setSelectedCategory('all')}
              animate={{
                backgroundColor: selectedCategory === 'all' ? '#ea580c' : '#1e293b',
                color: selectedCategory === 'all' ? 'white' : '#94a3b8'
              }}
              style={{
                padding: '10px 20px',
                borderRadius: '100px',
                border: 'none',
                fontSize: '14px',
                fontWeight: '600',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            >
              All Offers
            </motion.button>

            {categories.map(cat => (
              <motion.button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                animate={{
                  backgroundColor: selectedCategory === cat.id ? '#ea580c' : '#1e293b',
                  color: selectedCategory === cat.id ? 'white' : '#94a3b8'
                }}
                style={{
                  padding: '10px 20px',
                  borderRadius: '100px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              >
                {cat.name}
              </motion.button>
            ))}
          </div>
        )}

        {/* Big Offers List (McDonald's Style) */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          {filteredOffers.map((offer, index) => (
            <motion.div
              key={offer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleOfferClick(offer)}
              style={{
                background: '#1e293b',
                borderRadius: '24px',
                overflow: 'hidden',
                cursor: 'pointer',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                position: 'relative'
              }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Big Image */}
              <div style={{ height: '220px', width: '100%', position: 'relative' }}>
                {offer.image_url ? (
                  <JerseyImage
                    layoutId={`image-${offer.id}`}
                    src={offer.image_url}
                    alt={offer.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Gift size={64} color="#94a3b8" />
                  </div>
                )}
                {/* Price Tag */}
                <div style={{
                  position: 'absolute',
                  bottom: '12px',
                  right: '12px',
                  background: 'rgba(15, 23, 42, 0.9)',
                  backdropFilter: 'blur(4px)',
                  padding: '8px 16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <span style={{ color: '#fb923c', fontWeight: '800', fontSize: '18px' }}>
                    {offer.price > 0 ? `€${offer.price}` : 'FREE'}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div style={{ padding: '20px' }}>
                <motion.h3
                  layoutId={`title-${offer.id}`}
                  style={{ color: 'white', margin: '0 0 8px 0', fontSize: '20px', fontWeight: 'bold' }}
                >
                  {offer.title}
                </motion.h3>
                <p style={{
                  fontSize: '14px',
                  color: '#94a3b8',
                  margin: 0,
                  lineHeight: '1.5',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {offer.description}
                </p>

                <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button style={{
                    flex: 1,
                    background: '#ea580c',
                    color: 'white',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}>
                    View Details
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>


      {/* 3. Selected Offer Overlay (Full Screen) */}
      <AnimatePresence mode="wait">
        {selectedOffer && (
          <motion.div
            key={selectedOffer.id}
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: '#0f172a',
              zIndex: 2000,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Fixed Header with Image - The Ceiling */}
            <div style={{
              position: 'relative',
              height: '180px', // Reduced height
              flexShrink: 0,
              borderBottomLeftRadius: '50% 40px', // Flatter curve
              borderBottomRightRadius: '50% 40px', // Flatter curve
              background: '#1e293b',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              zIndex: 50
            }}>
              {/* Background Image */}
              {selectedOffer.image_url ? (
                <JerseyImage
                  layoutId={`image-${selectedOffer.id}`}
                  src={selectedOffer.image_url}
                  alt={selectedOffer.title}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <div style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  background: '#ea580c',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{ fontSize: '60px' }}>🎁</span>
                </div>
              )}

              {/* Gradient Overlay */}
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.7))'
              }} />

              {/* Back Button */}
              <button
                onClick={handleBackToOffers}
                style={{
                  position: 'absolute',
                  top: '20px',
                  left: '20px',
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '50%',
                  width: '44px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  cursor: 'pointer',
                  zIndex: 100,
                  backdropFilter: 'blur(4px)'
                }}
              >
                <ChevronLeft size={28} />
              </button>

              {/* Title in Header */}
              <div style={{
                position: 'absolute',
                bottom: '30px',
                left: 0,
                right: 0,
                textAlign: 'center',
                padding: '0 60px'
              }}>
                <motion.h2
                  layoutId={`title-${selectedOffer.id}`}
                  style={{
                    fontSize: '22px',
                    fontWeight: 'bold',
                    color: 'white',
                    margin: 0,
                    textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                  }}
                >
                  {selectedOffer.title}
                </motion.h2>
              </div>
            </div>

            {/* Content Container - Scrollable Area (scrolls behind header visually via negative margin) */}
            <div
              ref={contentRef}
              onScroll={handleScroll}
              style={{
                flex: 1,
                overflowY: 'auto',
                paddingTop: '100px', // Push details down significantly
                paddingBottom: '140px', // Increased padding for bigger bottom bar + toggle
                paddingLeft: '20px',
                paddingRight: '20px',
                marginTop: '-30px', // Overlap into header curve
                position: 'relative',
                zIndex: 40
              }}
            >
              {/* Details Card */}
              <div style={{
                background: '#1e293b',
                borderRadius: '32px',
                padding: '24px',
                marginBottom: '20px',
                boxShadow: '0 10px 30px -10px rgba(0,0,0,0.3)'
              }}>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', marginBottom: '10px' }}>Details</h3>
                <p style={{ color: '#94a3b8', lineHeight: '1.6', fontSize: '15px', margin: 0 }}>{selectedOffer.description}</p>
              </div>

              {/* Fulfillment Selection */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', marginBottom: '12px', marginLeft: '4px' }}>
                  How do you want it?
                </h3>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => setFulfillmentType('pickup')}
                    style={{
                      flex: 1,
                      padding: '16px',
                      borderRadius: '20px',
                      border: fulfillmentType === 'pickup' ? '2px solid #ea580c' : '2px solid transparent',
                      background: fulfillmentType === 'pickup' ? 'rgba(234, 88, 12, 0.1)' : '#1e293b',
                      color: fulfillmentType === 'pickup' ? '#ea580c' : '#94a3b8',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontWeight: 'bold'
                    }}
                  >
                    <Store size={28} />
                    Pickup (Redeem)
                  </button>
                  <button
                    onClick={() => setFulfillmentType('delivery')}
                    style={{
                      flex: 1,
                      padding: '16px',
                      borderRadius: '20px',
                      border: fulfillmentType === 'delivery' ? '2px solid #ea580c' : '2px solid transparent',
                      background: fulfillmentType === 'delivery' ? 'rgba(234, 88, 12, 0.1)' : '#1e293b',
                      color: fulfillmentType === 'delivery' ? '#ea580c' : '#94a3b8',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontWeight: 'bold'
                    }}
                  >
                    <Bike size={28} />
                    Delivery (Cart)
                  </button>
                </div>
              </div>

              {/* Extras Section */}
              {selectedOffer.extras_enabled && (
                <div style={{ width: '100%' }}>
                  {loadingExtras ? (
                    <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>Loading extras...</div>
                  ) : extraCategories.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      <div style={{
                        padding: '16px',
                        background: 'rgba(234, 88, 12, 0.1)',
                        borderRadius: '20px',
                        border: '1px solid rgba(234, 88, 12, 0.2)',
                        textAlign: 'center'
                      }}>
                        <span style={{ color: '#fb923c', fontSize: '16px', fontWeight: '600' }}>✨ Customize your order</span>
                      </div>

                      {extraCategories.map(cat => {
                        const products = extraProducts.filter(p => p.category_id === cat.id);
                        if (products.length === 0) return null;

                        return (
                          <div key={cat.id}>
                            <h4 style={{ margin: '0 0 16px 8px', color: '#e2e8f0', fontSize: '18px', fontWeight: '700' }}>{cat.name}</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                              {products.map(product => {
                                const isSelected = selectedExtras.includes(product.id);
                                return (
                                  <motion.div
                                    key={product.id}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => toggleExtra(product.id)}
                                    style={{
                                      background: isSelected ? '#ea580c' : '#1e293b',
                                      borderRadius: '16px',
                                      padding: '16px',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      boxShadow: isSelected ? '0 10px 25px -5px rgba(234, 88, 12, 0.5)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                      transition: 'all 0.2s ease'
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                      <div style={{
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        background: isSelected ? 'white' : 'rgba(255,255,255,0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                      }}>
                                        {isSelected && <CheckCircle size={16} color="#ea580c" />}
                                      </div>
                                      <span style={{ color: isSelected ? 'white' : '#e2e8f0', fontSize: '15px', fontWeight: '600' }}>{product.name}</span>
                                    </div>
                                    <span style={{ color: isSelected ? 'rgba(255,255,255,0.9)' : '#94a3b8', fontSize: '14px', fontWeight: '500' }}>
                                      {selectedOffer.are_extras_chargeable !== false
                                        ? `+€${product.price.toFixed(2)}`
                                        : 'Incluso'}
                                    </span>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{
                      padding: '24px',
                      background: '#1e293b',
                      borderRadius: '24px',
                      textAlign: 'center',
                      color: '#94a3b8'
                    }}>
                      No extras available for this offer.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sticky Bottom Bar */}
            <div style={{
              position: 'fixed',
              bottom: '20px',
              left: '20px',
              right: '20px',
              zIndex: 2002
            }}>
              <AnimatePresence mode="wait">
                {showAddedFeedback ? (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    style={{
                      background: '#22c55e',
                      color: 'white',
                      padding: '18px 24px',
                      borderRadius: '24px',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      boxShadow: '0 20px 40px -10px rgba(34, 197, 94, 0.5)'
                    }}
                  >
                    Added to Cart! 🛒
                  </motion.div>
                ) : (
                  <button
                    onClick={fulfillmentType === 'pickup' ? handleRedeemClick : handleAddToOrder}
                    style={{
                      background: fulfillmentType === 'pickup' ? '#ea580c' : '#3b82f6', // Orange for Pickup, Blue for Delivery
                      color: 'white',
                      border: 'none',
                      padding: '18px 24px',
                      borderRadius: '24px',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      boxShadow: fulfillmentType === 'pickup'
                        ? '0 20px 40px -10px rgba(234, 88, 12, 0.5)'
                        : '0 20px 40px -10px rgba(59, 130, 246, 0.5)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {fulfillmentType === 'pickup' ? <QrCode size={24} /> : <ShoppingCart size={24} />}
                      <span>{fulfillmentType === 'pickup' ? 'Mostra Codice' : 'Aggiungi al Carrello'}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: '1' }}>
                      <span style={{ fontSize: '12px', opacity: 0.8, marginBottom: '2px' }}>Totale</span>
                      <span style={{ fontSize: '18px' }}>€{calculateTotal().toFixed(2)}</span>
                    </div>
                  </button>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQRModal && selectedOffer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowQRModal(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 3000, // INCREASED Z-INDEX TO SHOW ABOVE OVERLAY
              padding: '20px'
            }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#1e293b', // Dark slate
                padding: '30px',
                borderRadius: '32px',
                maxWidth: '350px',
                width: '100%',
                textAlign: 'center',
                border: '1px solid #334155'
              }}
            >
              <h3 style={{ margin: '0 0 5px 0', color: 'white', fontSize: '20px' }}>{selectedOffer.title}</h3>

              {selectedExtras.length > 0 && (
                <div style={{ marginBottom: '15px' }}>
                  <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8' }}>
                    + {selectedExtras.length} Extras
                  </p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '18px', color: '#fb923c', fontWeight: 'bold' }}>
                    Totale: €{calculateTotal().toFixed(2)}
                  </p>
                </div>
              )}

              <div style={{ background: 'white', padding: '15px', display: 'inline-block', borderRadius: '20px' }}>
                <QRCode
                  value={generateQRData(selectedOffer)}
                  size={200}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  viewBox={`0 0 256 256`}
                />
              </div>

              <p style={{ marginTop: '20px', color: '#94a3b8', fontSize: '14px' }}>
                Mostra questo QR code al personale per riscattare l'offerta.
              </p>

              <button
                onClick={() => setShowQRModal(false)}
                style={{
                  marginTop: '20px',
                  background: '#334155',
                  border: 'none',
                  padding: '12px 30px',
                  borderRadius: '15px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  color: 'white',
                  fontWeight: 'bold'
                }}
              >
                Chiudi
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Floating Cart Button - Visible when items in cart and not viewing details */}
      <AnimatePresence>
        {getTotalItems() > 0 && headerState === 'default' && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            style={{
              position: 'fixed',
              bottom: '24px',
              left: '0',
              right: '0',
              display: 'flex',
              justifyContent: 'center',
              zIndex: 50,
              pointerEvents: 'none' // Allow clicks to pass through if container full width
            }}
          >
            <div style={{ pointerEvents: 'auto' }}>
              <button
                onClick={() => onNavigate && onNavigate('cart')}
                style={{
                  background: '#ea580c',
                  color: 'white',
                  border: 'none',
                  padding: '16px 32px',
                  borderRadius: '100px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  boxShadow: '0 10px 25px -5px rgba(234, 88, 12, 0.5)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  minWidth: '200px', // Ensure good touch target
                  justifyContent: 'center'
                }}
              >
                <div style={{ position: 'relative' }}>
                  <ShoppingCart size={24} />
                  <span style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    background: 'white',
                    color: '#ea580c',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold'
                  }}>
                    {getTotalItems()}
                  </span>
                </div>
                <span>Go to Cart</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div >
  );
};

export default OffersPage;
