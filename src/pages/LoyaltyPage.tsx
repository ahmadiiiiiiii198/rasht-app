import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Gift, Zap, Award, Trophy, Target, Coffee, Utensils, QrCode, ShoppingCart, Store, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCart } from '../hooks/useCart';
import { getUserOrders } from '../lib/database';
import { useAuth } from '../contexts/AuthContext';
import QRCode from 'react-qr-code';
import AuthModal from '../components/AuthModal';

interface LoyaltyReward {
  id: string;
  name: string;
  points_required: number;
  description: string;
  icon: string;
  is_active: boolean;
  category: 'food' | 'discount' | 'service';
}

interface UserLoyalty {
  current_points: number;
  total_earned: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  orders_count: number;
}

interface LoyaltyPageProps {
  onNavigate?: (page: string) => void;
}

const LoyaltyPage: React.FC<LoyaltyPageProps> = ({ onNavigate }) => {
  const cart = useCart();
  const { isLoggedIn, userEmail } = useAuth();
  const [userLoyalty, setUserLoyalty] = useState<UserLoyalty>({
    current_points: 0,
    total_earned: 0,
    tier: 'bronze',
    orders_count: 0
  });
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'food' | 'discount' | 'service'>('all');

  // Redemption State
  const [selectedReward, setSelectedReward] = useState<LoyaltyReward | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showRedemptionChoice, setShowRedemptionChoice] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // React to auth changes - reset state when logged out
  useEffect(() => {
    if (!isLoggedIn) {
      setUserId(null);
      setUserLoyalty({
        current_points: 0,
        total_earned: 0,
        tier: 'bronze',
        orders_count: 0
      });
    }
  }, [isLoggedIn]);

  // Define helper functions first to satisfy TS no-use-before-declare
  const checkUserAuth = async (email: string) => {
    try {
      const { data } = await supabase
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
  };

  const calculateLoyaltyPoints = async (email: string) => {
    try {
      const orders = await getUserOrders(email);

      const validOrders = orders.filter(o => {
        const status = (o.status || '').toLowerCase();
        const orderStatus = (o.order_status || '').toLowerCase();
        return ['confirmed', 'delivered', 'completed', 'shipped'].some(s =>
          status.includes(s) || orderStatus.includes(s)
        );
      });

      const totalSpent = validOrders.reduce((sum, order) => {
        const amount = typeof order.total_amount === 'string'
          ? parseFloat(order.total_amount)
          : order.total_amount;
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);

      const currentPoints = Math.floor(totalSpent);

      let tier: 'bronze' | 'silver' | 'gold' | 'platinum' = 'bronze';
      if (currentPoints >= 1000) tier = 'platinum';
      else if (currentPoints >= 500) tier = 'gold';
      else if (currentPoints >= 200) tier = 'silver';

      setUserLoyalty({
        current_points: currentPoints,
        total_earned: currentPoints,
        tier: tier,
        orders_count: validOrders.length
      });

    } catch (error) {
      console.error('Error calculating loyalty points:', error);
    }
  };

  const loadRewards = async () => {
    try {
      const { data, error } = await supabase
        .from('loyalty_rewards')
        .select('*')
        .eq('is_active', true)
        .order('points_required', { ascending: true });

      if (error) throw error;
      setRewards(data || []);
    } catch (error) {
      console.error('Error loading rewards:', error);
      setRewards([]);
    }
  };

  const loadLoyaltyData = async () => {
    setLoading(true);
    try {
      const email = localStorage.getItem('customer_email');
      if (email) {
        await checkUserAuth(email);
        await calculateLoyaltyPoints(email);
      }
      await loadRewards();
    } catch (error) {
      console.error('Error loading loyalty data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLoyaltyData();
  }, []);

  const generateQRData = (reward: LoyaltyReward) => {
    return JSON.stringify({
      reward_id: reward.id,
      user_id: userId,
      type: 'loyalty_redemption',
      timestamp: Date.now(),
      points_cost: reward.points_required,
      reward_name: reward.name
    });
  };

  const handleAuthSuccess = async (newUserId: string) => {
    setUserId(newUserId);
    const email = localStorage.getItem('customer_email');
    if (email) {
      await calculateLoyaltyPoints(email);
    }
    if (selectedReward) {
      setShowRedemptionChoice(true);
    }
  };

  const handleRedeemClick = (reward: LoyaltyReward) => {
    if (!userId) {
      setSelectedReward(reward);
      setShowAuthModal(true);
    } else {
      setSelectedReward(reward);
      setShowRedemptionChoice(true);
    }
  };

  const handleAddToCart = () => {
    if (selectedReward) {
      cart.addItem({
        id: selectedReward.id,
        name: selectedReward.name,
        price: 0,
        quantity: 1,
        image_url: undefined,
        isLoyaltyReward: true,
        pointsCost: selectedReward.points_required,
        deliveryOnly: true
      });
      setShowRedemptionChoice(false);
      alert(`${selectedReward.name} aggiunto al carrello! (Solo consegna a domicilio)`);
    }
  };

  const getTierInfo = (tier: string) => {
    switch (tier) {
      case 'platinum':
        return { color: '#E5E7EB', textColor: '#333', icon: <Trophy size={24} />, name: 'Platino', nextTier: null, pointsToNext: 0 };
      case 'gold':
        return { color: '#c9a45c', textColor: '#0d3d2e', icon: <Award size={24} />, name: 'Oro', nextTier: 'Platino', pointsToNext: 1000 - userLoyalty.current_points };
      case 'silver':
        return { color: '#C0C0C0', textColor: '#333', icon: <Star size={24} />, name: 'Argento', nextTier: 'Oro', pointsToNext: 500 - userLoyalty.current_points };
      default:
        return { color: '#CD7F32', textColor: '#fff', icon: <Target size={24} />, name: 'Bronzo', nextTier: 'Argento', pointsToNext: 200 - userLoyalty.current_points };
    }
  };

  const getTierProgress = () => {
    const points = userLoyalty.current_points;
    if (points >= 1000) return 100;
    if (points >= 500) return ((points - 500) / 500) * 100;
    if (points >= 200) return ((points - 200) / 300) * 100;
    return (points / 200) * 100;
  };

  const filteredRewards = selectedCategory === 'all'
    ? rewards
    : rewards.filter(reward => reward.category === selectedCategory);

  const canRedeem = (pointsRequired: number) => userLoyalty.current_points >= pointsRequired;

  if (loading) {
    return (
      <div className="rashti-page" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="text-gold font-cinzel">Caricamento programma fedeltà...</div>
      </div>
    );
  }

  const tierInfo = getTierInfo(userLoyalty.tier);

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
          Programma Fedeltà
        </motion.h2>

        {/* User Status Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          style={{
            background: `linear-gradient(135deg, ${tierInfo.color} 0%, #fff 150%)`,
            borderRadius: '25px',
            padding: '30px',
            marginBottom: '30px',
            margin: '0 20px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            border: '1px solid rgba(255,255,255,0.5)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Shine effect */}
          <div style={{
            position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 60%)',
            pointerEvents: 'none'
          }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', position: 'relative' }}>
            <div style={{ color: tierInfo.textColor, marginRight: '10px' }}>
              {tierInfo.icon}
            </div>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '24px', color: tierInfo.textColor, fontFamily: 'Cinzel', fontWeight: 700 }}>
                livello {tierInfo.name}
              </h3>
              <div style={{ fontSize: '36px', fontWeight: '800', color: tierInfo.textColor, margin: '5px 0', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                {userLoyalty.current_points} Punti
              </div>
            </div>
          </div>

          {tierInfo.nextTier && (
            <div style={{ marginBottom: '20px', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: tierInfo.textColor, fontWeight: 600 }}>Prossimo: {tierInfo.nextTier}</span>
                <span style={{ fontSize: '13px', color: tierInfo.textColor }}>
                  ancora {tierInfo.pointsToNext} pt per livellare
                </span>
              </div>
              <div style={{
                width: '100%',
                height: '10px',
                background: 'rgba(0,0,0,0.1)',
                borderRadius: '5px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${getTierProgress()}%`,
                  height: '100%',
                  background: 'white',
                  borderRadius: '5px',
                  transition: 'width 0.3s ease',
                  boxShadow: '0 0 10px rgba(255,255,255,0.5)'
                }} />
              </div>
            </div>
          )}

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px',
            fontSize: '14px',
            color: tierInfo.textColor,
            position: 'relative'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: 'bold' }}>
                {userLoyalty.orders_count}
              </div>
              <div style={{ fontFamily: 'Cormorant Garamond', fontWeight: 600 }}>Ordini Fatti</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: 'bold' }}>
                {userLoyalty.total_earned}
              </div>
              <div style={{ fontFamily: 'Cormorant Garamond', fontWeight: 600 }}>Totale Punti</div>
            </div>
          </div>
        </motion.div>

        {/* 🍕 Free Pizza Progress Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25 }}
          className="rashti-card-light"
          style={{
            margin: '0 20px 30px 20px',
            padding: '20px',
            border: userLoyalty.orders_count >= 10 ? '2px solid #22c55e' : '1px solid #e2e8f0'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '16px' }}>
            <div style={{ fontSize: '40px' }}>🍕</div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#0d3d2e', fontFamily: 'Cinzel', fontWeight: 700 }}>
                {userLoyalty.orders_count >= 10 ? 'Pizza Gratis Sbloccata!' : 'Pizza Gratis al 10° ordine'}
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#666' }}>
                {userLoyalty.orders_count >= 10
                  ? 'Riscatta subito la tua pizza!'
                  : `Mancano ${10 - userLoyalty.orders_count} ordini`}
              </p>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{
              width: '100%',
              height: '12px',
              background: '#e2e8f0',
              borderRadius: '6px',
              overflow: 'hidden'
            }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((userLoyalty.orders_count / 10) * 100, 100)}%` }}
                style={{
                  height: '100%',
                  background: userLoyalty.orders_count >= 10
                    ? '#22c55e'
                    : '#c9a45c',
                  borderRadius: '6px'
                }}
              />
            </div>
          </div>

          {userLoyalty.orders_count >= 10 && (
            <button
              onClick={() => {
                const freePizzaReward: LoyaltyReward = {
                  id: 'free-pizza-10-orders',
                  name: 'Pizza Gratis (10 Ordini)',
                  points_required: 0,
                  description: 'Premio fedeltà!',
                  icon: '🍕',
                  is_active: true,
                  category: 'food'
                };
                setSelectedReward(freePizzaReward);
                setShowRedemptionChoice(true);
              }}
              className="rashti-btn-primary"
              style={{ width: '100%', background: '#22c55e', color: 'white' }}
            >
              🎁 Riscatta Subito
            </button>
          )}
        </motion.div>

        {/* Category Filter */}
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '0 20px 20px 20px' }}>
          {[
            { id: 'all', label: 'Tutti', icon: <Gift size={16} /> },
            { id: 'food', label: 'Cibo', icon: <Utensils size={16} /> },
            { id: 'discount', label: 'Sconti', icon: <Zap size={16} /> },
            { id: 'service', label: 'Extra', icon: <Coffee size={16} /> }
          ].map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id as any)}
              className="rashti-chip"
              style={{
                background: selectedCategory === category.id ? 'var(--persian-gold)' : 'transparent',
                color: selectedCategory === category.id ? '#0d3d2e' : '#0d3d2e',
                border: selectedCategory === category.id ? 'none' : '1px solid #0d3d2e',
                fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              {category.icon}
              {category.label}
            </button>
          ))}
        </div>

        {/* Available Rewards */}
        <div style={{ padding: '0 20px', marginBottom: '30px' }}>
          <h3 style={{ fontSize: '20px', color: '#0d3d2e', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'Cinzel' }}>
            <Star size={24} color="#c9a45c" fill="#c9a45c" />
            Premi Disponibili
          </h3>

          {filteredRewards.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
              Nessun premio disponibile.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {filteredRewards.map((reward, index) => (
                <motion.div
                  key={reward.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="rashti-card-light"
                  style={{
                    padding: '15px',
                    borderRadius: '16px',
                    border: canRedeem(reward.points_required) ? '1px solid #c9a45c' : '1px solid transparent',
                    background: canRedeem(reward.points_required) ? '#fffef0' : 'white',
                    opacity: reward.is_active ? 1 : 0.6
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ fontSize: '36px' }}>{reward.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h4 style={{ margin: 0, fontSize: '18px', color: '#0d3d2e', fontFamily: 'Cinzel', fontWeight: 700 }}>{reward.name}</h4>
                        {canRedeem(reward.points_required) && (
                          <span style={{ background: '#22c55e', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>SI!</span>
                        )}
                      </div>
                      <p style={{ margin: '4px 0 8px 0', fontSize: '14px', color: '#666' }}>{reward.description}</p>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#c9a45c' }}>{reward.points_required} punti</span>
                        <button
                          disabled={!canRedeem(reward.points_required)}
                          onClick={() => { if (canRedeem(reward.points_required)) handleRedeemClick(reward); }}
                          className="rashti-chip"
                          style={{
                            fontSize: '12px', padding: '6px 12px',
                            background: canRedeem(reward.points_required) ? '#0d3d2e' : '#eee',
                            color: canRedeem(reward.points_required) ? '#c9a45c' : '#999',
                            border: 'none', cursor: canRedeem(reward.points_required) ? 'pointer' : 'not-allowed'
                          }}
                        >
                          Riscatta
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Redemption Choice Modal */}
      <AnimatePresence>
        {showRedemptionChoice && selectedReward && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowRedemptionChoice(false)}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(5, 26, 20, 0.9)', zIndex: 3000,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
            }}
          >
            <motion.div
              initial={{ scale: 0.8 }} animate={{ scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="rashti-card-light"
              style={{ width: '100%', maxWidth: '350px', textAlign: 'center', padding: '30px', borderRadius: '24px' }}
            >
              <div style={{ fontSize: '60px', marginBottom: '15px' }}>{selectedReward.icon}</div>
              <h3 className="rashti-title" style={{ fontSize: '22px', marginBottom: '10px', color: '#0d3d2e' }}>{selectedReward.name}</h3>
              <p style={{ color: '#666', marginBottom: '25px', fontFamily: 'Cormorant Garamond' }}>Come vuoi usare questo premio?</p>

              <div style={{ display: 'grid', gap: '15px' }}>
                <button
                  onClick={() => { setShowRedemptionChoice(false); setShowQRModal(true); }}
                  className="rashti-btn-primary"
                  style={{ width: '100%', background: 'white', border: '1px solid #c9a45c', color: '#0d3d2e' }}
                >
                  <Store size={20} style={{ marginRight: '8px' }} />
                  Usa in Negozio (QR)
                </button>
                <button
                  onClick={handleAddToCart}
                  className="rashti-btn-primary"
                  style={{ width: '100%' }}
                >
                  <ShoppingCart size={20} style={{ marginRight: '8px' }} />
                  Aggiungi al Carrello
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Modal */}
      <AnimatePresence>
        {showQRModal && selectedReward && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowQRModal(false)}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(5, 26, 20, 0.95)', zIndex: 3000,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
            }}
          >
            <motion.div
              initial={{ scale: 0.8 }} animate={{ scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              style={{ background: 'white', padding: '30px', borderRadius: '24px', textAlign: 'center', maxWidth: '320px', width: '100%' }}
            >
              <h3 className="rashti-title" style={{ color: '#0d3d2e', fontSize: '20px', marginBottom: '20px' }}>Mostra alla cassa</h3>
              <div style={{ background: 'white', padding: '10px', borderRadius: '10px', display: 'inline-block', marginBottom: '20px' }}>
                <QRCode value={generateQRData(selectedReward)} size={200} />
              </div>
              <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>Mostra questo codice allo staff per riscattare: <strong>{selectedReward.name}</strong></p>
              <button onClick={() => setShowQRModal(false)} className="rashti-btn-primary" style={{ width: '100%' }}>Chiudi</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export default LoyaltyPage;
