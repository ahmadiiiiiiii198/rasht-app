import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  Utensils,
  ShoppingCart,
  ClipboardList,
  User,
  Tag,
  Star,
  ArrowLeft
} from 'lucide-react';
import './App.css';
import NotificationListener from './components/NotificationListener';
import BusinessHoursProvider from './contexts/BusinessHoursContext';
import { AuthProvider } from './contexts/AuthContext';
import FCMService from './services/FCMService';


// Page Components
import MenuPage from './pages/MenuPage';
import OrdersPage from './pages/OrdersPage';
import ProfilePage from './pages/ProfilePage';
import OffersPage from './pages/OffersPage';
import LoyaltyPage from './pages/LoyaltyPage';
import BasketballLogo from './components/BasketballLogo';


interface NavButton {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  angle: number;
  component?: React.ComponentType;
}


const navButtons: NavButton[] = [
  {
    id: 'contatti',
    label: 'Contatti',
    icon: <Phone size={24} />,
    color: '#c9a45c', // Persian Gold
    angle: 0,
    component: React.lazy(() => import('./pages/ContattiPage'))
  },
  {
    id: 'menu',
    label: 'Menu',
    icon: <Utensils size={24} />,
    color: '#c9a45c', // Persian Gold
    angle: 51.43,
    component: MenuPage
  },
  {
    id: 'cart',
    label: 'Carrello',
    icon: <ShoppingCart size={24} />,
    color: '#c9a45c', // Persian Gold
    angle: 102.86,
    component: React.lazy(() => import('./pages/CartPage'))
  },
  {
    id: 'orders',
    label: 'Ordini',
    icon: <ClipboardList size={24} />,
    color: '#c9a45c', // Persian Gold
    angle: 154.29,
    component: OrdersPage
  },
  {
    id: 'profile',
    label: 'Profilo',
    icon: <User size={24} />,
    color: '#c9a45c', // Persian Gold
    angle: 205.71,
    component: ProfilePage
  },
  {
    id: 'offers',
    label: 'Offerte',
    icon: <Tag size={24} />,
    color: '#c9a45c', // Persian Gold
    angle: 257.14,
    component: OffersPage
  },
  {
    id: 'loyalty',
    label: 'Fedeltà',
    icon: <Star size={24} />,
    color: '#c9a45c', // Persian Gold
    angle: 308.57,
    component: LoyaltyPage
  }
];

const buttonBaseSize = 80;

