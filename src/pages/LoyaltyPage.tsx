import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Gift, Zap, Award, Trophy, Target, Coffee, Utensils, QrCode, ShoppingCart, Store } from 'lucide-react';
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
      // Get user orders to calculate loyalty points
      const orders = await getUserOrders(email);

      // Filter valid orders - only count confirmed/delivered orders
      const validOrders = orders.filter(o => {
        const status = (o.status || '').toLowerCase();
        const orderStatus = (o.order_status || '').toLowerCase();
        // Allow confirmed, delivered, completed, or shipped
        // 'confirmed' is used when order is placed successfully
        return ['confirmed', 'delivered', 'completed', 'shipped'].some(s =>
          status.includes(s) || orderStatus.includes(s)
        );
      });

      // Calculate points (1 point per €1 spent)
      const totalSpent = validOrders.reduce((sum, order) => {
        // Handle potential string values from DB for numeric fields
        const amount = typeof order.total_amount === 'string'
          ? parseFloat(order.total_amount)
          : order.total_amount;
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);

      const currentPoints = Math.floor(totalSpent);

      // Determine tier based on total points
      let tier: 'bronze' | 'silver' | 'gold' | 'platinum' = 'bronze';
      if (currentPoints >= 1000) tier = 'platinum';
      else if (currentPoints >= 500) tier = 'gold';
      else if (currentPoints >= 200) tier = 'silver';

      setUserLoyalty({
        current_points: currentPoints,
        total_earned: currentPoints, // In real app, this would track all-time earned points
        tier: tier,
        orders_count: validOrders.length
      });

    } catch (error) {
      console.error('Error calculating loyalty points:', error);
    }
  };

  const loadRewards = async () => {
    try {
      // Load rewards from new 'loyalty_rewards' table
      const { data, error } = await supabase
        .from('loyalty_rewards')
        .select('*')
        .eq('is_active', true)
        .order('points_required', { ascending: true });

      if (error) throw error;
      setRewards(data || []);
    } catch (error) {
      console.error('Error loading rewards:', error);
      // Fallback empty or previously hardcoded logic removed as requested "totally from admin app"
      setRewards([]);
    }
  };

  const loadLoyaltyData = async () => {
    setLoading(true);
    try {
      // Get user email
      const email = localStorage.getItem('customer_email');

      // Also try to get user_id from profile if we have email
      if (email) {
        await checkUserAuth(email);
        await calculateLoyaltyPoints(email);
      }

      // If no email, we don't prompt - we wait for user to try to redeem
      // or we could show a "Log in to see points" state. 
      // For now, keeping existing flow but removing prompt.

      await loadRewards();
    } catch (error) {
      console.error('Error loading loyalty data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLoyaltyData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // Refresh points for this user
    const email = localStorage.getItem('customer_email');
    if (email) {
      await calculateLoyaltyPoints(email);
    }

    // If we were trying to redeem, show choice now
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
        image_url: undefined, // Reward icons are emojis, not URLs
        isLoyaltyReward: true,
        pointsCost: selectedReward.points_required,
        deliveryOnly: true // Loyalty rewards can only be delivered, not picked up
      });
      setShowRedemptionChoice(false);
      alert(`${selectedReward.name} aggiunto al carrello! (Solo consegna a domicilio)`);
    }
  };

  const getTierInfo = (tier: string) => {
    switch (tier) {
      case 'platinum':
        return { color: '#E5E7EB', icon: <Trophy size={24} />, name: 'Platino', nextTier: null, pointsToNext: 0 };
      case 'gold':
        return { color: '#F59E0B', icon: <Award size={24} />, name: 'Oro', nextTier: 'Platino', pointsToNext: 1000 - userLoyalty.current_points };
      case 'silver':
        return { color: '#6B7280', icon: <Star size={24} />, name: 'Argento', nextTier: 'Oro', pointsToNext: 500 - userLoyalty.current_points };
      default:
        return { color: '#CD7F32', icon: <Target size={24} />, name: 'Bronzo', nextTier: 'Argento', pointsToNext: 200 - userLoyalty.current_points };
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
        Caricamento programma fedeltà...
      </motion.div>
    );
  }

  const tierInfo = getTierInfo(userLoyalty.tier);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ padding: '20px 0' }}
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
        Programma Fedeltà ⭐
      </motion.h2>

      {/* User Status Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        style={{
          background: `linear-gradient(135deg, ${tierInfo.color}20, ${tierInfo.color}10)`,
          borderRadius: '25px',
          padding: '30px',
          marginBottom: '30px',
          border: `2px solid ${tierInfo.color}40`
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
          <div style={{ color: tierInfo.color, marginRight: '10px' }}>
            {tierInfo.icon}
          </div>
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '24px', color: '#333' }}>
              Membro {tierInfo.name}
            </h3>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: tierInfo.color, margin: '10px 0' }}>
              {userLoyalty.current_points} Punti
            </div>
          </div>
        </div>

        {tierInfo.nextTier && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '14px', color: '#666' }}>Progressi per {tierInfo.nextTier}</span>
              <span style={{ fontSize: '14px', color: '#666' }}>
                {tierInfo.pointsToNext} punti mancanti
              </span>
            </div>
            <div style={{
              width: '100%',
              height: '8px',
              background: 'rgba(0,0,0,0.1)',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${getTierProgress()}%`,
                height: '100%',
                background: tierInfo.color,
                borderRadius: '4px',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          fontSize: '14px',
          color: '#666'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#333' }}>
              {userLoyalty.orders_count}
            </div>
            <div>Ordini Effettuati</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#333' }}>
              {userLoyalty.total_earned}
            </div>
            <div>Totale Punti</div>
          </div>
        </div>
      </motion.div>

      {/* 🍕 Free Pizza Progress Card (10 Orders = Free Pizza) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.25 }}
        style={{
          background: userLoyalty.orders_count >= 10
            ? 'linear-gradient(135deg, #22c55e20, #22c55e10)'
            : 'linear-gradient(135deg, #ea580c20, #ea580c10)',
          borderRadius: '20px',
          padding: '24px',
          marginBottom: '30px',
          border: userLoyalty.orders_count >= 10
            ? '2px solid #22c55e40'
            : '2px solid #ea580c40'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '16px' }}>
          <div style={{ fontSize: '40px' }}>🍕</div>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', color: '#333' }}>
              {userLoyalty.orders_count >= 10 ? '🎉 Pizza Gratis Disponibile!' : 'Pizza Gratis dopo 10 Ordini'}
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#666' }}>
              {userLoyalty.orders_count >= 10
                ? 'Complimenti! Hai guadagnato una pizza gratis!'
                : `Ancora ${10 - userLoyalty.orders_count} ordini per sbloccare`}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '13px', color: '#666' }}>Progresso</span>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: userLoyalty.orders_count >= 10 ? '#22c55e' : '#ea580c' }}>
              {Math.min(userLoyalty.orders_count, 10)}/10 ordini
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '12px',
            background: 'rgba(0,0,0,0.1)',
            borderRadius: '6px',
            overflow: 'hidden'
          }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((userLoyalty.orders_count / 10) * 100, 100)}%` }}
              style={{
                height: '100%',
                background: userLoyalty.orders_count >= 10
                  ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                  : 'linear-gradient(90deg, #ea580c, #fb923c)',
                borderRadius: '6px'
              }}
            />
          </div>
        </div>

        {/* Claim Button */}
        {userLoyalty.orders_count >= 10 && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              // Create a virtual "Free Pizza" reward for redemption
              const freePizzaReward: LoyaltyReward = {
                id: 'free-pizza-10-orders',
                name: 'Pizza Gratis (10 Ordini)',
                points_required: 0,
                description: 'Premio fedeltà per 10 ordini completati!',
                icon: '🍕',
                is_active: true,
                category: 'food'
              };
              setSelectedReward(freePizzaReward);
              setShowRedemptionChoice(true);
            }}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(34, 197, 94, 0.4)'
            }}
          >
            🎁 Riscatta Pizza Gratis
          </motion.button>
        )}
      </motion.div>

      {/* Category Filter */}
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        style={{
          display: 'flex',
          gap: '10px',
          overflowX: 'auto',
          padding: '10px 0',
          marginBottom: '30px'
        }}
      >
        {[
          { id: 'all', label: 'Tutti', icon: <Gift size={16} /> },
          { id: 'food', label: 'Cibo', icon: <Utensils size={16} /> },
          { id: 'discount', label: 'Sconti', icon: <Zap size={16} /> },
          { id: 'service', label: 'Extra', icon: <Coffee size={16} /> }
        ].map((category) => (
          <motion.button
            key={category.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedCategory(category.id as any)}
            style={{
              background: selectedCategory === category.id ? '#667eea' : 'rgba(255, 255, 255, 0.3)',
              color: selectedCategory === category.id ? 'white' : '#333',
              border: `2px solid ${selectedCategory === category.id ? '#667eea' : '#ddd'}`,
              borderRadius: '20px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              minWidth: 'fit-content',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.3s ease'
            }}
          >
            {category.icon}
            {category.label}
          </motion.button>
        ))}
      </motion.div>

      {/* Available Rewards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        style={{ marginBottom: '30px' }}
      >
        <h3 style={{
          fontSize: '20px',
          color: '#333',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <Star size={24} color="#2ed573" />
          Premi Disponibili
        </h3>

        {filteredRewards.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
            Nessun premio disponibile al momento.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {filteredRewards.map((reward, index) => (
              <motion.div
                key={reward.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                style={{
                  background: canRedeem(reward.points_required)
                    ? 'linear-gradient(135deg, rgba(46, 213, 115, 0.1), rgba(46, 213, 115, 0.05))'
                    : 'rgba(255, 255, 255, 0.9)',
                  borderRadius: '20px',
                  padding: '20px',
                  boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
                  border: canRedeem(reward.points_required)
                    ? '2px solid #2ed57320'
                    : '1px solid rgba(255,255,255,0.3)',
                  position: 'relative',
                  opacity: reward.is_active ? 1 : 0.6
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ fontSize: '40px' }}>
                    {reward.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '5px' }}>
                      <h4 style={{
                        margin: 0,
                        fontSize: '18px',
                        color: canRedeem(reward.points_required) ? '#2ed573' : '#333',
                        lineHeight: '1.2',
                        paddingRight: '10px'
                      }}>
                        {reward.name}
                      </h4>
                      {canRedeem(reward.points_required) && (
                        <span style={{
                          background: '#2ed573',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '8px',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          whiteSpace: 'nowrap',
                          flexShrink: 0
                        }}>
                          Disponibile!
                        </span>
                      )}
                    </div>

                    <p style={{
                      margin: '0 0 10px 0',
                      fontSize: '14px',
                      color: '#666',
                      lineHeight: '1.4'
                    }}>
                      {reward.description}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '14px',
                        color: '#667eea'
                      }}>
                        <Star size={16} fill="#667eea" />
                        {reward.points_required} punti
                      </div>
                      <motion.button
                        whileHover={canRedeem(reward.points_required) ? { scale: 1.05 } : {}}
                        whileTap={canRedeem(reward.points_required) ? { scale: 0.95 } : {}}
                        disabled={!canRedeem(reward.points_required)}
                        style={{
                          background: canRedeem(reward.points_required) ? '#2ed573' : '#ccc',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '12px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: canRedeem(reward.points_required) ? 'pointer' : 'not-allowed'
                        }}
                        onClick={() => {
                          if (canRedeem(reward.points_required)) {
                            handleRedeemClick(reward);
                          }
                        }}
                      >
                        {canRedeem(reward.points_required) ? 'Riscatta' : 'Punti insuff.'}
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* How to Earn Points */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        style={{
          background: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '20px',
          padding: '25px',
          boxShadow: '0 5px 20px rgba(0,0,0,0.1)'
        }}
      >
        <h3 style={{
          fontSize: '20px',
          color: '#333',
          marginBottom: '20px'
        }}>
          Come guadagnare punti 🎯
        </h3>

        <div style={{ display: 'grid', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}>
              🛒
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>Effettua Ordini</div>
              <div style={{ fontSize: '14px', color: '#666' }}>Guadagna 1 punto per ogni €1 speso</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #FF6B6B, #ff8e53)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}>
              ⭐
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>Lascia Recensioni</div>
              <div style={{ fontSize: '14px', color: '#666' }}>Ricevi 10 punti bonus per ogni recensione</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #4ECDC4, #44A08D)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}>
              🎂
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>Bonus Compleanno</div>
              <div style={{ fontSize: '14px', color: '#666' }}>Ricevi 50 punti il giorno del tuo compleanno</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Redemption Choice Modal */}
      <AnimatePresence>
        {showRedemptionChoice && selectedReward && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowRedemptionChoice(false)}
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
              zIndex: 3000,
              padding: '20px'
            }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#fff',
                padding: '30px',
                borderRadius: '24px',
                maxWidth: '400px',
                width: '100%',
                textAlign: 'center',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>{selectedReward.icon}</div>
              <h3 style={{ margin: '0 0 10px 0', color: '#1f2937', fontSize: '24px', fontWeight: 'bold' }}>
                {selectedReward.name}
              </h3>
              <p style={{ margin: '0 0 25px 0', color: '#6b7280', fontSize: '16px' }}>
                Come vuoi riscattare questo premio?
              </p>

              <div style={{ display: 'grid', gap: '12px' }}>
                <button
                  onClick={() => {
                    setShowRedemptionChoice(false);
                    setShowQRModal(true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '16px',
                    borderRadius: '16px',
                    border: '1px solid #e5e7eb',
                    background: '#fff',
                    color: '#374151',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <Store size={20} />
                  Usa Ora in Negozio (QR)
                </button>

                <button
                  onClick={handleAddToCart}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '16px',
                    borderRadius: '16px',
                    border: 'none',
                    background: '#2ed573',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxShadow: '0 4px 6px -1px rgba(46, 213, 115, 0.4)'
                  }}
                >
                  <ShoppingCart size={20} />
                  Aggiungi all'Ordine
                </button>
              </div>

              <button
                onClick={() => setShowRedemptionChoice(false)}
                style={{
                  marginTop: '20px',
                  background: 'transparent',
                  border: 'none',
                  color: '#9ca3af',
                  fontSize: '14px',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Annulla
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Code Modal for Loyalty */}
      <AnimatePresence>
        {showQRModal && selectedReward && (
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
              zIndex: 3000,
              padding: '20px'
            }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#1e293b',
                padding: '30px',
                borderRadius: '32px',
                maxWidth: '350px',
                width: '100%',
                textAlign: 'center',
                border: '1px solid #334155'
              }}
            >
              <h3 style={{ margin: '0 0 5px 0', color: 'white', fontSize: '20px' }}>{selectedReward.name}</h3>

              <div style={{ marginBottom: '15px' }}>
                <p style={{ margin: '4px 0 0 0', fontSize: '18px', color: '#fb923c', fontWeight: 'bold' }}>
                  Costo: {selectedReward.points_required} Punti
                </p>
              </div>

              <div style={{ background: 'white', padding: '15px', display: 'inline-block', borderRadius: '20px' }}>
                <QRCode
                  value={generateQRData(selectedReward)}
                  size={200}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  viewBox={`0 0 256 256`}
                />
              </div>

              <p style={{ marginTop: '20px', color: '#94a3b8', fontSize: '14px' }}>
                Mostra questo QR code al personale per riscattare il premio.
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

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Floating Cart Button */}
      <AnimatePresence>
        {cart.getTotalItems() > 0 && (
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
              pointerEvents: 'none'
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
                  minWidth: '200px',
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
                    {cart.getTotalItems()}
                  </span>
                </div>
                <span>Go to Cart</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default LoyaltyPage;
