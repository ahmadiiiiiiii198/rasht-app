import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Menu,
  ShoppingCart,
  User,
  Gift,
  Star,
  ArrowLeft
} from 'lucide-react';
import './App.css';

// Page Components
import MenuPage from './pages/MenuPage';
import OrdersPage from './pages/OrdersPage';
import ProfilePage from './pages/ProfilePage';
import OffersPage from './pages/OffersPage';
import LoyaltyPage from './pages/LoyaltyPage';

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
    icon: <Home size={24} />,
    color: '#d4af37',
    angle: 0,
    component: React.lazy(() => import('./pages/ContattiPage'))
  },
  {
    id: 'menu',
    label: 'Menu',
    icon: <Menu size={24} />,
    color: '#d4af37',
    angle: 51.43,
    component: MenuPage
  },
  {
    id: 'cart',
    label: 'Cart',
    icon: <ShoppingCart size={24} />,
    color: '#d4af37',
    angle: 102.86,
    component: React.lazy(() => import('./pages/CartPage'))
  },
  {
    id: 'orders',
    label: 'Orders',
    icon: <User size={24} />,
    color: '#d4af37',
    angle: 154.29,
    component: OrdersPage
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: <User size={24} />,
    color: '#d4af37',
    angle: 205.71,
    component: ProfilePage
  },
  {
    id: 'offers',
    label: 'Offers',
    icon: <Gift size={24} />,
    color: '#d4af37',
    angle: 257.14,
    component: OffersPage
  },
  {
    id: 'loyalty',
    label: 'Loyalty',
    icon: <Star size={24} />,
    color: '#d4af37',
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

      const buttonSize = width <= 400 ? 58 : mobile ? 68 : buttonBaseSize;
      setNavButtonSize(buttonSize);

      const minCircleRadius = buttonSize; // keep centre content reasonable
      const maxInitialCircle = Math.min(width - 60, 350) / 2;
      const baseCircleRadius = Math.max(minCircleRadius, maxInitialCircle);

      const minGap = width <= 400 ? 8 : mobile ? 10 : 12;

      const maxRadiusX = (width - buttonSize - 20) / 2;
      const maxRadiusY = (height - buttonSize - 20) / 2;
      const maxAvailableRadius = Math.max(buttonSize / 2 + minGap, Math.min(maxRadiusX, maxRadiusY));

      const maxCircleRadius = Math.max(buttonSize * 0.5, maxAvailableRadius - (buttonSize / 2 + minGap));
      const finalCircleRadius = Math.max(buttonSize * 1.2, Math.min(baseCircleRadius, maxCircleRadius));

      setCollapsedSize(finalCircleRadius * 2);

      const finalRadius = finalCircleRadius + buttonSize / 2 + minGap;
      setNavRadius(finalRadius);

      // On mobile, expand to fill the entire screen
      if (mobile) {
        setExpandedWidth(width);
        setExpandedHeight(height);
      } else {
        // Desktop: Card style
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
    <div className="app">
      {/* Background with animated gradient */}
      <motion.div
        className="background"
        animate={{
          background: isExpanded
            ? `linear-gradient(135deg, ${activeButtonData?.color}20, ${activeButtonData?.color}10)`
            : 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 50%, #d4af37 100%)'
        }}
        transition={{ duration: 0.8 }}
      />

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
          stiffness: 100,
          damping: 20,
          duration: 0.8
        }}
      >
        <AnimatePresence mode="wait">
          {!isExpanded && (
            <motion.div
              key="logo"
              className="logo-container"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.4 }}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                backgroundImage: 'url(/logo.jpg)',
                backgroundSize: '65%',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            />
          )}
        </AnimatePresence>

        {/* Page Content when expanded */}
        <AnimatePresence>
          {isExpanded && ActiveComponent && (
            <motion.div
              className="page-content"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1, width: '100%', height: '100%' }} // Added width and height
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: 0.3, duration: 0.5 }}
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
                    style={buttonStyle}
                    initial={{
                      opacity: 0,
                      scale: 0
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1
                    }}
                    exit={{
                      opacity: 0,
                      scale: 0
                    }}
                    transition={{
                      delay: index * 0.1,
                      type: 'spring',
                      stiffness: 200,
                      damping: 15
                    }}
                    whileHover={{
                      scale: 1.2,
                      boxShadow: `0 10px 30px ${button.color}40`
                    }}
                    whileTap={{
                      scale: 0.9
                    }}
                    onClick={() => handleRootButtonClick(button.id)}
                  >
                    <motion.div
                      className="button-content"
                      whileHover={{ rotate: -10 }}
                    >
                      {button.icon}
                      <span className="button-label">{button.label}</span>
                    </motion.div>
                  </motion.button>
                </div>
              )
            })}
          </div>
        )}
      </AnimatePresence>

      {/* Floating particles animation */}
      <div className="particles">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="particle"
            animate={{
              y: [0, -100, 0],
              x: [0, Math.random() * 100 - 50, 0],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2
            }}
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default App;
