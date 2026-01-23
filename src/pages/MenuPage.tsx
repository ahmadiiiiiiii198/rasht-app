import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ShoppingCart, Star, Flame, Info, Search } from 'lucide-react';
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
const CACHE_VERSION = 3; // Increment to force cache bust

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
        <div key={i} style={{ height: '55vh', padding: '20px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: '#1e293b', borderRadius: '40px', width: '100%', height: '300px', animation: 'pulse 1.5s infinite' }} />
        </div>
      ))}
      <style>{`@keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 0.3; } 100% { opacity: 0.6; } }`}</style>
    </>
  );

  return (
    <div style={{
      height: '100%',
      width: '100%',
      background: '#0f172a',
      position: 'relative',
      fontFamily: '"Inter", sans-serif',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>

      {/* 1. Sticky Header with Search + Categories */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 60,
        padding: '15px 20px 15px 80px',
        background: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.95) 60%, rgba(15, 23, 42, 0))',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>

        {/* Search Bar */}
        <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
          <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search pizza..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '20px',
              padding: '8px 12px 8px 38px',
              color: 'white',
              fontSize: '14px',
              outline: 'none',
              backdropFilter: 'blur(5px)'
            }}
          />
        </div>

        {/* Categories Scroller */}
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '0 0 5px 0', scrollbarWidth: 'none' }}>
          <button
            onClick={() => setActiveCategory('all')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              background: activeCategory === 'all' ? '#ea580c' : 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              color: 'white',
              border: 'none',
              fontWeight: '600',
              fontSize: '13px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              transition: 'background 0.2s ease'
            }}
          >
            All
          </button>

          {loading ? (
            [1, 2, 3].map(k => <div key={k} style={{ height: '28px', width: '70px', background: 'rgba(255,255,255,0.1)', borderRadius: '20px', flexShrink: 0 }} />)
          ) : (
            categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  background: activeCategory === cat.id ? '#ea580c' : 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  color: 'white',
                  border: 'none',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  transition: 'background 0.2s ease'
                }}
              >
                {cat.name}
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
        background: '#1e293b'
      }}>
        <AnimatePresence mode="wait">
          {activeProduct && (
            <motion.div
              key={activeProduct.id}
              initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.5 }}
              style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: '40vh', // Takes up top 60%
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                paddingTop: '80px',
              }}
            >
              <img
                src={getPizzaImage(activeProduct)}
                alt={activeProduct.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0px 20px 40px rgba(0,0,0,0.6))'
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Darkening Gradient at bottom of Hero to blend */}
        <div style={{
          position: 'absolute',
          top: '30vh', left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(180deg, rgba(15,23,42,0) 0%, rgba(15,23,42,1) 60%)'
        }} />
      </div>

      {/* 3. Scrollable Product List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        scrollSnapType: 'y mandatory',
        height: '100%',
        marginTop: '55vh', // Push list down to reveal food
        position: 'relative',
        zIndex: 10,
        background: '#0f172a',
        borderTopLeftRadius: '30px',
        borderTopRightRadius: '30px',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
        paddingTop: '20px'
      }}>
        {loading ? <MenuSkeleton /> : filteredProducts.map((product) => (
          <div
            key={product.id}
            ref={(el) => { productRefs.current[product.id] = el; }}
            data-id={product.id}
            style={{
              height: '35vh', // Reduce height of each card container to fit better on mobile
              scrollSnapAlign: 'start',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10px 20px',
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ amount: 0.2, once: true }}
              transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
              style={{
                background: '#1e293b',
                borderRadius: '30px',
                padding: '20px',
                width: '100%',
                maxWidth: '600px',
                height: '100%',
                boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  background: '#334155', color: '#94a3b8', padding: '4px 10px', borderRadius: '12px',
                  fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px'
                }}>
                  {categories.find(c => c.id === product.category_id)?.name || 'Item'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Star size={14} fill="#fbbf24" color="#fbbf24" />
                  <span style={{ color: 'white', fontWeight: 'bold', fontSize: '13px' }}>4.8</span>
                </div>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {/* Title Line WITH MINI JERSEY */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                  {/* Tiny Jersey Icon */}
                  <div style={{ width: '45px', height: '55px', flexShrink: 0 }}>
                    <JerseyImage
                      src={(product.image_url && product.image_url.startsWith('jersey')) ? product.image_url : ''}
                      text={product.name}
                      alt="Team Jersey"
                      forceGenerator={true} // Force it to generate a jersey even if image is pizza or missing
                    />
                  </div>

                  <h2 style={{ color: 'white', fontSize: '20px', fontWeight: '800', lineHeight: '1.2', textTransform: 'uppercase' }}>
                    {product.name}
                  </h2>
                </div>

                <p style={{
                  color: '#cbd5e1',
                  fontSize: '13px',
                  lineHeight: '1.5',
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical'
                }}>
                  {product.description || "Delicious, fresh ingredients."}
                </p>
              </div>

              <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold' }}>Price</span>
                  <span style={{ color: '#fb923c', fontSize: '26px', fontWeight: '800' }}>
                    €{(typeof product.price === 'string' ? parseFloat(product.price) : (product.price || 0)).toFixed(2)}
                  </span>
                </div>

                <button
                  onClick={() => addToCart(product)}
                  style={{
                    background: '#ea580c', color: 'white', border: 'none', borderRadius: '20px',
                    padding: '0 20px', height: '48px', display: 'flex', alignItems: 'center', gap: '8px',
                    cursor: 'pointer', boxShadow: '0 5px 15px rgba(234, 88, 12, 0.4)'
                  }}
                >
                  <Plus size={20} />
                  <span style={{ fontWeight: 'bold', fontSize: '14px' }}>ADD</span>
                </button>
              </div>
            </motion.div>
          </div>
        ))}

        {/* Spacer */}
        <div style={{ height: '20vh' }} />
      </div>

      {/* Cart Floating Action Button */}
      {getTotalItems() > 0 && (
        <button
          onClick={() => onNavigate?.('cart')}
          style={{
            position: 'fixed', bottom: '20px', left: '20px', background: '#ea580c',
            color: 'white', border: 'none', borderRadius: '50%', width: '60px', height: '60px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 25px rgba(234, 88, 12, 0.5)',
            zIndex: 100, cursor: 'pointer', transition: 'transform 0.15s ease'
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.9)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <div style={{ position: 'relative' }}>
            <ShoppingCart size={24} />
            <span style={{
              position: 'absolute', top: '-8px', right: '-8px', background: 'white', color: '#ea580c',
              fontSize: '12px', fontWeight: 'bold', width: '18px', height: '18px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
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
