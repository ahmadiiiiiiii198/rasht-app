import React from 'react';
import { motion } from 'framer-motion';
import { Clock, MapPin, Phone, Star } from 'lucide-react';

const HomePage: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      style={{ padding: '20px 0', background: '#0f172a', minHeight: '100vh', color: 'white' }}
    >
      <div style={{ textAlign: 'center', marginBottom: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <motion.div
          animate={{
            y: [-10, 10, -10],
            rotate: [-2, 2, -2]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{ marginBottom: '20px' }}
        >
          <img
            src="/basketball-real.png"
            alt="Time Out Pizza Basketball"
            style={{
              width: '240px',
              height: '240px',
              objectFit: 'cover', // cover ensures circle fill
              borderRadius: '50%', // Masks the white background corners
              filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.4))'
            }}
          />
        </motion.div>

        <motion.h1
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          style={{
            fontSize: '32px',
            fontWeight: '900',
            color: '#e2e8f0', // Changing to light hoping for dark theme, 
            // actually I should set the background of this page to dark to match Menu.
            // The user wants "High Graphic".
            marginBottom: '10px',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}
        >
          TIME OUT PIZZA
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{
            fontSize: '16px',
            color: '#94a3b8',
            lineHeight: '1.6',
            maxWidth: '300px'
          }}
        >
          MVP FLAVOR IN EVERY SLICE
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        style={{
          display: 'grid',
          gap: '20px',
          marginBottom: '30px'
        }}
      >
        <motion.div
          whileHover={{ scale: 1.02 }}
          style={{
            background: 'rgba(255, 107, 107, 0.1)',
            padding: '20px',
            borderRadius: '15px',
            border: '1px solid rgba(255, 107, 107, 0.2)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <Clock size={24} color="#FF6B6B" />
            <div>
              <h3 style={{ color: '#333', margin: '0 0 5px 0' }}>Opening Hours</h3>
              <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>
                Mon-Sun: 11:00 AM - 11:00 PM
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          style={{
            background: 'rgba(78, 205, 196, 0.1)',
            padding: '20px',
            borderRadius: '15px',
            border: '1px solid rgba(78, 205, 196, 0.2)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <MapPin size={24} color="#4ECDC4" />
            <div>
              <h3 style={{ color: '#333', margin: '0 0 5px 0' }}>Location</h3>
              <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>
                Via Roma, 10128 Torino TO, Italy
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          style={{
            background: 'rgba(69, 183, 209, 0.1)',
            padding: '20px',
            borderRadius: '15px',
            border: '1px solid rgba(69, 183, 209, 0.2)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <Phone size={24} color="#45B7D1" />
            <div>
              <h3 style={{ color: '#333', margin: '0 0 5px 0' }}>Contact</h3>
              <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>
                +39 02 1234 5678
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        style={{
          background: 'linear-gradient(135deg, #FFE066, #FF6B6B)',
          padding: '25px',
          borderRadius: '20px',
          textAlign: 'center',
          color: 'white'
        }}
      >
        <Star size={32} style={{ marginBottom: '10px' }} />
        <h3 style={{ margin: '0 0 10px 0', fontSize: '20px' }}>Today's Special</h3>
        <p style={{ margin: '0 0 15px 0', fontSize: '16px' }}>
          Try our MVP Specials!
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: '2px solid white',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '25px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Order Now - €15.90
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default HomePage;
