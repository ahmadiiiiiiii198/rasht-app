import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Copy, CheckCircle, Clock, Percent, Tag, Star } from 'lucide-react';
import { supabase, SiteContent } from '../lib/supabase';

interface Offer {
  id: string;
  title: string;
  description: string;
  code: string;
  discount_value: number;
  discount_type: 'percentage' | 'fixed' | 'bogo' | 'free_delivery';
  valid_until: string;
  is_active: boolean;
  minimum_order?: number;
  usage_limit?: number;
  used_count?: number;
}

const typeConfig = {
  percentage: { icon: <Percent size={20} />, color: '#FF6B6B', suffix: '% OFF' },
  fixed: { icon: <Tag size={20} />, color: '#4ECDC4', prefix: '€', suffix: ' OFF' },
  bogo: { icon: <Gift size={20} />, color: '#FFEAA7', label: 'BOGO' },
  free_delivery: { icon: <Star size={20} />, color: '#DDA0DD', label: 'FREE DELIVERY' }
};

const OffersPage: React.FC = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    loadOffers();
  }, []);

  const loadOffers = async () => {
    setLoading(true);
    try {
      // NOTE: site_content table doesn't exist in database
      // Using default offers approach since no dynamic offers table available
      console.log('ℹ️ Using default offers - site_content table not found in database');
      
      // Set default offers since site_content table doesn't exist
      setOffers([
        {
          id: '1',
          title: '🎉 Welcome Offer',
          description: 'Get 20% off on your first order',
          code: 'WELCOME20',
          discount_value: 20,
          discount_type: 'percentage',
          valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          is_active: true,
          minimum_order: 15
        },
        {
          id: '2',
          title: '🚚 Free Delivery',
          description: 'Free delivery on orders above €25',
          code: 'FREEDEL25',
          discount_value: 0,
          discount_type: 'free_delivery',
          valid_until: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          is_active: true,
          minimum_order: 25
        }
      ]);
    } catch (error) {
      console.error('Error loading offers:', error);
      // Set empty offers on error
      setOffers([]);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const formatDiscount = (offer: Offer) => {
    const config = typeConfig[offer.discount_type];
    
    if (offer.discount_type === 'bogo') {
      return (config as any).label || 'BOGO';
    } else if (offer.discount_type === 'free_delivery') {
      return (config as any).label || 'FREE DELIVERY';
    } else if (offer.discount_type === 'percentage') {
      return `${offer.discount_value}${(config as any).suffix || '% OFF'}`;
    } else if (offer.discount_type === 'fixed') {
      return `${(config as any).prefix || '€'}${offer.discount_value}${(config as any).suffix || ' OFF'}`;
    }
    return `${offer.discount_value}% OFF`;
  };

  const isOfferValid = (offer: Offer) => {
    const now = new Date();
    const validUntil = new Date(offer.valid_until);
    return offer.is_active && validUntil > now;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const activeOffers = offers.filter(isOfferValid);
  const expiredOffers = offers.filter(offer => !isOfferValid(offer));

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          padding: '40px 20px',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          color: '#666'
        }}
      >
        Loading offers...
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ padding: '40px 20px', height: '100%', overflow: 'auto' }}
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
        Special Offers 🎁
      </motion.h2>

      {/* Active Offers */}
      {activeOffers.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{ marginBottom: '40px' }}
        >
          <h3 style={{ 
            color: '#333', 
            fontSize: '20px', 
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <Gift size={24} color="#2ed573" />
            Available Offers
          </h3>

          <div style={{ display: 'grid', gap: '20px' }}>
            {activeOffers.map((offer, index) => {
              const config = typeConfig[offer.discount_type];
              return (
                <motion.div
                  key={offer.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.7))',
                    borderRadius: '20px',
                    padding: '25px',
                    boxShadow: '0 5px 20px rgba(0,0,0,0.1)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* Discount Badge */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '20px',
                      right: '20px',
                      background: config.color,
                      color: 'white',
                      padding: '8px 15px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    {config.icon}
                    {formatDiscount(offer)}
                  </div>

                  <div style={{ marginRight: '120px' }}>
                    <h4 style={{ 
                      color: '#333', 
                      margin: '0 0 10px 0', 
                      fontSize: '20px',
                      fontWeight: 'bold'
                    }}>
                      {offer.title}
                    </h4>
                    <p style={{ 
                      color: '#666', 
                      margin: '0 0 15px 0', 
                      fontSize: '16px',
                      lineHeight: '1.5'
                    }}>
                      {offer.description}
                    </p>

                    {offer.minimum_order && (
                      <p style={{ 
                        color: '#888', 
                        margin: '0 0 15px 0', 
                        fontSize: '14px',
                        fontStyle: 'italic'
                      }}>
                        * Minimum order: €{offer.minimum_order}
                      </p>
                    )}

                    {/* Code Section */}
                    <div style={{
                      background: 'rgba(0,0,0,0.05)',
                      borderRadius: '15px',
                      padding: '15px',
                      marginBottom: '15px'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center' 
                      }}>
                        <div>
                          <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
                            Promo Code
                          </div>
                          <div style={{ 
                            fontSize: '18px', 
                            fontWeight: 'bold', 
                            color: '#333',
                            fontFamily: 'monospace',
                            letterSpacing: '1px'
                          }}>
                            {offer.code}
                          </div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => copyCode(offer.code)}
                          style={{
                            background: copiedCode === offer.code ? '#2ed573' : '#667eea',
                            border: 'none',
                            color: 'white',
                            padding: '10px',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <AnimatePresence mode="wait">
                            {copiedCode === offer.code ? (
                              <motion.div
                                key="check"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                              >
                                <CheckCircle size={20} />
                              </motion.div>
                            ) : (
                              <motion.div
                                key="copy"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                              >
                                <Copy size={20} />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.button>
                      </div>
                    </div>

                    {/* Validity */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      fontSize: '14px',
                      color: '#FF6B6B'
                    }}>
                      <Clock size={16} />
                      Valid until: {formatDate(offer.valid_until)}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Expired Offers */}
      {expiredOffers.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h3 style={{ 
            color: '#999', 
            fontSize: '18px', 
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <Clock size={20} color="#999" />
            Expired Offers
          </h3>

          <div style={{ display: 'grid', gap: '15px' }}>
            {expiredOffers.map((offer, index) => {
              const config = typeConfig[offer.discount_type];
              return (
                <motion.div
                  key={offer.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  style={{
                    background: 'rgba(200, 200, 200, 0.3)',
                    borderRadius: '15px',
                    padding: '20px',
                    boxShadow: '0 3px 10px rgba(0,0,0,0.05)',
                    opacity: 0.6,
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ 
                        color: '#666', 
                        margin: '0 0 5px 0', 
                        fontSize: '16px'
                      }}>
                        {offer.title}
                      </h4>
                      <p style={{ 
                        color: '#999', 
                        margin: 0, 
                        fontSize: '14px'
                      }}>
                        Expired on {formatDate(offer.valid_until)}
                      </p>
                    </div>
                    <div style={{
                      background: '#999',
                      color: 'white',
                      padding: '5px 10px',
                      borderRadius: '10px',
                      fontSize: '12px'
                    }}>
                      EXPIRED
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* No Offers */}
      {activeOffers.length === 0 && expiredOffers.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#666'
          }}
        >
          <div style={{ fontSize: '80px', marginBottom: '20px' }}>🎁</div>
          <h3 style={{ fontSize: '24px', marginBottom: '10px', color: '#333' }}>
            No Offers Available
          </h3>
          <p style={{ fontSize: '16px' }}>
            Check back later for special deals and promotions!
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default OffersPage;
