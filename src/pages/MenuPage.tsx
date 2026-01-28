import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ShoppingCart, Star, Search, Clock, AlertCircle } from 'lucide-react';
import { getProducts, getCategories, Product, Category } from '../lib/database';
import JerseyImage from '../components/JerseyImage';

interface MenuPageProps {
  onNavigate?: (page: string) => void;
}

// Simple cache for products and categories - RESET for new images
let cachedProducts: Product[] | null = null;
let cachedCategories: Category[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 0; // Disabled cache to force fresh data
// const CACHE_VERSION = 3; 

// Helper to get Pizza Image based on keywords
const getPizzaImage = (product: Product): string => {
  const name = product.name.toUpperCase();
  const desc = (product.description || '').toLowerCase();

  // 1. SPECIFIC PLAYER/SIGNATURE PIZZAS
  if (name.includes('LEBRON')) return '/pizza-pistachio-mortadella.png'; // Pistachio/Mortadella match
  if (name.includes('JORDAN') || name.includes('KOBE') || name.includes('IVERSON') || name.includes('DUNCAN')) return '/pizza-meat-truffle.png'; // Robust/Meat
  if (name.includes('ROSE') || name.includes('GINOBILI') || name.includes('TATUM') || name.includes('DONCIC')) return '/pizza-white-potato.png'; // White/Cheese/Potato
  if (name.includes('WESTBROOK') || name.includes('IRVING') || name.includes('CURRY') || name.includes('LILLARD') || name.includes('HARDEN')) return '/pizza-spicy-salami.png'; // Spicy/Red
  if (name.includes('DURANT') || name.includes('GARNETT') || name.includes('JOKIC') || name.includes('GASOL')) return '/pizza-veggie-grilled.png'; // Veggie/Balanced

  // 2. INGREDIENT BASED FALLBACKS
  if (desc.includes('pistacchio') || desc.includes('mortadella')) return '/pizza-pistachio-mortadella.png';
  if (desc.includes('tartufo') || desc.includes('salsiccia') || desc.includes('porcini')) return '/pizza-meat-truffle.png';
  if (desc.includes('patate') || desc.includes('gorgonzola') || desc.includes('brie') || !desc.includes('pomodoro')) return '/pizza-white-potato.png';
  if (desc.includes('spianata') || desc.includes('piccante') || desc.includes('salami') || desc.includes('pepperoni')) return '/pizza-spicy-salami.png';
  if (desc.includes('zucchine') || desc.includes('melanzane') || desc.includes('peperoni') || desc.includes('verdure')) return '/pizza-veggie-grilled.png';

  // 3. GENERIC FALLBACKS
  if (name.includes('MARGHERITA') || name.includes('CLASSIC')) return '/pizza-margherita-hero.png';

  // Default
  return '/pizza-margherita-hero.png';
};


const MenuPage: React.FC<MenuPageProps> = ({ onNavigate }) => {
  // Data State
  const [products, setProducts] = useState<Product[]>(cachedProducts || []);
  const [categories, setCategories] = useState<Category[]>(cachedCategories || []);
  const [loading, setLoading] = useState(!cachedProducts);

  // UI State
  const [activeCategory, setActiveCategory] = useState<string>('all');
  // Track FULL product to get Name + Image
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [searchQuery, setSearchQuery] = useState('');

  const observerRef = useRef<IntersectionObserver | null>(null);
  const productRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Load Data (with caching)
  useEffect(() => {
    const loadData = async () => {
      const now = Date.now();

      // Use cache if valid
      if (cachedProducts && cachedCategories && (now - cacheTimestamp) < CACHE_DURATION) {
        setProducts(cachedProducts);
        setCategories(cachedCategories);
        setLoading(false);
        if (cachedProducts.length > 0) {
          setActiveProduct(cachedProducts[0]);
        }
        return;
      }

      setLoading(true);
      try {
        const [productsData, categoriesData] = await Promise.all([
          getProducts(),
          getCategories()
        ]);

        // Update cache
        cachedProducts = productsData;
        cachedCategories = categoriesData;
        cacheTimestamp = now;

        setProducts(productsData);
        setCategories(categoriesData);
        if (productsData.length > 0) {
          setActiveProduct(productsData[0]);
        }
      } catch (error) {
        console.error('Error loading menu data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();

    // Load initial cart
    const savedCart = localStorage.getItem('timeoutpizza_cart');
    if (savedCart) {
      try {
        const cartItems = JSON.parse(savedCart);
        const cartMap: { [key: string]: number } = {};
        cartItems.forEach((item: any) => {
          cartMap[item.id] = (cartMap[item.id] || 0) + item.quantity;
        });
        setCart(cartMap);
      } catch (e) {
        console.error("Error parsing cart", e);
      }
    }
  }, []);

  // Scroll Observer Logic
  useEffect(() => {
    if (loading || products.length === 0) return;

    const options = {
      root: null,
      rootMargin: '-50% 0px 0px 0px', // Center trigger
      threshold: 0.1
    };

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const productId = entry.target.getAttribute('data-id');
          const product = products.find(p => p.id === productId);
          if (product) {
            setActiveProduct(product);
          }
        }
      });
    }, options);

    Object.values(productRefs.current).forEach((el) => {
      if (el) observerRef.current?.observe(el);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [loading, products, activeCategory]);

  // Cart Logic
  const addToCart = (product: Product, qty: number = 1) => {
    setCart(prev => ({
      ...prev,
      [product.id]: (prev[product.id] || 0) + qty
    }));

    const savedCart = localStorage.getItem('timeoutpizza_cart');
    let cartItems: any[] = savedCart ? JSON.parse(savedCart) : [];

    const existingItem = cartItems.find((item: any) => item.id === product.id);
    if (existingItem) {
      existingItem.quantity += qty;
    } else {
      cartItems.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: qty,
        image_url: product.image_url
      });
    }
    localStorage.setItem('timeoutpizza_cart', JSON.stringify(cartItems));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Filter by Search Query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query))
      );
    }

    // Filter by Category
    if (activeCategory !== 'all') {
      filtered = filtered.filter(p => p.category_id === activeCategory);
    }

    return filtered;
  }, [products, activeCategory, searchQuery]);

  const getTotalItems = () => Object.values(cart).reduce((a, b) => a + b, 0);

  // SKELETON COMPONENT
  const MenuSkeleton = () => (
    <>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ height: '55vh', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="rashti-card" style={{ width: '100%', height: '300px', opacity: 0.5 }} />
        </div>
      ))}
    </>
  );

  return (
    <div className="rashti-page-dark">

      {/* 1. Sticky Header with Search + Categories */}
      <div className="rashti-header-container" style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingTop: 'calc(60px + env(safe-area-inset-top))', // Clear height for Back Button + Status Bar
        paddingLeft: '80px', // Clear width for Back Button
        paddingRight: '20px',
        paddingBottom: '20px',
        boxSizing: 'border-box'
      }}>

        {/* Search Bar */}
        <div style={{ position: 'relative', width: '100%' }}>
          <Search size={18} className="text-gold" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search pizza..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rashti-input"
            style={{ paddingLeft: '38px' }}
          />
        </div>

        {/* Categories Scroller */}
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '0 0 5px 0', scrollbarWidth: 'none' }}>
          <button
            onClick={() => setActiveCategory('all')}
            className={`rashti-chip ${activeCategory === 'all' ? 'active' : ''}`}
          >
            All
          </button>

          {loading ? (
            [1, 2, 3].map(k => <div key={k} className="rashti-chip" style={{ width: '70px', height: '28px', opacity: 0.5 }} />)
          ) : (
            categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)} // Allow selection even if coming soon
                className={`rashti-chip ${activeCategory === cat.id ? 'active' : ''} ${cat.coming_soon ? 'coming-soon' : ''}`}
                style={cat.coming_soon ? { border: '1px solid rgba(234, 179, 8, 0.5)', color: '#fbbf24' } : {}}
              >
                {cat.coming_soon && <Clock size={12} style={{ marginRight: 6 }} />}
                {cat.name}
                {cat.coming_soon && <span style={{ fontSize: '0.6em', marginLeft: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Coming Soon</span>}
              </button>
            ))
          )}
        </div>
      </div>

      {/* 2. Hero Section - Full Background, Fixed - NOW SHOWING FOOD */}
      <div style={{
        position: 'fixed', // Fixed so it stays while list scrolls (parallax-ish)
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
        pointerEvents: 'none',
        // Slight gradient to make text legible if pizza is light
        background: 'radial-gradient(circle at center, transparent 0%, rgba(13, 61, 46, 0.4) 100%)'
      }}>
        <AnimatePresence mode="wait">
          {activeProduct && (
            <motion.div
              key={activeProduct.id}
              initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.6, type: "spring" }}
              style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: '30vh', // Takes up top 70%
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                paddingTop: '110px', // Adjusted to reduce empty space at top
              }}
            >
              <img
                src={getPizzaImage(activeProduct)}
                alt={activeProduct.name}
                style={{
                  width: '90%',
                  height: '90%',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0px 20px 50px rgba(0,0,0,0.6))'
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Darkening Gradient at bottom of Hero to blend */}
        <div style={{
          position: 'absolute',
          top: '30vh', left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(180deg, rgba(8, 41, 32, 0) 0%, rgba(8, 41, 32, 1) 60%)'
        }} />
      </div>

      {/* 3. Scrollable Product List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        scrollSnapType: 'y mandatory',
        height: '100%',
        marginTop: '38vh', // Reduced significantly to minimize gap
        position: 'relative',
        zIndex: 10,
        background: 'linear-gradient(180deg, rgba(8, 41, 32, 0.95) 0%, #051a14 100%)',
        borderTopLeftRadius: '30px',
        borderTopRightRadius: '30px',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
        paddingTop: '15px',
        backdropFilter: 'blur(10px)'
      }}>
        {/* Category Description Banner */}
        {!loading && activeCategory !== 'all' && categories.find(c => c.id === activeCategory)?.description && (
          <div style={{
            padding: '16px',
            marginBottom: '20px',
            background: 'rgba(234, 179, 8, 0.15)',
            border: '2px solid rgba(234, 179, 8, 0.4)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <AlertCircle color="#fbbf24" size={24} />
            <p style={{ color: '#fbbf24', margin: 0, fontSize: '15px', textAlign: 'center', fontWeight: 'bold', fontFamily: 'Cinzel', letterSpacing: '0.5px' }}>
              {categories.find(c => c.id === activeCategory)?.description}
            </p>
          </div>
        )}

        {loading ? <MenuSkeleton /> : filteredProducts.map((product) => {
          const productCategory = categories.find(c => c.id === product.category_id);
          const isComingSoon = product.coming_soon || productCategory?.coming_soon;

          return (
            <div
              key={product.id}
              ref={(el) => { productRefs.current[product.id] = el; }}
              data-id={product.id}
              style={{
                minHeight: '280px', // Fixed minimum height instead of viewport height
                maxHeight: '320px',
                scrollSnapAlign: 'start',
                display: 'flex',
                alignItems: 'stretch',
                justifyContent: 'center',
                padding: '8px 16px',
                marginBottom: '12px',
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ amount: 0.2, once: true }}
                transition={{ type: 'tween', duration: 0.2, ease: 'easeOut' }}
                className="rashti-card"
                style={{
                  width: '100%',
                  maxWidth: '600px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '16px',
                  opacity: isComingSoon ? 0.8 : 1,
                  background: 'linear-gradient(145deg, rgba(8, 41, 32, 0.6) 0%, rgba(5, 26, 20, 0.8) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
                }}
              >
                {/* Header: Chip + Rating */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span className="rashti-chip active" style={{
                    fontSize: '10px',
                    padding: '4px 10px',
                    background: isComingSoon ? '#fbbf24' : 'var(--persian-gold)',
                    color: 'var(--persian-emerald-dark)',
                    letterSpacing: '0.5px',
                    fontWeight: 800
                  }}>
                    {isComingSoon ? 'COMING SOON' : (productCategory?.name?.toUpperCase() || 'ITEM')}
                  </span>
                  {!isComingSoon && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', background: 'rgba(0,0,0,0.2)', padding: '3px 6px', borderRadius: '10px' }}>
                      <Star size={10} fill="#c9a45c" color="#c9a45c" />
                      <span className="text-gold" style={{ fontWeight: 'bold', fontSize: '11px' }}>4.8</span>
                    </div>
                  )}
                </div>

                {/* Content: Title, Jersey, Desc */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Jersey Icon - Compact */}
                    <div style={{ width: '40px', height: '48px', flexShrink: 0, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
                      <JerseyImage
                        src={(product.image_url && product.image_url.startsWith('jersey')) ? product.image_url : ''}
                        text={product.name}
                        alt="Team Jersey"
                        forceGenerator={true}
                      />
                    </div>

                    <h2 className="rashti-title" style={{
                      fontSize: '18px',
                      lineHeight: '1.15',
                      borderBottom: 'none',
                      margin: 0,
                      textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                    }}>
                      {product.name}
                    </h2>
                  </div>

                  <p style={{
                    color: 'rgba(255, 255, 255, 0.75)',
                    fontSize: '13px',
                    lineHeight: '1.4',
                    fontFamily: 'Cormorant Garamond',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    margin: 0
                  }}>
                    {product.description || "Delicious, fresh ingredients prepared in the traditional Rashti style."}
                  </p>
                </div>

                {/* Footer: Price + Add Button */}
                <div style={{ marginTop: '10px', paddingTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span className="text-gold" style={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: 'bold', opacity: 0.6, letterSpacing: '0.5px' }}>Prezzo</span>
                    <span className="text-gold" style={{ fontSize: '22px', fontWeight: '800', fontFamily: 'Cinzel', lineHeight: '1' }}>
                      €{(typeof product.price === 'string' ? parseFloat(product.price) : (product.price || 0)).toFixed(2)}
                    </span>
                  </div>

                  <button
                    onClick={() => !isComingSoon && addToCart(product)}
                    disabled={!!isComingSoon}
                    className={isComingSoon ? "rashti-btn-disabled" : "rashti-btn-primary"}
                    style={isComingSoon ? {
                      background: 'rgba(255,255,255,0.05)',
                      color: '#6b7280',
                      cursor: 'not-allowed',
                      border: '1px solid rgba(255,255,255,0.1)',
                      padding: '10px 18px',
                      borderRadius: '12px',
                      fontWeight: 'bold',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    } : {
                      padding: '10px 20px',
                      fontSize: '13px',
                      boxShadow: '0 4px 12px rgba(201, 164, 92, 0.3)'
                    }}
                  >
                    {isComingSoon ? (
                      <>
                        <Clock size={16} />
                        <span style={{ fontWeight: 'bold', letterSpacing: '0.5px' }}>SOON</span>
                      </>
                    ) : (
                      <>
                        <Plus size={18} />
                        <span style={{ fontWeight: 'bold', letterSpacing: '0.5px' }}>AGGIUNGI</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })}

        {/* Spacer */}
        <div style={{ height: '20vh' }} />
      </div>

      {/* Cart Floating Action Button */}
      {getTotalItems() > 0 && (
        <button
          onClick={() => onNavigate?.('cart')}
          className="rashti-btn-icon"
          style={{
            position: 'fixed', bottom: '20px', left: '20px',
            width: '60px', height: '60px',
            zIndex: 100
          }}
        >
          <div style={{ position: 'relative' }}>
            <ShoppingCart size={24} color="#082920" />
            <span style={{
              position: 'absolute', top: '-8px', right: '-8px', background: '#082920', color: '#c9a45c',
              fontSize: '12px', fontWeight: 'bold', width: '20px', height: '20px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #c9a45c'
            }}>
              {getTotalItems()}
            </span>
          </div>
        </button>
      )}
    </div>
  );
};

export default MenuPage;