function App() {
  const [activeButton, setActiveButton] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [collapsedSize, setCollapsedSize] = useState(200);
  const [expandedWidth, setExpandedWidth] = useState(560);
  const [expandedHeight, setExpandedHeight] = useState(560);
  const [navRadius, setNavRadius] = useState(200);
  const [navButtonSize, setNavButtonSize] = useState(buttonBaseSize);
  const [isMobile, setIsMobile] = useState(false);

  // Initialize FCM for push notifications
  useEffect(() => {
    const initFCM = async () => {
      if (FCMService.isAvailable()) {
        console.log('🔔 Initializing FCM for customer app...');
        await FCMService.initialize();
      }
    };
    initFCM();
  }, []);

  useEffect(() => {
    const computeLayoutValues = () => {
      if (typeof window === 'undefined') {
        setCollapsedSize(200);
        setExpandedWidth(560);
        setExpandedHeight(560);
        setNavRadius(200);
        setNavButtonSize(buttonBaseSize);
        return;
      }

      const { innerWidth: width, innerHeight: height } = window;
      const mobile = width <= 768;
      setIsMobile(mobile);

      // Button sizes
      const buttonSize = width <= 380 ? 55 : width <= 480 ? 65 : mobile ? 75 : 90;
      setNavButtonSize(buttonSize);

      // Margins and Gaps
      const screenMargin = 15; // Minimum distance from button edge to screen edge
      const buttonGap = 20; // Gap between central circle and buttons

      // 1. Calculate the maximum radius allowed for the button CENTERS
      // This is constrained by the screen edges
      const maxRadiusX = (width / 2) - (buttonSize / 2) - screenMargin;
      const maxRadiusY = (height / 2) - (buttonSize / 2) - screenMargin;
      const safeNavRadius = Math.min(maxRadiusX, maxRadiusY);

      // 2. Determine ideal central circle size
      // We want it roughly 350px max dia, or proportional to screen
      const maxCentralDia = Math.min(width * 0.5, 300);
      let targetCentralRadius = maxCentralDia / 2;

      // 3. Check if this target sizing fits within the safeNavRadius with the required gap
      // safeNavRadius = centralRadius + gap + buttonSize/2
      // So: maxAvailableCentralRadius = safeNavRadius - gap - buttonSize/2
      const maxAvailableCentralRadius = safeNavRadius - buttonGap - (buttonSize / 2);

      // 4. Set final central radius, clamped to what's available
      // But ensure it doesn't get ridiculously small (min 60px radius)
      let finalCircleRadius = Math.min(targetCentralRadius, maxAvailableCentralRadius);
      finalCircleRadius = Math.max(finalCircleRadius, 60);

      // 5. Recalculate the Nav Radius based on the constrained central radius
      // We prioritize the gap over the screen margin if we hit the minimum central size
      // (This means buttons might get closer to edge, but won't overlap center)
      let finalNavRadius = finalCircleRadius + buttonGap + (buttonSize / 2);

      setCollapsedSize(finalCircleRadius * 2);
      setNavRadius(finalNavRadius);

      // Expand dimensions
      if (mobile) {
        setExpandedWidth(width);
        setExpandedHeight(height);
      } else {
        setExpandedWidth(Math.min(width - 80, 1200));
        setExpandedHeight(Math.min(height - 80, 900));
      }
    };

    computeLayoutValues();
    window.addEventListener('resize', computeLayoutValues);
    return () => window.removeEventListener('resize', computeLayoutValues);
  }, []);

  const handleRootButtonClick = (buttonId: string) => {
    setActiveButton(buttonId);
    setIsExpanded(true);
  };

  const handleClose = () => {
    setIsExpanded(false);
    setTimeout(() => {
      setActiveButton(null);
    }, 500);
  };

  const handleNavigate = (page: string) => {
    const button = navButtons.find(btn => btn.id === page);
    if (button) {
      setActiveButton(button.id);
      setIsExpanded(true);
    }
  };

  const activeButtonData = navButtons.find(btn => btn.id === activeButton);
  const ActiveComponent = activeButtonData?.component;
  const navContainerSize = `${navRadius * 2 + navButtonSize}px`;

  const showRootNav = !isExpanded;

  return (
    <BusinessHoursProvider>
      <AuthProvider>
        <NotificationListener />
        <div className="app">
          {/* Clean Static Background */}
          <div className="background-static">
            {/* Static Pizza Images - Commented out for full background image
            <img src="/pizza-1.png" alt="" className="bg-pizza pizza-top-left" />
            <img src="/pizza-2.png" alt="" className="bg-pizza pizza-bottom-right" />
            <img src="/pizza-3.png" alt="" className="bg-pizza pizza-bottom-left" />
            */}
          </div>

          {/* Central Circle Container */}
          <motion.div
            className="central-circle"
            initial={{
              width: collapsedSize,
              height: collapsedSize
            }}
            animate={{
              width: isExpanded ? expandedWidth : collapsedSize,
              height: isExpanded ? expandedHeight : collapsedSize,
              borderRadius: isExpanded ? (isMobile ? '0px' : '20px') : '50%'
            }}
            transition={{
              type: "spring",
              stiffness: 350,
              damping: 30,
              mass: 0.8
            }}
          >
            <AnimatePresence mode="wait">
              {!isExpanded && (
                <BasketballLogo className="logo-container" />
              )}
            </AnimatePresence>

            {/* Page Content when expanded */}
            <AnimatePresence>
              {isExpanded && ActiveComponent && (
                <motion.div
                  className={`page-content ${activeButton === 'menu' || activeButton === 'offers' ? 'no-padding' : ''}`}
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0, width: '100%', height: '100%' }} // Added width and height
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  transition={{
                    type: "spring",
                    stiffness: 450,
                    damping: 35,
                    mass: 0.6
                  }}
                >
                  <motion.button
                    className="close-button"
                    onClick={handleClose}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <ArrowLeft size={24} />
                  </motion.button>
                  {activeButton === 'menu' ? (
                    <MenuPage onNavigate={handleNavigate} />
                  ) : activeButton === 'offers' ? (
                    <OffersPage onNavigate={handleNavigate} />
                  ) : activeButton === 'loyalty' ? (
                    <LoyaltyPage onNavigate={handleNavigate} />
                  ) : (
                    <ActiveComponent />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Navigation Buttons */}
          <AnimatePresence>
            {showRootNav && (
              <div className="nav-container" style={{ width: navContainerSize, height: navContainerSize }}>
                {navButtons.map((button, index) => {
                  const angleInRadians = (button.angle - 90) * (Math.PI / 180)
                  const offsetX = Math.cos(angleInRadians) * navRadius
                  const offsetY = Math.sin(angleInRadians) * navRadius

                  const buttonStyle: React.CSSProperties & { '--button-color': string } = {
                    '--button-color': button.color,
                    width: navButtonSize,
                    height: navButtonSize
                  }

                  return (
                    <div
                      key={button.id}
                      className="nav-button-wrapper"
                      style={{
                        transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`
                      }}
                    >
                      <motion.button
                        className={`nav-button nav-button-${index}`}
                        style={{
                          ...buttonStyle,
                          background: `linear-gradient(145deg, #0d3d2e 0%, #082920 100%)`,
                          boxShadow: '0 8px 25px rgba(0,0,0,0.4), 0 0 20px rgba(201, 164, 92, 0.2), inset 0 2px 4px rgba(201, 164, 92, 0.1)',
                          border: '2px solid #c9a45c',
                          borderRadius: '50%',
                          color: '#c9a45c',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative'
                        }}
                        initial={{ opacity: 0, scale: 0.5, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                        transition={{
                          delay: index * 0.05,
                          type: 'spring',
                          stiffness: 400,
                          damping: 25
                        }}
                        whileHover={{
                          scale: 1.15,
                          boxShadow: `0 15px 35px rgba(0,0,0,0.5), 0 0 30px rgba(201, 164, 92, 0.4)`
                        }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleRootButtonClick(button.id)}
                      >
                        <motion.div
                          className="button-content"
                          whileHover={{ rotate: [-2, 2, -2, 0] }}
                          transition={{ duration: 0.4 }}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%',
                            height: '100%',
                            zIndex: 2,
                            gap: '4px'
                          }}
                        >
                          <span style={{ color: '#c9a45c' }}>{button.icon}</span>
                          <span className="button-label" style={{
                            fontSize: '9px',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            color: '#c9a45c',
                            fontFamily: '"Cinzel", "Cormorant Garamond", serif',
                            letterSpacing: '1px',
                            textShadow: '0 1px 3px rgba(0,0,0,0.5)'
                          }}>{button.label}</span>
                        </motion.div>
                      </motion.button>
                    </div>
                  )
                })}
              </div>
            )}
          </AnimatePresence>

        </div>
      </AuthProvider>
    </BusinessHoursProvider >
  );
}



export default App;
