import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ShoppingCart, Star, Search, Clock, ChevronDown } from 'lucide-react';
import { getProducts, getCategories, Product, Category } from '../lib/database';
import JerseyImage from '../components/JerseyImage';

// --- TYPES ---
interface MenuPageProps {
  onNavigate?: (page: string) => void;
}

// --- ASSET HELPER ---
const getPizzaImage = (product: Product): string => {
  const name = product.name.toUpperCase();
  const desc = (product.description || '').toLowerCase();

  if (name.includes('LEBRON')) return '/pizza-pistachio-mortadella.png';
  if (name.includes('JORDAN') || name.includes('KOBE') || name.includes('IVERSON') || name.includes('DUNCAN')) return '/pizza-meat-truffle.png';
  if (name.includes('ROSE') || name.includes('GINOBILI') || name.includes('TATUM') || name.includes('DONCIC')) return '/pizza-white-potato.png';
  if (name.includes('WESTBROOK') || name.includes('IRVING') || name.includes('CURRY') || name.includes('LILLARD') || name.includes('HARDEN')) return '/pizza-spicy-salami.png';
  if (name.includes('DURANT') || name.includes('GARNETT') || name.includes('JOKIC') || name.includes('GASOL')) return '/pizza-veggie-grilled.png';

  if (desc.includes('pistacchio') || desc.includes('mortadella')) return '/pizza-pistachio-mortadella.png';
  if (desc.includes('tartufo') || desc.includes('salsiccia') || desc.includes('porcini')) return '/pizza-meat-truffle.png';
  if (desc.includes('patate') || desc.includes('gorgonzola') || desc.includes('brie') || !desc.includes('pomodoro')) return '/pizza-white-potato.png';
  if (desc.includes('spianata') || desc.includes('piccante') || desc.includes('salami') || desc.includes('pepperoni')) return '/pizza-spicy-salami.png';
  if (desc.includes('zucchine') || desc.includes('melanzane') || desc.includes('peperoni') || desc.includes('verdure')) return '/pizza-veggie-grilled.png';

  return '/pizza-margherita-hero.png';
};

// --- CACHE ---
let cachedProducts: Product[] | null = null;
let cachedCategories: Category[] | null = null;

