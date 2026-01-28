import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  const [activeProductId, setActiveProductId] = useState<string | null>(null);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const productRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // --- DATA LOADING ---
  useEffect(() => {
    const loadData = async () => {
      if (cachedProducts && cachedCategories) {
        setProducts(cachedProducts);
        setCategories(cachedCategories);
        setLoading(false);
        if (cachedProducts.length > 0) setActiveProductId(cachedProducts[0].id);
        return;
      }
      setLoading(true);
      try {
        const [productsData, categoriesData] = await Promise.all([getProducts(), getCategories()]);
        cachedProducts = productsData;
        cachedCategories = categoriesData;
        setProducts(productsData);
        setCategories(categoriesData);
        if (productsData.length > 0) setActiveProductId(productsData[0].id);
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

  // --- SCROLL OBSERVER ---
  useEffect(() => {
    if (loading || filteredProducts.length === 0) return;

    // Disconnect old observer
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const pid = entry.target.getAttribute('data-id');
          if (pid) setActiveProductId(pid);
        }
      });
    }, {
      root: null,
      rootMargin: '-40% 0px -40% 0px', // Trigger when item is in middle 20% of screen
      threshold: 0.1
    });

    // Observe all filtered products
    filteredProducts.forEach(p => {
      const el = productRefs.current[p.id];
      if (el) observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [loading, filteredProducts]);


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

  const activeProduct = useMemo(() =>
    products.find(p => p.id === activeProductId) || filteredProducts[0],
    [activeProductId, products, filteredProducts]);


  return (
    <div className="rashti-page-dark" style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>

      {/* 1. FIXED TOP IMAGE SQUARE (40vh) */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '42vh',
        zIndex: 0,
        background: 'linear-gradient(180deg, #051a14 0%, #0d3d2e 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        paddingTop: '60px' // Space for header
      }}>
        <AnimatePresence mode="wait">
          {activeProduct && (
            <motion.img
              key={activeProduct.id}
              initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 1.1, rotate: 5 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              src={getPizzaImage(activeProduct)}
              alt={activeProduct.name}
              style={{
                width: '75%',
                height: '75%',
                objectFit: 'contain',
                filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.5))'
              }}
            />
          )}
        </AnimatePresence>

        {/* Fade overlay at bottom of image area */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '80px',
          background: 'linear-gradient(to bottom, transparent 0%, rgba(5,26,20,0.8) 100%)'
        }} />
      </div>

      {/* 2. FIXED HEADER */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '60px 16px 10px 80px', // Left padding for generic back button
        display: 'flex', flexDirection: 'column', gap: '10px'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', width: '100%' }}>
          <Search size={16} className="text-gold" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="rashti-input"
            style={{
              height: '40px', fontSize: '14px',
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'white'
            }}
          />
        </div>

        {/* Categories */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '4px' }}>
          <button
            onClick={() => setActiveCategory('all')}
            className={`rashti-chip ${activeCategory === 'all' ? 'active' : ''}`}
            style={{ padding: '6px 12px', fontSize: '12px', flexShrink: 0, background: activeCategory === 'all' ? 'var(--persian-gold)' : 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`rashti-chip ${activeCategory === cat.id ? 'active' : ''}`}
              style={{
                padding: '6px 12px', fontSize: '12px', flexShrink: 0,
                background: activeCategory === cat.id ? 'var(--persian-gold)' : 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)',
                border: activeCategory === cat.id ? 'none' : '1px solid rgba(255,255,255,0.2)'
              }}
            >
              {(cat as any).coming_soon && <Clock size={10} style={{ marginRight: 4 }} />}
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* 3. SCROLLABLE LIST (Starts at 40vh) */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        overflowY: 'auto',
        paddingTop: '42vh', // Push content down to reveal image
        zIndex: 10,
        scrollBehavior: 'smooth'
      }}>
        <div style={{
          background: 'linear-gradient(180deg, rgba(8,41,32,0.95) 0%, #051a14 100%)',
          borderTopLeftRadius: '30px',
          borderTopRightRadius: '30px',
          minHeight: '60vh',
          boxShadow: '0 -10px 30px rgba(0,0,0,0.5)',
          padding: '24px 16px 100px 16px', // Extra bottom padding for cart fab
          backdropFilter: 'blur(10px)'
        }}>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#c9a45c' }}>Loading...</div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>No items found</div>
          ) : (
            filteredProducts.map((product) => {
              const productCategory = categories.find(c => c.id === product.category_id);
              const isComingSoon = product.coming_soon || productCategory?.coming_soon;
              const isActive = activeProductId === product.id;

              return (
                <div
                  key={product.id}
                  ref={(el) => { productRefs.current[product.id] = el; }}
                  data-id={product.id}
                  style={{
                    marginBottom: '16px',
                    scrollMarginTop: '45vh' // Helps with scrolling alignment
                  }}
                >
                  <motion.div
                    animate={{
                      scale: isActive ? 1.02 : 1,
                      borderColor: isActive ? 'rgba(201,164,92,0.6)' : 'rgba(255,255,255,0.05)'
                    }}
                    className="rashti-card"
                    onClick={() => setActiveProductId(product.id)}
                    style={{
                      padding: '20px',
                      background: isActive
                        ? 'linear-gradient(145deg, rgba(13,61,46,0.9) 0%, rgba(8,41,32,0.95) 100%)'
                        : 'linear-gradient(145deg, rgba(13,61,46,0.6) 0%, rgba(8,41,32,0.7) 100%)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      borderRadius: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                  >

                    {/* Header: Name + Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span style={{
                            fontSize: '9px', fontWeight: 800, textTransform: 'uppercase',
                            background: isComingSoon ? '#fbbf24' : 'var(--persian-gold)',
                            color: '#051a14', padding: '3px 8px', borderRadius: '6px'
                          }}>
                            {isComingSoon ? 'SOON' : (productCategory?.name || 'ITEM')}
                          </span>
                          {!isComingSoon && <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}><Star size={10} fill="#c9a45c" color="#c9a45c" /><span style={{ fontSize: '11px', color: '#c9a45c', fontWeight: 'bold' }}>4.8</span></div>}
                        </div>
                        <h3 style={{
                          fontFamily: 'Cinzel', fontSize: '18px', color: 'var(--persian-gold)', margin: 0,
                          textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                        }}>
                          {product.name}
                        </h3>
                      </div>

                      {/* Mini Jersey Icon */}
                      <div style={{ width: '30px', height: '36px', opacity: 0.8 }}>
                        <JerseyImage src={product.image_url?.startsWith('jersey') ? product.image_url : ''} text={product.name} alt="Kit" forceGenerator />
                      </div>
                    </div>

                    {/* Description */}
                    <p style={{
                      fontFamily: 'Cormorant Garamond', fontSize: '14px', lineHeight: '1.4',
                      color: 'rgba(255,255,255,0.7)', margin: 0,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                    }}>
                      {product.description}
                    </p>

                    {/* Footer: Price + Button */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                      <span style={{ fontFamily: 'Cinzel', fontSize: '20px', color: 'var(--persian-gold)', fontWeight: 700 }}>
                        €{Number(product.price).toFixed(2)}
                      </span>

                      <button
                        disabled={!!isComingSoon}
                        onClick={(e) => { e.stopPropagation(); !isComingSoon && addToCart(product); }}
                        className={isComingSoon ? "rashti-btn-disabled" : "rashti-btn-primary"}
                        style={isComingSoon ? {
                          padding: '8px 16px', fontSize: '11px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: '#666'
                        } : {
                          padding: '8px 20px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px',
                          boxShadow: '0 4px 12px rgba(201,164,92,0.3)'
                        }}
                      >
                        {isComingSoon ? <><Clock size={14} /><span>PRESTO</span></> : <><Plus size={16} /><span>AGGIUNGI</span></>}
                      </button>
                    </div>
                  </motion.div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Floating Cart Button */}
      {getTotalItems() > 0 && (
        <motion.button
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          onClick={() => onNavigate?.('cart')}
          style={{
            position: 'absolute', bottom: '24px', right: '24px', zIndex: 90,
            width: '60px', height: '60px', borderRadius: '50%',
            background: 'var(--persian-gold)', boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #051a14'
          }}
        >
          <ShoppingCart size={24} color="#051a14" strokeWidth={2.5} />
          <span style={{
            position: 'absolute', top: -5, right: -5, width: 22, height: 22, borderRadius: '50%',
            background: '#051a14', color: 'var(--persian-gold)', fontSize: '11px', fontWeight: 'bold',
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
