import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Edit3, Camera, Heart, Settings, Save, LogOut } from 'lucide-react';
import { supabase, UserProfile } from '../lib/supabase';
import { getUserOrders } from '../lib/database';
import { useAuth } from '../contexts/AuthContext';

// Using UserProfile interface from database

const ProfilePage: React.FC = () => {
  const { logout: authLogout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState({
    totalOrders: 0,
    loyaltyPoints: 0,
    favoriteOrder: 'Non disponibile'
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
        : 'Nessun ordine';

      setStats({
        totalOrders: orders.length,
        loyaltyPoints,
        favoriteOrder: favoriteOrder.includes('items') ? 'Ordine misto' : favoriteOrder
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

  const handleLogout = () => {
    if (window.confirm('Sicuro di voler uscire?')) {
      // Use global auth logout which clears everything and dispatches event
      authLogout();

      // Reset local state
      setProfile(null);
      setUserEmail('');
      setLoginEmail('');
    }
  };

  if (loading) {
    return (
      <div className="rashti-page" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-gold" style={{ fontSize: '18px', fontFamily: 'Cinzel' }}>
          Caricamento profilo...
        </motion.div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="rashti-page" style={{ alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rashti-card-light"
          style={{
            padding: '40px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            maxWidth: '350px',
            width: '100%',
            borderRadius: '20px'
          }}
        >
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>👤</div>
          <h2 className="rashti-title" style={{ fontSize: '24px', marginBottom: '10px', color: '#0d3d2e' }}>
            Benvenuto
          </h2>
          <p style={{ color: '#666', fontSize: '16px', marginBottom: '20px', fontFamily: 'Cormorant Garamond' }}>
            Inserisci la tua email per accedere al profilo.
          </p>
          <div style={{ width: '100%' }}>
            <input
              type="email"
              placeholder="latua@email.com"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              className="rashti-input"
              style={{
                background: 'white',
                borderColor: '#e2e8f0',
                color: '#333',
                marginBottom: '15px'
              }}
            />
            <button
              onClick={() => {
                if (loginEmail) {
                  localStorage.setItem('customer_email', loginEmail);
                  loadProfile();
                }
              }}
              className="rashti-btn-primary"
              style={{ width: '100%' }}
            >
              Accedi
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="rashti-page" style={{ overflowY: 'auto' }}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ padding: '20px 0' }}
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
          Il Tuo Profilo
        </motion.h2>

        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          style={{
            background: 'linear-gradient(135deg, #0d3d2e 0%, #1a5c48 100%)',
            borderRadius: '25px',
            padding: '30px',
            textAlign: 'center',
            marginBottom: '30px',
            color: 'var(--persian-gold)',
            position: 'relative',
            margin: '0 20px',
            boxShadow: '0 10px 30px rgba(13, 61, 46, 0.3)',
            border: '1px solid rgba(201, 164, 92, 0.3)'
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
                background: 'rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '40px',
                margin: '0 auto',
                border: '2px solid var(--persian-gold)'
              }}
            >
              {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : '👤'}
            </div>
          </motion.div>

          <h3 className="font-cinzel" style={{ margin: '0 0 5px 0', fontSize: '24px', fontWeight: 700 }}>
            {profile.full_name || 'Utente'}
          </h3>
          <p className="font-garamond" style={{ margin: '0', opacity: 0.9, fontSize: '18px', color: '#e5e7eb' }}>
            Cliente Time Out Pizza
          </p>

          <div style={{
            display: 'flex',
            justifyContent: 'space-around',
            marginTop: '25px',
            padding: '20px 0',
            borderTop: '1px solid rgba(201, 164, 92, 0.3)'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div className="font-cinzel" style={{ fontSize: '24px', fontWeight: 'bold' }}>
                {stats.totalOrders}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8, textTransform: 'uppercase' }}>
                Ordini
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div className="font-cinzel" style={{ fontSize: '24px', fontWeight: 'bold' }}>
                {stats.loyaltyPoints}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8, textTransform: 'uppercase' }}>
                Punti
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div className="font-cinzel" style={{ fontSize: '24px', fontWeight: 'bold' }}>
                {profile.created_at ? new Date(profile.created_at).getFullYear() : new Date().getFullYear()}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8, textTransform: 'uppercase' }}>
                Membro
              </div>
            </div>
          </div>
        </motion.div>

        {/* Profile Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rashti-card-light"
          style={{
            margin: '0 20px 20px 20px',
            padding: '25px',
            borderRadius: '20px'
          }}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h3 style={{ color: '#0d3d2e', margin: 0, fontSize: '20px', fontFamily: 'Cinzel' }}>
              Dati Personali
            </h3>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              disabled={saving}
              className="rashti-chip"
              style={{
                fontSize: '12px',
                padding: '6px 12px',
                background: isEditing ? '#2ed573' : 'transparent',
                color: isEditing ? 'white' : '#0d3d2e',
                border: '1px solid #0d3d2e'
              }}
            >
              {saving ? (
                <>Saving...</>
              ) : (
                <>
                  <Edit3 size={14} style={{ marginRight: '4px' }} />
                  {isEditing ? 'Salva' : 'Modifica'}
                </>
              )}
            </motion.button>
          </div>

          <div style={{ display: 'grid', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <User size={20} color="#c9a45c" />
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: '#666', display: 'block', textTransform: 'uppercase' }}>
                  Nome Completo
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.full_name || ''}
                    onChange={(e) => updateProfile('full_name', e.target.value)}
                    placeholder="Nome e Cognome"
                    className="rashti-input"
                    style={{ background: 'white', borderColor: '#e2e8f0', color: '#333' }}
                  />
                ) : (
                  <div style={{ fontSize: '16px', color: '#333', marginTop: '2px', fontFamily: 'Cormorant Garamond', fontWeight: 600 }}>
                    {profile.full_name || 'Non inserito'}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <Mail size={20} color="#c9a45c" />
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: '#666', display: 'block', textTransform: 'uppercase' }}>
                  Email
                </label>
                <div style={{ fontSize: '16px', color: '#333', marginTop: '2px', fontFamily: 'Cormorant Garamond', fontWeight: 600 }}>
                  {profile.email}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <Phone size={20} color="#c9a45c" />
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: '#666', display: 'block', textTransform: 'uppercase' }}>
                  Telefono
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={profile.phone || ''}
                    onChange={(e) => updateProfile('phone', e.target.value)}
                    placeholder="Numero di telefono"
                    className="rashti-input"
                    style={{ background: 'white', borderColor: '#e2e8f0', color: '#333' }}
                  />
                ) : (
                  <div style={{ fontSize: '16px', color: '#333', marginTop: '2px', fontFamily: 'Cormorant Garamond', fontWeight: 600 }}>
                    {profile.phone || 'Non inserito'}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <MapPin size={20} color="#c9a45c" />
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: '#666', display: 'block', textTransform: 'uppercase' }}>
                  Indirizzo Predefinito
                </label>
                {isEditing ? (
                  <textarea
                    value={profile.default_address || ''}
                    onChange={(e) => updateProfile('default_address', e.target.value)}
                    placeholder="Indirizzo di consegna"
                    className="rashti-input"
                    style={{ background: 'white', borderColor: '#e2e8f0', color: '#333', minHeight: '60px', resize: 'vertical' }}
                  />
                ) : (
                  <div style={{ fontSize: '16px', color: '#333', marginTop: '2px', fontFamily: 'Cormorant Garamond', fontWeight: 600 }}>
                    {profile.default_address || 'Non inserito'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Preferences */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="rashti-card-light"
          style={{
            margin: '0 20px 20px 20px',
            padding: '25px',
            borderRadius: '20px'
          }}
        >
          <h3 style={{ color: '#0d3d2e', margin: '0 0 20px 0', fontSize: '20px', fontFamily: 'Cinzel' }}>
            Preferenze
          </h3>

          <div style={{ display: 'grid', gap: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <Heart size={20} color="#ef4444" />
              <div>
                <div style={{ fontSize: '16px', color: '#333', fontWeight: 600 }}>Ordine Preferito</div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  {stats.favoriteOrder}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <Settings size={20} color="#666" />
              <div>
                <div style={{ fontSize: '16px', color: '#333', fontWeight: 600 }}>Notifiche</div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  {profile.preferences?.notifications ? 'Abilitate' : 'Disabilitate'} • Aggiornamenti ordine
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Logout Button */}
        <div style={{ padding: '0 20px' }}>
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            onClick={handleLogout}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              width: '100%',
              background: 'transparent',
              color: '#ef4444',
              border: '2px solid #ef4444',
              padding: '16px',
              borderRadius: '20px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              fontFamily: 'Cinzel'
            }}
          >
            <LogOut size={20} />
            Esci
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfilePage;
