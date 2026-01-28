import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ShoppingCart, Star, Search, Clock, AlertCircle } from 'lucide-react';
import { getProducts, getCategories, Product, Category } from '../lib/database';
import JerseyImage from '../components/JerseyImage';

interface MenuPageProps {
  onNavigate?: (page: string) => void;
}

// Simple cache for products and categories
let cachedProducts: Product[] | null = null;
let cachedCategories: Category[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 0;

// Helper to get Pizza Image based on keywords
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

  if (name.includes('MARGHERITA') || name.includes('CLASSIC')) return '/pizza-margherita-hero.png';

  return '/pizza-margherita-hero.png';
};


const MenuPage: React.FC<MenuPageProps> = ({ onNavigate }) => {
  const [products, setProducts] = useState<Product[]>(cachedProducts || []);
  const [categories, setCategories] = useState<Category[]>(cachedCategories || []);
  const [loading, setLoading] = useState(!cachedProducts);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [searchQuery, setSearchQuery] = useState('');

  const observerRef = useRef<IntersectionObserver | null>(null);
  const productRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    const loadData = async () => {
      const now = Date.now();
      if (cachedProducts && cachedCategories && (now - cacheTimestamp) < CACHE_DURATION) {
        setProducts(cachedProducts);
        setCategories(cachedCategories);
        setLoading(false);
        if (cachedProducts.length > 0) setActiveProduct(cachedProducts[0]);
        return;
      }

      setLoading(true);
      try {
        const [productsData, categoriesData] = await Promise.all([getProducts(), getCategories()]);
        cachedProducts = productsData;
        cachedCategories = categoriesData;
        cacheTimestamp = now;
        setProducts(productsData);
        setCategories(categoriesData);
        if (productsData.length > 0) setActiveProduct(productsData[0]);
      } catch (error) {
        console.error('Error loading menu data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();

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

  useEffect(() => {
    if (loading || products.length === 0) return;

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const productId = entry.target.getAttribute('data-id');
          const product = products.find(p => p.id === productId);
          if (product) setActiveProduct(product);
        }
      });
    }, { root: null, rootMargin: '-40% 0px -40% 0px', threshold: 0.1 });

    Object.values(productRefs.current).forEach((el) => {
      if (el) observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [loading, products, activeCategory]);

  const addToCart = (product: Product, qty: number = 1) => {
    setCart(prev => ({ ...prev, [product.id]: (prev[product.id] || 0) + qty }));
    const savedCart = localStorage.getItem('timeoutpizza_cart');
    let cartItems: any[] = savedCart ? JSON.parse(savedCart) : [];
    const existingItem = cartItems.find((item: any) => item.id === product.id);
    if (existingItem) {
      existingItem.quantity += qty;
    } else {
      cartItems.push({ id: product.id, name: product.name, price: product.price, quantity: qty, image_url: product.image_url });
    }
    localStorage.setItem('timeoutpizza_cart', JSON.stringify(cartItems));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const filteredProducts = useMemo(() => {
    let filtered = products;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(query) || (p.description && p.description.toLowerCase().includes(query)));
    }
    if (activeCategory !== 'all') {
      filtered = filtered.filter(p => p.category_id === activeCategory);
    }
    return filtered;
  }, [products, activeCategory, searchQuery]);

  const getTotalItems = () => Object.values(cart).reduce((a, b) => a + b, 0);

  return (
    <div className="rashti-page-dark" style={{ position: 'relative', overflow: 'hidden' }}>

      {/* HERO BACKGROUND - Fixed pizza image that changes */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '55vh',
        zIndex: 0,
        overflow: 'hidden'
      }}>
        <AnimatePresence mode="wait">
          {activeProduct && (
            <motion.img
              key={activeProduct.id}
              src={getPizzaImage(activeProduct)}
              alt={activeProduct.name}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center'
              }}
            />
          )}
        </AnimatePresence>
        {/* Gradient overlay */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '60%',
          background: 'linear-gradient(to top, #051a14 0%, transparent 100%)',
          pointerEvents: 'none'
        }} />
      </div>

      {/* HEADER - Fixed at top */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: 'linear-gradient(180deg, rgba(5, 26, 20, 0.95) 0%, rgba(5, 26, 20, 0.8) 70%, transparent 100%)',
        paddingTop: '60px',
        paddingLeft: '75px',
        paddingRight: '16px',
        paddingBottom: '16px'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '10px' }}>
          <Search size={16} className="text-gold" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Cerca..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rashti-input"
            style={{ paddingLeft: '38px', height: '40px', fontSize: '14px' }}
          />
        </div>
        {/* Categories */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          <button onClick={() => setActiveCategory('all')} className={`rashti-chip ${activeCategory === 'all' ? 'active' : ''}`} style={{ fontSize: '12px', padding: '6px 14px' }}>
            Tutti
          </button>
          {!loading && categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`rashti-chip ${activeCategory === cat.id ? 'active' : ''}`}
              style={{ fontSize: '12px', padding: '6px 14px', whiteSpace: 'nowrap' }}
            >
              {cat.coming_soon && <Clock size={10} style={{ marginRight: 4 }} />}
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* SCROLLABLE PRODUCT CARDS */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflowY: 'auto',
        scrollSnapType: 'y mandatory',
        zIndex: 10
      }}>
        {/* Spacer to push first card below hero */}
        <div style={{ height: '52vh' }} />

        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <span className="text-gold">Caricamento...</span>
          </div>
        ) : (
          filteredProducts.map((product) => {
            const productCategory = categories.find(c => c.id === product.category_id);
            const isComingSoon = product.coming_soon || productCategory?.coming_soon;

            return (
              <div
                key={product.id}
                ref={(el) => { productRefs.current[product.id] = el; }}
                data-id={product.id}
                style={{
                  height: '48vh',
                  scrollSnapAlign: 'start',
                  padding: '0 16px 16px 16px',
                  display: 'flex',
                  alignItems: 'flex-start'
                }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.4 }}
                  style={{
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(145deg, rgba(13, 61, 46, 0.95) 0%, rgba(8, 41, 32, 0.98) 100%)',
                    borderRadius: '24px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    border: '1px solid rgba(201, 164, 92, 0.25)',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
                    opacity: isComingSoon ? 0.75 : 1
                  }}
                >
                  {/* Top: Category Badge + Rating */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      background: isComingSoon ? '#f59e0b' : 'var(--persian-gold)',
                      color: '#082920',
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '5px 12px',
                      borderRadius: '10px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      {isComingSoon ? 'PRESTO' : (productCategory?.name || 'MENU')}
                    </span>
                    {!isComingSoon && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Star size={14} fill="#c9a45c" color="#c9a45c" />
                        <span style={{ color: '#c9a45c', fontSize: '13px', fontWeight: 700 }}>4.8</span>
                      </div>
                    )}
                  </div>

                  {/* Middle: Jersey + Name + Description */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '12px', padding: '10px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '50px', height: '60px', flexShrink: 0 }}>
                        <JerseyImage
                          src={(product.image_url && product.image_url.startsWith('jersey')) ? product.image_url : ''}
                          text={product.name}
                          alt="Jersey"
                          forceGenerator={true}
                        />
                      </div>
                      <h2 style={{
                        color: 'var(--persian-gold)',
                        fontSize: '22px',
                        fontWeight: 700,
                        fontFamily: 'Cinzel',
                        margin: 0,
                        lineHeight: 1.15,
                        textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                      }}>
                        {product.name}
                      </h2>
                    </div>
                    <p style={{
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontSize: '14px',
                      lineHeight: 1.5,
                      fontFamily: 'Cormorant Garamond',
                      margin: 0,
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}>
                      {product.description || "Ingredienti freschi preparati secondo tradizione."}
                    </p>
                  </div>

                  {/* Bottom: Price + Button */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '12px',
                    borderTop: '1px solid rgba(201, 164, 92, 0.15)'
                  }}>
                    <div>
                      <div style={{ color: 'rgba(201, 164, 92, 0.6)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Prezzo</div>
                      <div style={{ color: 'var(--persian-gold)', fontSize: '28px', fontWeight: 800, fontFamily: 'Cinzel', lineHeight: 1 }}>
                        €{(typeof product.price === 'string' ? parseFloat(product.price) : (product.price || 0)).toFixed(2)}
                      </div>
                    </div>
                    <button
                      onClick={() => !isComingSoon && addToCart(product)}
                      disabled={!!isComingSoon}
                      className={isComingSoon ? "" : "rashti-btn-primary"}
                      style={isComingSoon ? {
                        background: 'rgba(255,255,255,0.1)',
                        color: '#9ca3af',
                        border: '1px solid rgba(255,255,255,0.15)',
                        padding: '12px 20px',
                        borderRadius: '14px',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      } : {
                        padding: '14px 24px',
                        fontSize: '14px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 6px 20px rgba(201, 164, 92, 0.35)'
                      }}
                    >
                      {isComingSoon ? (
                        <><Clock size={18} /><span>PRESTO</span></>
                      ) : (
                        <><Plus size={20} /><span>AGGIUNGI</span></>
                      )}
                    </button>
                  </div>
                </motion.div>
              </div>
            );
          })
        )}

        {/* Bottom spacer */}
        <div style={{ height: '20vh' }} />
      </div>

      {/* Cart FAB */}
      {getTotalItems() > 0 && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => onNavigate?.('cart')}
          className="rashti-btn-primary"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            boxShadow: '0 8px 24px rgba(201, 164, 92, 0.4)'
          }}
        >
          <div style={{ position: 'relative' }}>
            <ShoppingCart size={24} color="#082920" />
            <span style={{
              position: 'absolute', top: '-10px', right: '-10px',
              background: '#082920', color: '#c9a45c',
              fontSize: '11px', fontWeight: 'bold',
              width: '20px', height: '20px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid #c9a45c'
            }}>
              {getTotalItems()}
            </span>
          </div>
        </motion.button>
      )}
    </div>
  );
};

export default MenuPage;
