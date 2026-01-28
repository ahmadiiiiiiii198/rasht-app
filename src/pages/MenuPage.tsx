import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
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
const CACHE_DURATION = 0; // Disabled cache to force fresh data

// Helper to get Pizza Image based on keywords
const getPizzaImage = (product: Product): string => {
  const name = product.name.toUpperCase();
  const desc = (product.description || '').toLowerCase();

  // 1. SPECIFIC PLAYER/SIGNATURE PIZZAS
  if (name.includes('LEBRON')) return '/pizza-pistachio-mortadella.png';
  if (name.includes('JORDAN') || name.includes('KOBE') || name.includes('IVERSON') || name.includes('DUNCAN')) return '/pizza-meat-truffle.png';
  if (name.includes('ROSE') || name.includes('GINOBILI') || name.includes('TATUM') || name.includes('DONCIC')) return '/pizza-white-potato.png';
  if (name.includes('WESTBROOK') || name.includes('IRVING') || name.includes('CURRY') || name.includes('LILLARD') || name.includes('HARDEN')) return '/pizza-spicy-salami.png';
  if (name.includes('DURANT') || name.includes('GARNETT') || name.includes('JOKIC') || name.includes('GASOL')) return '/pizza-veggie-grilled.png';

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
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Load Data (with caching)
  useEffect(() => {
    const loadData = async () => {
      const now = Date.now();

      // Use cache if valid
      if (cachedProducts && cachedCategories && (now - cacheTimestamp) < CACHE_DURATION) {
        setProducts(cachedProducts);
        setCategories(cachedCategories);
        setLoading(false);
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
    <div style={{ display: 'grid', gap: '16px', padding: '16px' }}>
      {[1, 2, 3].map((i) => (
        <div key={i} className="rashti-card" style={{ height: '140px', opacity: 0.5 }} />
      ))}
    </div>
  );

  return (
    <div className="rashti-page-dark" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* FIXED HEADER: Search + Categories */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'linear-gradient(180deg, #051a14 0%, #051a14 90%, transparent 100%)',
        paddingTop: '70px', // Space for back button
        paddingLeft: '80px',
        paddingRight: '16px',
        paddingBottom: '12px',
      }}>
        {/* Search Bar */}
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <Search size={18} className="text-gold" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Cerca prodotto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rashti-input"
            style={{ paddingLeft: '42px', height: '44px', fontSize: '15px' }}
          />
        </div>

        {/* Categories Scroller */}
        <div style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '4px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          <button
            onClick={() => setActiveCategory('all')}
            className={`rashti-chip ${activeCategory === 'all' ? 'active' : ''}`}
            style={{ whiteSpace: 'nowrap', fontSize: '13px', padding: '8px 16px' }}
          >
            Tutti
          </button>

          {loading ? (
            [1, 2, 3].map(k => <div key={k} className="rashti-chip" style={{ width: '80px', height: '34px', opacity: 0.5 }} />)
          ) : (
            categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`rashti-chip ${activeCategory === cat.id ? 'active' : ''} ${cat.coming_soon ? 'coming-soon' : ''}`}
                style={{
                  whiteSpace: 'nowrap',
                  fontSize: '13px',
                  padding: '8px 16px',
                  ...(cat.coming_soon ? { border: '1px solid rgba(234, 179, 8, 0.5)', color: '#fbbf24' } : {})
                }}
              >
                {cat.coming_soon && <Clock size={12} style={{ marginRight: 4 }} />}
                {cat.name}
              </button>
            ))
          )}
        </div>
      </div>

      {/* SCROLLABLE PRODUCT LIST */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '0 16px 100px 16px',
        background: 'linear-gradient(180deg, transparent 0%, #051a14 5%)'
      }}>

        {/* Category Description Banner */}
        {!loading && activeCategory !== 'all' && categories.find(c => c.id === activeCategory)?.description && (
          <div style={{
            padding: '12px 16px',
            marginBottom: '16px',
            background: 'rgba(234, 179, 8, 0.15)',
            border: '1px solid rgba(234, 179, 8, 0.4)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <AlertCircle color="#fbbf24" size={20} />
            <p style={{ color: '#fbbf24', margin: 0, fontSize: '13px', fontWeight: '600', fontFamily: 'Cinzel' }}>
              {categories.find(c => c.id === activeCategory)?.description}
            </p>
          </div>
        )}

        {loading ? <MenuSkeleton /> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredProducts.map((product, index) => {
              const productCategory = categories.find(c => c.id === product.category_id);
              const isComingSoon = product.coming_soon || productCategory?.coming_soon;

              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  style={{
                    background: 'linear-gradient(145deg, rgba(13, 61, 46, 0.8) 0%, rgba(8, 41, 32, 0.95) 100%)',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    border: '1px solid rgba(201, 164, 92, 0.2)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                    opacity: isComingSoon ? 0.7 : 1
                  }}
                >
                  {/* Product Layout: Image on left, content on right */}
                  <div style={{ display: 'flex', minHeight: '160px' }}>

                    {/* Product Image */}
                    <div style={{
                      width: '140px',
                      minWidth: '140px',
                      background: 'linear-gradient(135deg, rgba(5, 26, 20, 0.9) 0%, rgba(13, 61, 46, 0.6) 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '12px',
                      position: 'relative'
                    }}>
                      <img
                        src={getPizzaImage(product)}
                        alt={product.name}
                        style={{
                          width: '110px',
                          height: '110px',
                          objectFit: 'contain',
                          filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))'
                        }}
                      />
                      {/* Category Badge */}
                      <span style={{
                        position: 'absolute',
                        top: '8px',
                        left: '8px',
                        background: isComingSoon ? '#fbbf24' : 'var(--persian-gold)',
                        color: 'var(--persian-emerald-dark)',
                        fontSize: '9px',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        {isComingSoon ? 'SOON' : (productCategory?.name || 'ITEM')}
                      </span>
                    </div>

                    {/* Product Content */}
                    <div style={{
                      flex: 1,
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}>
                      {/* Title + Jersey */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                          <div style={{ width: '32px', height: '38px', flexShrink: 0 }}>
                            <JerseyImage
                              src={(product.image_url && product.image_url.startsWith('jersey')) ? product.image_url : ''}
                              text={product.name}
                              alt="Jersey"
                              forceGenerator={true}
                            />
                          </div>
                          <h3 style={{
                            color: 'var(--persian-gold)',
                            fontSize: '16px',
                            fontWeight: 700,
                            fontFamily: 'Cinzel',
                            margin: 0,
                            lineHeight: 1.2
                          }}>
                            {product.name}
                          </h3>
                        </div>

                        {/* Description */}
                        <p style={{
                          color: 'rgba(255, 255, 255, 0.7)',
                          fontSize: '12px',
                          lineHeight: 1.4,
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

                      {/* Price + Add Button */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: '12px'
                      }}>
                        <div>
                          <span style={{
                            color: 'rgba(201, 164, 92, 0.6)',
                            fontSize: '9px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            display: 'block'
                          }}>Prezzo</span>
                          <span style={{
                            color: 'var(--persian-gold)',
                            fontSize: '20px',
                            fontWeight: 800,
                            fontFamily: 'Cinzel'
                          }}>
                            €{(typeof product.price === 'string' ? parseFloat(product.price) : (product.price || 0)).toFixed(2)}
                          </span>
                        </div>

                        <button
                          onClick={() => !isComingSoon && addToCart(product)}
                          disabled={!!isComingSoon}
                          className={isComingSoon ? "rashti-btn-disabled" : "rashti-btn-primary"}
                          style={isComingSoon ? {
                            background: 'rgba(255,255,255,0.08)',
                            color: '#6b7280',
                            cursor: 'not-allowed',
                            border: '1px solid rgba(255,255,255,0.1)',
                            padding: '10px 16px',
                            borderRadius: '12px',
                            fontWeight: 'bold',
                            fontSize: '11px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          } : {
                            padding: '10px 18px',
                            fontSize: '12px',
                            boxShadow: '0 4px 12px rgba(201, 164, 92, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          {isComingSoon ? (
                            <>
                              <Clock size={14} />
                              <span>PRESTO</span>
                            </>
                          ) : (
                            <>
                              <Plus size={16} />
                              <span style={{ fontWeight: 700, letterSpacing: '0.5px' }}>AGGIUNGI</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Rating */}
                      {!isComingSoon && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          marginTop: '8px'
                        }}>
                          <Star size={12} fill="#c9a45c" color="#c9a45c" />
                          <span style={{ color: 'rgba(201, 164, 92, 0.8)', fontSize: '11px', fontWeight: 600 }}>4.8</span>
                          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', marginLeft: '4px' }}>(128 recensioni)</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredProducts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🍕</div>
            <h3 style={{ color: 'var(--persian-gold)', fontFamily: 'Cinzel', marginBottom: '8px' }}>Nessun prodotto trovato</h3>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>Prova a cercare qualcos'altro</p>
          </div>
        )}
      </div>

      {/* Cart Floating Action Button */}
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
              position: 'absolute',
              top: '-10px',
              right: '-10px',
              background: '#082920',
              color: '#c9a45c',
              fontSize: '11px',
              fontWeight: 'bold',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
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
