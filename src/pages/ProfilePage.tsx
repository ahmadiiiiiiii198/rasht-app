import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Edit3, Camera, Heart, Settings, Save } from 'lucide-react';
import { supabase, UserProfile } from '../lib/supabase';
import { getUserOrders } from '../lib/database';

// Using UserProfile interface from database

const ProfilePage: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState({
    totalOrders: 0,
    loyaltyPoints: 0,
    favoriteOrder: 'Not available'
  });
  const [userEmail, setUserEmail] = useState('');
  const [loginEmail, setLoginEmail] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      // Get user email from localStorage or prompt
      let email = localStorage.getItem('customer_email');
      if (!email) {
        setLoading(false);
        return;
      }
      setUserEmail(email);

      // Try to get user profile from user_profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('email', email)
        .single();

      if (profileData) {
        setProfile(profileData);
      } else {
        // Create a new profile if doesn't exist
        const newProfile = {
          id: (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
            ? crypto.randomUUID()
            : `user_${Date.now()}`,
          email: email,
          full_name: null,
          phone: null,
          default_address: null,
          preferences: {
            notifications: true,
            newsletter: false
          }
        };

        const { data: createdProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert(newProfile)
          .select()
          .single();

        if (createdProfile) {
          setProfile(createdProfile);
        } else {
          console.error('Error creating profile:', createError);
          // Set a default profile
          setProfile({
            id: newProfile.id,
            email: email,
            full_name: null,
            phone: null,
            default_address: null,
            preferences: newProfile.preferences,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      }

      // Load user statistics
      await loadUserStats(email);

    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async (email: string) => {
    try {
      // Get user orders to calculate stats
      const orders = await getUserOrders(email);

      // Calculate loyalty points (1 point per €1 spent)
      const totalSpent = orders.reduce((sum, order) => sum + order.total_amount, 0);
      const loyaltyPoints = Math.floor(totalSpent);

      // Find most frequent order (simplified)
      const orderCounts: { [key: string]: number } = {};
      orders.forEach(order => {
        const items = order.special_instructions || 'Mixed order';
        orderCounts[items] = (orderCounts[items] || 0) + 1;
      });

      const favoriteOrder = Object.keys(orderCounts).length > 0
        ? Object.entries(orderCounts).sort((a, b) => b[1] - a[1])[0][0]
        : 'No orders yet';

      setStats({
        totalOrders: orders.length,
        loyaltyPoints,
        favoriteOrder: favoriteOrder.includes('items') ? 'Mixed orders' : favoriteOrder
      });

    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          default_address: profile.default_address,
          preferences: profile.preferences,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (error) {
        console.error('Error saving profile:', error);
        alert('Failed to save profile. Please try again.');
      } else {
        setIsEditing(false);
        alert('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateProfile = (field: keyof UserProfile, value: string) => {
    if (profile) {
      setProfile({
        ...profile,
        [field]: value
      });
    }
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
        Loading your profile...
      </motion.div>
    );
  }

  if (!profile) {
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
        <div style={{ fontSize: '60px', marginBottom: '20px' }}>👤</div>
        <h2 style={{ fontSize: '24px', marginBottom: '10px', color: '#333' }}>
          Welcome
        </h2>
        <p style={{ color: '#666', fontSize: '16px', marginBottom: '20px' }}>
          Please enter your email to view your profile
        </p>
        <div style={{ width: '100%', maxWidth: '300px' }}>
          <input
            type="email"
            placeholder="Enter your email"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
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
              if (loginEmail) {
                localStorage.setItem('customer_email', loginEmail);
                loadProfile();
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
            View Profile
          </button>
        </div>
      </motion.div>
    );
  }

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
        My Profile 👤
      </motion.h2>

      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        style={{
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          borderRadius: '25px',
          padding: '30px',
          textAlign: 'center',
          marginBottom: '30px',
          color: 'white',
          position: 'relative'
        }}
      >
        <motion.div
          whileHover={{ scale: 1.1 }}
          style={{
            position: 'relative',
            display: 'inline-block',
            marginBottom: '15px'
          }}
        >
          <div
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px',
              margin: '0 auto',
              border: '3px solid rgba(255, 255, 255, 0.3)'
            }}
          >
            {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : '👤'}
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            style={{
              position: 'absolute',
              bottom: '5px',
              right: '5px',
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.9)',
              border: 'none',
              color: '#333',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <Camera size={16} />
          </motion.button>
        </motion.div>

        <h3 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>
          {profile.full_name || 'Anonymous User'}
        </h3>
        <p style={{ margin: '0', opacity: 0.9, fontSize: '16px' }}>
          Efes Kebap Customer
        </p>

        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          marginTop: '25px',
          padding: '20px 0',
          borderTop: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
              {stats.totalOrders}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>
              Total Orders
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
              {stats.loyaltyPoints}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>
              Loyalty Points
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
              {profile.created_at ? new Date(profile.created_at).getFullYear() : new Date().getFullYear()}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>
              Member Since
            </div>
          </div>
        </div>
      </motion.div>

      {/* Profile Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        style={{
          background: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '20px',
          padding: '25px',
          marginBottom: '20px',
          boxShadow: '0 5px 20px rgba(0,0,0,0.1)'
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h3 style={{ color: '#333', margin: 0, fontSize: '20px' }}>
            Personal Information
          </h3>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            disabled={saving}
            style={{
              background: isEditing ? '#2ed573' : '#667eea',
              border: 'none',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '15px',
              fontSize: '14px',
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              opacity: saving ? 0.7 : 1
            }}
          >
            {saving ? (
              <>
                <Save size={16} />
                Saving...
              </>
            ) : (
              <>
                <Edit3 size={16} />
                {isEditing ? 'Save' : 'Edit'}
              </>
            )}
          </motion.button>
        </div>

        <div style={{ display: 'grid', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <User size={20} color="#667eea" />
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', color: '#666', display: 'block' }}>
                Full Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.full_name || ''}
                  onChange={(e) => updateProfile('full_name', e.target.value)}
                  placeholder="Enter your full name"
                  style={{
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '16px',
                    width: '100%',
                    marginTop: '2px'
                  }}
                />
              ) : (
                <div style={{ fontSize: '16px', color: '#333', marginTop: '2px' }}>
                  {profile.full_name || 'Not provided'}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <Mail size={20} color="#4ECDC4" />
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', color: '#666', display: 'block' }}>
                Email Address
              </label>
              <div style={{ fontSize: '16px', color: '#333', marginTop: '2px' }}>
                {profile.email}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <Phone size={20} color="#FF6B6B" />
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', color: '#666', display: 'block' }}>
                Phone Number
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={profile.phone || ''}
                  onChange={(e) => updateProfile('phone', e.target.value)}
                  placeholder="Enter your phone number"
                  style={{
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '16px',
                    width: '100%',
                    marginTop: '2px'
                  }}
                />
              ) : (
                <div style={{ fontSize: '16px', color: '#333', marginTop: '2px' }}>
                  {profile.phone || 'Not provided'}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <MapPin size={20} color="#FFEAA7" />
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', color: '#666', display: 'block' }}>
                Default Delivery Address
              </label>
              {isEditing ? (
                <textarea
                  value={profile.default_address || ''}
                  onChange={(e) => updateProfile('default_address', e.target.value)}
                  placeholder="Enter your delivery address"
                  style={{
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '16px',
                    width: '100%',
                    marginTop: '2px',
                    minHeight: '60px',
                    resize: 'vertical'
                  }}
                />
              ) : (
                <div style={{ fontSize: '16px', color: '#333', marginTop: '2px' }}>
                  {profile.default_address || 'Not provided'}
                </div>
              )}
            </div>
          </div>
        </div>

        {isEditing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              display: 'flex',
              gap: '10px',
              marginTop: '20px',
              justifyContent: 'flex-end'
            }}
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsEditing(false)}
              style={{
                background: 'transparent',
                border: '2px solid #ddd',
                color: '#666',
                padding: '10px 20px',
                borderRadius: '15px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              disabled={saving}
              style={{
                background: '#2ed573',
                border: 'none',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '15px',
                fontSize: '14px',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1
              }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </motion.button>
          </motion.div>
        )}
      </motion.div>

      {/* Preferences */}
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
        <h3 style={{ color: '#333', margin: '0 0 20px 0', fontSize: '20px' }}>
          Preferences & Stats
        </h3>

        <div style={{ display: 'grid', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <Heart size={20} color="#FF6B6B" />
            <div>
              <div style={{ fontSize: '16px', color: '#333' }}>Favorite Order</div>
              <div style={{ fontSize: '14px', color: '#666' }}>
                {stats.favoriteOrder}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <Settings size={20} color="#667eea" />
            <div>
              <div style={{ fontSize: '16px', color: '#333' }}>Notifications</div>
              <div style={{ fontSize: '14px', color: '#666' }}>
                {profile.preferences?.notifications ? 'Enabled' : 'Disabled'} • Order updates and promotions
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ProfilePage;
