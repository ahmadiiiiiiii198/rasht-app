import React from 'react';
import { motion } from 'framer-motion';
import { Clock, MapPin, Phone, Star } from 'lucide-react';

const HomePage: React.FC = () => {
  return (
    <div className="rashti-page-dark" style={{ overflowY: 'auto' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ padding: '20px', minHeight: '100%' }}
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
                objectFit: 'cover',
                borderRadius: '50%',
                filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.6))',
                border: '4px solid var(--persian-gold)'
              }}
            />
          </motion.div>

          <motion.h1
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="rashti-title"
            style={{
              fontSize: '36px',
              marginBottom: '10px',
              color: 'var(--persian-gold)'
            }}
          >
            TIME OUT PIZZA
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="font-garamond"
            style={{
              fontSize: '18px',
              color: 'rgba(255,255,255,0.7)',
              lineHeight: '1.6',
              maxWidth: '300px',
              letterSpacing: '1px'
            }}
          >
            L'ECCELLENZA IN OGNI FETTA
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
            className="rashti-card"
            style={{
              alignItems: 'center',
              flexDirection: 'row',
              gap: '15px'
            }}
          >
            <Clock size={24} color="#c9a45c" />
            <div>
              <h3 className="font-cinzel" style={{ color: '#c9a45c', margin: '0 0 5px 0' }}>Orari Apertura</h3>
              <p className="font-garamond" style={{ color: '#eee', margin: 0, fontSize: '16px' }}>
                Lun-Dom: 11:00 - 23:00
              </p>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="rashti-card"
            style={{
              alignItems: 'center',
              flexDirection: 'row',
              gap: '15px'
            }}
          >
            <MapPin size={24} color="#c9a45c" />
            <div>
              <h3 className="font-cinzel" style={{ color: '#c9a45c', margin: '0 0 5px 0' }}>Indirizzo</h3>
              <p className="font-garamond" style={{ color: '#eee', margin: 0, fontSize: '16px' }}>
                Via Roma, 10128 Torino TO
              </p>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="rashti-card"
            style={{
              alignItems: 'center',
              flexDirection: 'row',
              gap: '15px'
            }}
          >
            <Phone size={24} color="#c9a45c" />
            <div>
              <h3 className="font-cinzel" style={{ color: '#c9a45c', margin: '0 0 5px 0' }}>Contatti</h3>
              <p className="font-garamond" style={{ color: '#eee', margin: 0, fontSize: '16px' }}>
                +39 02 1234 5678
              </p>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          style={{
            background: 'linear-gradient(135deg, var(--persian-gold), #b89146)',
            padding: '25px',
            borderRadius: '20px',
            textAlign: 'center',
            color: '#0d3d2e',
            boxShadow: '0 10px 30px rgba(201, 164, 92, 0.3)'
          }}
        >
          <Star size={32} style={{ marginBottom: '10px' }} fill="#0d3d2e" />
          <h3 className="font-cinzel" style={{ margin: '0 0 10px 0', fontSize: '24px', fontWeight: '800' }}>Specialità del Giorno</h3>
          <p className="font-garamond" style={{ margin: '0 0 15px 0', fontSize: '18px', fontWeight: '600' }}>
            Prova la nostra pizza MVP Special!
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              background: 'rgba(13, 61, 46, 0.9)',
              border: 'none',
              color: 'var(--persian-gold)',
              padding: '12px 24px',
              borderRadius: '25px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontFamily: 'Cinzel',
              letterSpacing: '1px'
            }}
          >
            Ordina Ora - €15.90
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default HomePage;