const MenuPage: React.FC<MenuPageProps> = ({ onNavigate }) => {
  // --- STATE ---
  const [products, setProducts] = useState<Product[]>(cachedProducts || []);
  const [categories, setCategories] = useState<Category[]>(cachedCategories || []);
  const [loading, setLoading] = useState(!cachedProducts);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<{ [key: string]: number }>({});

  // Ref for scroll container to reset scroll on category change
  const containerRef = useRef<HTMLDivElement>(null);

  // --- DATA LOADING ---
  useEffect(() => {
    const loadData = async () => {
      if (cachedProducts && cachedCategories) {
        setProducts(cachedProducts);
        setCategories(cachedCategories);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [productsData, categoriesData] = await Promise.all([getProducts(), getCategories()]);
        cachedProducts = productsData;
        cachedCategories = categoriesData;
        setProducts(productsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Data load error:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();

    // Load Cart
    const savedCart = localStorage.getItem('timeoutpizza_cart');
    if (savedCart) {
      try {
        const cartItems = JSON.parse(savedCart);
        const cartMap: { [key: string]: number } = {};
        cartItems.forEach((item: any) => cartMap[item.id] = (cartMap[item.id] || 0) + item.quantity);
        setCart(cartMap);
      } catch (e) {
        console.error("Cart parse error", e);
      }
    }
  }, []);

  // --- CART HANDLER ---
  const addToCart = (product: Product, qty: number = 1) => {
    setCart(prev => ({ ...prev, [product.id]: (prev[product.id] || 0) + qty }));
    const savedCart = localStorage.getItem('timeoutpizza_cart');
    let cartItems: any[] = savedCart ? JSON.parse(savedCart) : [];
    const existing = cartItems.find((i: any) => i.id === product.id);
    if (existing) existing.quantity += qty;
    else cartItems.push({ id: product.id, name: product.name, price: product.price, quantity: qty, image_url: product.image_url });
    localStorage.setItem('timeoutpizza_cart', JSON.stringify(cartItems));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const getTotalItems = () => Object.values(cart).reduce((a, b) => a + b, 0);

  // --- FILTERING ---
  const filteredProducts = useMemo(() => {
    let res = products;
    if (activeCategory !== 'all') res = res.filter(p => p.category_id === activeCategory);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      res = res.filter(p => p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q)));
    }
    return res;
  }, [products, activeCategory, searchQuery]);

  // Reset scroll when category changes
  useEffect(() => {
    if (containerRef.current) containerRef.current.scrollTop = 0;
  }, [activeCategory]);


  return (
    <div className="rashti-page-dark" style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

      {/* 1. HEADER (Fixed) */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'linear-gradient(180deg, rgba(5,26,20,0.95) 0%, rgba(5,26,20,0) 100%)',
        padding: '20px 16px 20px 80px', // REDUCED TOP PADDING from 60px to 20px
        paddingTop: 'max(20px, env(safe-area-inset-top))', // Respect safe area
      }}>
        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '8px' }}>
          <Search size={16} className="text-gold" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search pizza..."
            className="rashti-input"
            style={{ height: '36px', fontSize: '13px', background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
        </div>

        {/* Categories */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '4px' }}>
          {[{ id: 'all', name: 'All' }, ...categories].map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`rashti-chip ${activeCategory === cat.id ? 'active' : ''}`}
              style={{ padding: '4px 12px', fontSize: '11px', flexShrink: 0, border: activeCategory === cat.id ? 'none' : '1px solid rgba(255,255,255,0.2)' }}
            >
              {(cat as any).coming_soon && <Clock size={10} style={{ marginRight: 4 }} />}
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* 2. MAIN FULL-PAGE SCROLL CONTAINER */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          scrollSnapType: 'y mandatory',
          scrollBehavior: 'smooth',
          position: 'relative',
          height: '100%'
        }}
      >
        {loading ? (
          <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="text-gold">Loading Menu...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.6 }}>
            <Search size={48} color="#c9a45c" style={{ marginBottom: 16 }} />
            <p style={{ color: '#fff' }}>No items found</p>
          </div>
        ) : (
          filteredProducts.map((product, index) => {
            const productCategory = categories.find(c => c.id === product.category_id);
            const isComingSoon = product.coming_soon || productCategory?.coming_soon;

            return (
              <div
                key={product.id}
                style={{
                  height: '100vh',
                  width: '100%',
                  scrollSnapAlign: 'start',
                  scrollSnapStop: 'always',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden'
                }}
              >
                {/* A. VISUAL HALF (Top 55%) */}
                <div style={{
                  flex: '55 1 0',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingTop: '100px', // INCREASED PADDING to push image down away from new header pos
                  paddingBottom: '20px'
                }}>
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={product.id}
                      src={getPizzaImage(product)}
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -50 }}
                      transition={{ duration: 0.5 }}
                      style={{
                        width: '80%',
                        maxWidth: '400px',
                        height: 'auto',
                        objectFit: 'contain',
                        filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.5))',
                        zIndex: 10
                      }}
                    />
                  </AnimatePresence>

                  {/* Background Radial Glow */}
                  <div style={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    width: '120%', height: '80%',
                    background: 'radial-gradient(circle, rgba(201,164,92,0.15) 0%, transparent 70%)',
                    zIndex: 0
                  }} />
                </div>

                {/* B. INFO CARD HALF (Bottom 45%) */}
                <div style={{
                  flex: '45 1 0',
                  background: 'linear-gradient(180deg, rgba(13,61,46,0.95) 0%, rgba(5,26,20,1) 100%)',
                  borderTopLeftRadius: '32px',
                  borderTopRightRadius: '32px',
                  borderTop: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 -10px 40px rgba(0,0,0,0.3)',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between', // Ensures button stays at bottom
                  position: 'relative',
                  zIndex: 20
                }}>
                  {/* Pull Indicator */}
                  <div style={{ position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)', width: '40px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }} />

                  {/* Top: Badges */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      background: isComingSoon ? '#fbbf24' : 'var(--persian-gold)',
                      color: '#051a14',
                      fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '8px', letterSpacing: '0.5px'
                    }}>
                      {isComingSoon ? 'COMING SOON' : (productCategory?.name || 'MENU')}
                    </span>
                    {!isComingSoon && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '12px' }}>
                        <Star size={12} fill="#c9a45c" color="#c9a45c" />
                        <span style={{ color: '#c9a45c', fontSize: '12px', fontWeight: 'bold' }}>4.8</span>
                      </div>
                    )}
                  </div>

                  {/* Middle: Content */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '48px', flexShrink: 0 }}>
                        <JerseyImage src={product.image_url?.startsWith('jersey') ? product.image_url : ''} text={product.name} alt="Kit" forceGenerator />
                      </div>
                      <h2 style={{ fontFamily: 'Cinzel', fontSize: '24px', lineHeight: '1.1', color: 'var(--persian-gold)', margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                        {product.name}
                      </h2>
                    </div>

                    <p style={{
                      fontFamily: 'Cormorant Garamond', fontSize: '16px', lineHeight: '1.4', color: 'rgba(255,255,255,0.8)', margin: 0,
                      display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                    }}>
                      {product.description || "Authentic flavors prepared with premium ingredients in the Rasht tradition."}
                    </p>
                  </div>

                  {/* Bottom: Action */}
                  <div style={{ paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'rgba(201,164,92,0.7)', letterSpacing: '1px', display: 'block' }}>Prezzo</span>
                      <span style={{ fontFamily: 'Cinzel', fontSize: '28px', color: 'var(--persian-gold)', fontWeight: 700, lineHeight: 1 }}>
                        €{Number(product.price).toFixed(2)}
                      </span>
                    </div>

                    <button
                      disabled={!!isComingSoon}
                      onClick={() => !isComingSoon && addToCart(product)}
                      className={isComingSoon ? "rashti-btn-disabled" : "rashti-btn-primary"}
                      style={isComingSoon ? {
                        background: 'rgba(255,255,255,0.05)', color: '#666', padding: '12px 24px', borderRadius: '14px', fontSize: '13px', fontWeight: 'bold', display: 'flex', gap: '8px', alignItems: 'center'
                      } : {
                        padding: '12px 32px', fontSize: '15px', fontWeight: 'bold', boxShadow: '0 4px 20px rgba(201,164,92,0.4)', display: 'flex', gap: '8px', alignItems: 'center'
                      }}
                    >
                      {isComingSoon ? (
                        <><Clock size={16} /><span>PRESTO</span></>
                      ) : (
                        <><Plus size={18} /><span>AGGIUNGI</span></>
                      )}
                    </button>
                  </div>

                  {/* Scroll Hint Arrow (Except last item) */}
                  {index < filteredProducts.length - 1 && (
                    <motion.div
                      animate={{ y: [0, 5, 0] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      style={{ position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)', opacity: 0.3 }}
                    >
                      <ChevronDown size={16} color="#fff" />
                    </motion.div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 3. FLOATERS */}
      {getTotalItems() > 0 && (
        <motion.button
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          onClick={() => onNavigate?.('cart')}
          style={{
            position: 'absolute', bottom: '100px', right: '20px', zIndex: 90,
            width: '56px', height: '56px', borderRadius: '50%',
            background: 'var(--persian-gold)', boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #051a14'
          }}
        >
          <ShoppingCart size={22} color="#051a14" strokeWidth={2.5} />
          <span style={{
            position: 'absolute', top: -5, right: -5, width: 20, height: 20, borderRadius: '50%',
            background: '#051a14', color: 'var(--persian-gold)', fontSize: '10px', fontWeight: 'bold',
            display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--persian-gold)'
          }}>
            {getTotalItems()}
          </span>
        </motion.button>
      )}
    </div>
  );
};

export default MenuPage;
