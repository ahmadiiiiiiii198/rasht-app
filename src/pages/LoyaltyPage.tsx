import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Gift, Zap, Award, Trophy, Target, Coffee, Utensils } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getUserOrders } from '../lib/database';

interface LoyaltyReward {
  id: string;
  name: string;
  points_required: number;
  description: string;
  icon: string;
  is_available: boolean;
  category: 'food' | 'discount' | 'service';
}

interface UserLoyalty {
  current_points: number;
  total_earned: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  orders_count: number;
}

const LoyaltyPage: React.FC = () => {
  const [userLoyalty, setUserLoyalty] = useState<UserLoyalty>({
    current_points: 0,
    total_earned: 0,
    tier: 'bronze',
    orders_count: 0
  });
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'food' | 'discount' | 'service'>('all');

  useEffect(() => {
    loadLoyaltyData();
  }, []);

  const loadLoyaltyData = async () => {
    setLoading(true);
    try {
      // Get user email
      const email = localStorage.getItem('customer_email');
      if (!email) {
        const userEmail = prompt('Enter your email to view loyalty points:');
        if (userEmail) {
          localStorage.setItem('customer_email', userEmail);
          await calculateLoyaltyPoints(userEmail);
        }
      } else {
        await calculateLoyaltyPoints(email);
      }

      await loadRewards();
    } catch (error) {
      console.error('Error loading loyalty data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateLoyaltyPoints = async (email: string) => {
    try {
      // Get user orders to calculate loyalty points
      const orders = await getUserOrders(email);
      
      // Calculate points (1 point per €1 spent)
      const totalSpent = orders.reduce((sum, order) => sum + order.total_amount, 0);
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
        orders_count: orders.length
      });
      
    } catch (error) {
      console.error('Error calculating loyalty points:', error);
    }
  };

  const loadRewards = async () => {
    try {
      // Try to load rewards from database
      const { data, error } = await supabase
        .from('site_content')
        .select('*')
        .eq('section', 'loyalty_rewards')
        .eq('is_active', true);

      if (data && data.length > 0) {
        const rewardsData = data.map(item => {
          const additionalData = typeof item.additional_data === 'string' 
            ? JSON.parse(item.additional_data) 
            : item.additional_data;
            
          return {
            id: item.id,
            name: item.title || 'Reward',
            points_required: additionalData?.points_required || 50,
            description: item.content || item.subtitle || '',
            icon: additionalData?.icon || '🎁',
            is_available: item.is_active,
            category: additionalData?.category || 'discount'
          };
        });
        setRewards(rewardsData);
      } else {
        // Fallback: try content_sections if site_content has no data
        const { data: altData } = await supabase
          .from('content_sections')
          .select('*')
          .eq('section', 'loyalty_rewards')
          .eq('is_active', true);

        if (altData && altData.length > 0) {
          const rewardsData = altData.map(item => {
            const additionalData = typeof item.additional_data === 'string'
              ? JSON.parse(item.additional_data)
              : item.additional_data;
            return {
              id: item.id,
              name: item.title || 'Reward',
              points_required: additionalData?.points_required || 50,
              description: item.content || item.subtitle || '',
              icon: additionalData?.icon || '🎁',
              is_available: item.is_active,
              category: additionalData?.category || 'discount'
            };
          });
          setRewards(rewardsData);
        } else {
          // Set default rewards if none in database
          setRewards([
            {
              id: '1',
              name: 'Free Turkish Tea',
              points_required: 50,
              description: 'Get a complimentary Turkish tea with any order',
              icon: '🫖',
              is_available: true,
              category: 'food'
            },
            {
              id: '2',
              name: '10% Off Next Order',
              points_required: 100,
              description: 'Save 10% on your next purchase',
              icon: '💰',
              is_available: true,
              category: 'discount'
            },
            {
              id: '3',
              name: 'Free Baklava',
              points_required: 150,
              description: 'Enjoy our delicious baklava on the house',
              icon: '🍯',
              is_available: true,
              category: 'food'
            },
            {
              id: '4',
              name: 'Upgrade to Large',
              points_required: 200,
              description: 'Free upgrade from medium to large size',
              icon: '⬆️',
              is_available: true,
              category: 'service'
            },
            {
              id: '5',
              name: 'Free Döner Kebap',
              points_required: 300,
              description: 'Get a free döner kebap with your order',
              icon: '🥙',
              is_available: true,
              category: 'food'
            }
          ]);
        }
      }
    } catch (error) {
      console.error('Error loading rewards:', error);
      setRewards([]);
    }
  };

  const getTierInfo = (tier: string) => {
    switch (tier) {
      case 'platinum':
        return { color: '#E5E7EB', icon: <Trophy size={24} />, name: 'Platinum', nextTier: null, pointsToNext: 0 };
      case 'gold':
        return { color: '#F59E0B', icon: <Award size={24} />, name: 'Gold', nextTier: 'Platinum', pointsToNext: 1000 - userLoyalty.current_points };
      case 'silver':
        return { color: '#6B7280', icon: <Star size={24} />, name: 'Silver', nextTier: 'Gold', pointsToNext: 500 - userLoyalty.current_points };
      default:
        return { color: '#CD7F32', icon: <Target size={24} />, name: 'Bronze', nextTier: 'Silver', pointsToNext: 200 - userLoyalty.current_points };
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
        Loading loyalty program...
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
        Loyalty Rewards ⭐
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
            🥈
          </div>
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '24px', color: '#333' }}>
              {tierInfo.name} Member
            </h3>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: tierInfo.color, margin: '10px 0' }}>
              {userLoyalty.current_points} Points
            </div>
          </div>
        </div>

        {tierInfo.nextTier && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '14px', color: '#666' }}>Progress to {tierInfo.nextTier}</span>
              <span style={{ fontSize: '14px', color: '#666' }}>
                {tierInfo.pointsToNext} points to go
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
            <div>Orders Placed</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#333' }}>
              {userLoyalty.total_earned}
            </div>
            <div>Total Earned</div>
          </div>
        </div>
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
          { id: 'all', label: 'All', icon: <Gift size={16} /> },
          { id: 'food', label: 'Food', icon: <Utensils size={16} /> },
          { id: 'discount', label: 'Discounts', icon: <Zap size={16} /> },
          { id: 'service', label: 'Services', icon: <Coffee size={16} /> }
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
          Available Rewards
        </h3>

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
                opacity: reward.is_available ? 1 : 0.6
              }}
            >
              {canRedeem(reward.points_required) && (
                <div style={{
                  position: 'absolute',
                  top: '15px',
                  right: '15px',
                  background: '#2ed573',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  Available!
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ fontSize: '40px' }}>
                  {reward.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{
                    margin: '0 0 5px 0',
                    fontSize: '18px',
                    color: canRedeem(reward.points_required) ? '#2ed573' : '#333'
                  }}>
                    {reward.name}
                  </h4>
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
                      {reward.points_required} points
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
                          alert(`Redeeming ${reward.name}! This would integrate with the actual redemption system.`);
                        }
                      }}
                    >
                      {canRedeem(reward.points_required) ? 'Redeem' : 'Not enough points'}
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
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
          How to Earn Points 🎯
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
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>Make Orders</div>
              <div style={{ fontSize: '14px', color: '#666' }}>Earn 1 point for every €1 spent</div>
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
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>Leave Reviews</div>
              <div style={{ fontSize: '14px', color: '#666' }}>Get 10 bonus points for each review</div>
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
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>Birthday Bonus</div>
              <div style={{ fontSize: '14px', color: '#666' }}>Receive 50 points on your birthday</div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LoyaltyPage;
