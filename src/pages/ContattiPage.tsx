import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, Star, MessageSquare, Send } from 'lucide-react';
import { supabase, Comment, SiteContent } from '../lib/supabase';

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

// Using Comment interface from database instead of local Review interface

const ContattiPage: React.FC = () => {
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    address: "Via Roma 123, 20100 Milano, Italy",
    phone: "+39 02 1234 5678",
    email: "info@efeskebap.com",
    hours: "Mon-Sun: 11:00 AM - 11:00 PM"
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
      // Try to get contact info from site_content table
      const { data, error } = await supabase
        .from('site_content')
        .select('*')
        .eq('section', 'contact')
        .eq('is_active', true);

      if (data && data.length > 0) {
        const contactData = data[0];
        if (contactData.additional_data) {
          const additionalData = typeof contactData.additional_data === 'string' 
            ? JSON.parse(contactData.additional_data) 
            : contactData.additional_data;
          
          setContactInfo({
            address: additionalData.address || contactInfo.address,
            phone: additionalData.phone || contactInfo.phone,
            email: additionalData.email || contactInfo.email,
            hours: additionalData.hours || contactInfo.hours,
            coordinates: additionalData.coordinates
          });
        }
      } else {
        // Fallback: try content_sections
        const { data: altData } = await supabase
          .from('content_sections')
          .select('*')
          .eq('section', 'contact')
          .eq('is_active', true);

        if (altData && altData.length > 0) {
          const contactData = altData[0];
          const additionalData = typeof contactData.additional_data === 'string'
            ? JSON.parse(contactData.additional_data)
            : contactData.additional_data;

          setContactInfo({
            address: additionalData?.address || contactInfo.address,
            phone: additionalData?.phone || contactInfo.phone,
            email: additionalData?.email || contactInfo.email,
            hours: additionalData?.hours || contactInfo.hours,
            coordinates: additionalData?.coordinates
          });
        }
      }
    } catch (error) {
      console.error('Error loading contact info:', error);
      // Use default values if database fetch fails
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
      alert('Please fill in all fields');
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

      alert('Thank you for your review! It will be published after approval.');
      setNewReview({ name: '', rating: 5, comment: '' });
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={16}
        fill={i < rating ? '#FFD700' : 'none'}
        color={i < rating ? '#FFD700' : '#ddd'}
      />
    ));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

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
        Contact Us 📞
      </motion.h2>

      {/* Contact Information Cards */}
      <div style={{ display: 'grid', gap: '20px', marginBottom: '40px' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            background: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '20px',
            padding: '25px',
            boxShadow: '0 5px 20px rgba(0,0,0,0.1)',
            border: '1px solid rgba(255,255,255,0.3)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
            <div style={{ 
              width: '50px', 
              height: '50px', 
              borderRadius: '12px', 
              background: 'linear-gradient(135deg, #FF6B6B, #ff8e53)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <MapPin size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#333' }}>Address</h3>
              <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#666' }}>
                {contactInfo.address}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            background: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '20px',
            padding: '25px',
            boxShadow: '0 5px 20px rgba(0,0,0,0.1)',
            border: '1px solid rgba(255,255,255,0.3)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ 
              width: '50px', 
              height: '50px', 
              borderRadius: '12px', 
              background: 'linear-gradient(135deg, #4ECDC4, #44A08D)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <Phone size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#333' }}>Phone</h3>
              <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#666' }}>
                <a href={`tel:${contactInfo.phone}`} style={{ color: '#4ECDC4', textDecoration: 'none' }}>
                  {contactInfo.phone}
                </a>
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            background: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '20px',
            padding: '25px',
            boxShadow: '0 5px 20px rgba(0,0,0,0.1)',
            border: '1px solid rgba(255,255,255,0.3)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ 
              width: '50px', 
              height: '50px', 
              borderRadius: '12px', 
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <Mail size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#333' }}>Email</h3>
              <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#666' }}>
                <a href={`mailto:${contactInfo.email}`} style={{ color: '#667eea', textDecoration: 'none' }}>
                  {contactInfo.email}
                </a>
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            background: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '20px',
            padding: '25px',
            boxShadow: '0 5px 20px rgba(0,0,0,0.1)',
            border: '1px solid rgba(255,255,255,0.3)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ 
              width: '50px', 
              height: '50px', 
              borderRadius: '12px', 
              background: 'linear-gradient(135deg, #FFEAA7, #FDCB6E)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <Clock size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#333' }}>Opening Hours</h3>
              <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#666' }}>
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
        style={{ marginBottom: '40px' }}
      >
        <h3 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          color: '#333', 
          textAlign: 'center',
          marginBottom: '25px'
        }}>
          Customer Reviews ⭐
        </h3>

        {loading ? (
          <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
            Loading reviews...
          </div>
        ) : reviews.length > 0 ? (
          <div style={{ display: 'grid', gap: '15px' }}>
            {reviews.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                style={{
                  background: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: '15px',
                  padding: '20px',
                  boxShadow: '0 3px 10px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                  <div>
                    <h4 style={{ margin: '0 0 5px 0', fontSize: '16px', color: '#333' }}>
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
                <p style={{ margin: 0, fontSize: '14px', color: '#666', lineHeight: '1.5' }}>
                  {review.comment_text}
                </p>
              </motion.div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
            No reviews yet. Be the first to leave a review!
          </div>
        )}
      </motion.div>

      {/* Leave a Review Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        style={{
          background: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '20px',
          padding: '25px',
          boxShadow: '0 5px 20px rgba(0,0,0,0.1)',
          border: '1px solid rgba(255,255,255,0.3)'
        }}
      >
        <h3 style={{ 
          fontSize: '20px', 
          fontWeight: 'bold', 
          color: '#333', 
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <MessageSquare size={24} />
          Leave a Review
        </h3>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: '#666', fontSize: '14px' }}>
            Your Name
          </label>
          <input
            type="text"
            value={newReview.name}
            onChange={(e) => setNewReview(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter your name"
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              fontSize: '16px'
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontSize: '14px' }}>
            Rating
          </label>
          <div style={{ display: 'flex', gap: '5px' }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={24}
                fill={star <= newReview.rating ? '#FFD700' : 'none'}
                color={star <= newReview.rating ? '#FFD700' : '#ddd'}
                style={{ cursor: 'pointer' }}
                onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
              />
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: '#666', fontSize: '14px' }}>
            Your Review
          </label>
          <textarea
            value={newReview.comment}
            onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
            placeholder="Tell us about your experience..."
            rows={4}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              fontSize: '16px',
              resize: 'vertical'
            }}
          />
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={submitReview}
          disabled={submitting}
          style={{
            width: '100%',
            padding: '15px',
            borderRadius: '12px',
            border: 'none',
            background: submitting 
              ? '#ccc' 
              : 'linear-gradient(135deg, #667eea, #764ba2)',
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: submitting ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          {submitting ? (
            <>
              <Clock size={18} />
              Submitting...
            </>
          ) : (
            <>
              <Send size={18} />
              Submit Review
            </>
          )}
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default ContattiPage;
