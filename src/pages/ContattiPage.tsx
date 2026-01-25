import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, Star, MessageSquare, Send } from 'lucide-react';
import { supabase, Comment } from '../lib/supabase';

interface ContactInfo {
  address: string;
  phone: string;
  email: string;
  hours: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

const ContattiPage: React.FC = () => {
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    address: "Via Roma, 10128 Torino TO, Italy",
    phone: "+39 02 1234 5678",
    email: "info@timeoutpizza.com",
    hours: "Lun-Dom: 11:00 - 23:00"
  });
  const [reviews, setReviews] = useState<Comment[]>([]);
  const [newReview, setNewReview] = useState({
    name: '',
    rating: 5,
    comment: ''
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadContactInfo();
    loadReviews();
  }, []);

  const loadContactInfo = async () => {
    try {
      const { data: settingsData } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'contact_info')
        .single();

      if (settingsData?.value) {
        const info = typeof settingsData.value === 'string'
          ? JSON.parse(settingsData.value)
          : settingsData.value;

        setContactInfo({
          address: info.address || contactInfo.address,
          phone: info.phone || contactInfo.phone,
          email: info.email || contactInfo.email,
          hours: info.hours || contactInfo.hours,
          coordinates: info.coordinates
        });
      }
    } catch (error) {
      console.error('Error loading contact info:', error);
    }
  };

  const loadReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('is_approved', true)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (data) {
        setReviews(data);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async () => {
    if (!newReview.name.trim() || !newReview.comment.trim()) {
      alert('Compila tutti i campi');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          customer_name: newReview.name,
          rating: newReview.rating,
          comment_text: newReview.comment,
          is_approved: false, // Will need admin approval
          is_active: true
        });

      if (error) throw error;

      alert('Grazie per la tua recensione! Sarà pubblicata dopo approvazione.');
      setNewReview({ name: '', rating: 5, comment: '' });
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Errore nell\'invio. Riprova.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={16}
        fill={i < rating ? '#c9a45c' : 'none'}
        color={i < rating ? '#c9a45c' : '#ddd'}
      />
    ));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

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
          Contatti
        </motion.h2>

        {/* Contact Information Cards */}
        <div style={{ display: 'grid', gap: '20px', marginBottom: '40px', padding: '0 20px' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rashti-card-light"
            style={{ borderRadius: '20px', padding: '20px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{
                width: '50px', height: '50px', borderRadius: '12px',
                background: '#fffef0', border: '1px solid #c9a45c',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c9a45c'
              }}>
                <MapPin size={24} />
              </div>
              <div>
                <h3 className="font-cinzel" style={{ margin: 0, fontSize: '18px', color: '#0d3d2e' }}>Indirizzo</h3>
                <p className="font-garamond" style={{ margin: '5px 0 0 0', fontSize: '16px', color: '#666', fontWeight: 600 }}>
                  {contactInfo.address}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rashti-card-light"
            style={{ borderRadius: '20px', padding: '20px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{
                width: '50px', height: '50px', borderRadius: '12px',
                background: '#fffef0', border: '1px solid #c9a45c',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c9a45c'
              }}>
                <Phone size={24} />
              </div>
              <div>
                <h3 className="font-cinzel" style={{ margin: 0, fontSize: '18px', color: '#0d3d2e' }}>Telefono</h3>
                <p className="font-garamond" style={{ margin: '5px 0 0 0', fontSize: '16px', color: '#666', fontWeight: 600 }}>
                  <a href={`tel:${contactInfo.phone}`} style={{ color: '#0d3d2e', textDecoration: 'none' }}>{contactInfo.phone}</a>
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rashti-card-light"
            style={{ borderRadius: '20px', padding: '20px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{
                width: '50px', height: '50px', borderRadius: '12px',
                background: '#fffef0', border: '1px solid #c9a45c',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c9a45c'
              }}>
                <Mail size={24} />
              </div>
              <div>
                <h3 className="font-cinzel" style={{ margin: 0, fontSize: '18px', color: '#0d3d2e' }}>Email</h3>
                <p className="font-garamond" style={{ margin: '5px 0 0 0', fontSize: '16px', color: '#666', fontWeight: 600 }}>
                  <a href={`mailto:${contactInfo.email}`} style={{ color: '#0d3d2e', textDecoration: 'none' }}>{contactInfo.email}</a>
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rashti-card-light"
            style={{ borderRadius: '20px', padding: '20px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{
                width: '50px', height: '50px', borderRadius: '12px',
                background: '#fffef0', border: '1px solid #c9a45c',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c9a45c'
              }}>
                <Clock size={24} />
              </div>
              <div>
                <h3 className="font-cinzel" style={{ margin: 0, fontSize: '18px', color: '#0d3d2e' }}>Orari</h3>
                <p className="font-garamond" style={{ margin: '5px 0 0 0', fontSize: '16px', color: '#666', fontWeight: 600 }}>
                  {contactInfo.hours}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Reviews Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{ marginBottom: '40px', padding: '0 20px' }}
        >
          <h3 className="rashti-title" style={{ fontSize: '24px', textAlign: 'center', marginBottom: '25px', color: '#0d3d2e' }}>
            Recensioni ⭐
          </h3>

          {loading ? (
            <div style={{ textAlign: 'center', color: '#666', padding: '20px', fontFamily: 'Cormorant Garamond' }}>
              Caricamento recensioni...
            </div>
          ) : reviews.length > 0 ? (
            <div style={{ display: 'grid', gap: '15px' }}>
              {reviews.map((review, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="rashti-card-light"
                  style={{ borderRadius: '15px', padding: '20px' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                    <div>
                      <h4 className="font-cinzel" style={{ margin: '0 0 5px 0', fontSize: '16px', color: '#0d3d2e', fontWeight: 700 }}>
                        {review.customer_name}
                      </h4>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {renderStars(review.rating || 0)}
                      </div>
                    </div>
                    <span style={{ fontSize: '12px', color: '#999' }}>
                      {formatDate(review.created_at)}
                    </span>
                  </div>
                  <p className="font-garamond" style={{ margin: 0, fontSize: '16px', color: '#666', lineHeight: '1.5' }}>
                    {review.comment_text}
                  </p>
                </motion.div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#666', padding: '20px', fontFamily: 'Cormorant Garamond' }}>
              Nessuna recensione. Scrivine una tu!
            </div>
          )}
        </motion.div>

        {/* Leave a Review Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="rashti-card-light"
          style={{ margin: '0 20px 20px 20px', padding: '25px', borderRadius: '20px' }}
        >
          <h3 className="font-cinzel" style={{ fontSize: '20px', color: '#0d3d2e', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MessageSquare size={24} color="#c9a45c" />
            Lascia una Recensione
          </h3>

          <div style={{ marginBottom: '15px' }}>
            <input
              type="text"
              value={newReview.name}
              onChange={(e) => setNewReview(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Il tuo nome"
              className="rashti-input"
              style={{ background: 'white', borderColor: '#e2e8f0', color: '#333' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label className="font-garamond" style={{ display: 'block', marginBottom: '8px', color: '#666', fontSize: '16px' }}>Voto</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={28}
                  fill={star <= newReview.rating ? '#c9a45c' : 'none'}
                  color={star <= newReview.rating ? '#c9a45c' : '#ddd'}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                />
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <textarea
              value={newReview.comment}
              onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
              placeholder="Raccontaci la tua esperienza..."
              rows={4}
              className="rashti-input"
              style={{ background: 'white', borderColor: '#e2e8f0', color: '#333', resize: 'vertical' }}
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={submitReview}
            disabled={submitting}
            className="rashti-btn-primary"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {submitting ? (
              <>
                <Clock size={18} />
                Invio in corso...
              </>
            ) : (
              <>
                <Send size={18} />
                Invia Recensione
              </>
            )}
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ContattiPage;
