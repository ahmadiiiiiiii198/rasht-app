import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, ShoppingCart, ChevronDown, Search, X } from 'lucide-react';
import { getProducts, getCategories, Product, Category } from '../lib/database';
import { supabase } from '../lib/supabase';

interface MenuPageProps {
  onNavigate?: (page: string) => void;
}

interface ProductExtra {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
}

interface SelectedExtra extends ProductExtra {
  quantity: number;
}

const MenuPage: React.FC<MenuPageProps> = ({ onNavigate }) => {
  // Main menu state
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);

  // Customization modal state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showCustomizationModal, setShowCustomizationModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [availableExtras, setAvailableExtras] = useState<ProductExtra[]>([]);
  const [availableBeverages, setAvailableBeverages] = useState<ProductExtra[]>([]);
  const [selectedExtras, setSelectedExtras] = useState<SelectedExtra[]>([]);
  const [selectedBeverages, setSelectedBeverages] = useState<SelectedExtra[]>([]);
  const [specialRequests, setSpecialRequests] = useState('');
  const [categorySupportsExtras, setCategorySupportsExtras] = useState(false);
  const [isLoadingExtras, setIsLoadingExtras] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [productsData, categoriesData] = await Promise.all([
          getProducts(),
          getCategories()
        ]);
        setProducts(productsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error loading menu data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Debug: Log products and categories when they load
  useEffect(() => {
    if (products.length > 0) {
      console.log('✅ Products loaded:', products.length);
      console.log('First product:', products[0]);
      console.log('Product IDs:', products.map(p => p.id).slice(0, 5));
    }
  }, [products]);

  useEffect(() => {
    if (categories.length > 0) {
      console.log('✅ Categories loaded:', categories.length);
      console.log('First category:', categories[0]);
    }
  }, [categories]);

  const addToCart = (itemId: string) => {
    setCart(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1
    }));

    // Also add to persistent cart for CartPage
    const product = products.find(p => p.id === itemId);
    if (product) {
      const savedCart = localStorage.getItem('efes_cart');
      let cartItems = [];

      try {
        cartItems = savedCart ? JSON.parse(savedCart) : [];
      } catch (error) {
        console.error('Error loading cart:', error);
        cartItems = [];
      }

      const existingItem = cartItems.find((item: any) => item.id === itemId);
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        cartItems.push({
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          image_url: product.image_url
        });
      }

      localStorage.setItem('efes_cart', JSON.stringify(cartItems));
    }
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] || 0) - 1)
    }));
  };

  const getTotalItems = () => {
    return Object.values(cart).reduce((sum, count) => sum + count, 0);
  };

  // Update search active state
  useEffect(() => {
    setIsSearchActive(!!searchTerm.trim());
  }, [searchTerm]);

  // Load extras and beverages when modal opens
  useEffect(() => {
    if (showCustomizationModal && selectedProduct) {
      loadExtrasAndBeverages();
      checkCategoryExtrasSupport();
      // Reset state
      setSelectedExtras([]);
      setSelectedBeverages([]);
      setQuantity(1);
      setSpecialRequests('');
    }
  }, [showCustomizationModal, selectedProduct]);

  const checkCategoryExtrasSupport = async () => {
    if (!selectedProduct?.category_id) {
      setCategorySupportsExtras(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('extras_enabled')
        .eq('id', selectedProduct.category_id)
        .single();

      if (error) throw error;
      setCategorySupportsExtras(data?.extras_enabled || false);
    } catch (error) {
      console.error('Error checking category extras support:', error);
      setCategorySupportsExtras(false);
    }
  };

  const loadExtrasAndBeverages = async () => {
    try {
      setIsLoadingExtras(true);

      // Get category IDs for extras and beverages
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, slug, name')
        .in('slug', ['extra', 'extras', 'bevande', 'vini']);

      if (categoriesError) throw categoriesError;

      const extrasCategoryIds = categoriesData
        .filter(cat => ['extra', 'extras'].includes(cat.slug))
        .map(cat => cat.id);

      const beveragesCategoryIds = categoriesData
        .filter(cat => ['bevande', 'vini'].includes(cat.slug))
        .map(cat => cat.id);

      // Load extras (only if category supports them)
      if (categorySupportsExtras && extrasCategoryIds.length > 0) {
        const { data: extrasData, error: extrasError } = await supabase
          .from('products')
          .select('id, name, price, description')
          .eq('is_active', true)
          .in('category_id', extrasCategoryIds)
          .order('name');

        if (extrasError) throw extrasError;

        const extras: ProductExtra[] = extrasData.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          description: item.description || '',
          category: 'extras'
        }));

        setAvailableExtras(extras);
      } else {
        setAvailableExtras([]);
      }

      // Load beverages (always available)
      if (beveragesCategoryIds.length > 0) {
        const { data: beveragesData, error: beveragesError } = await supabase
          .from('products')
          .select('id, name, price, description')
          .eq('is_active', true)
          .in('category_id', beveragesCategoryIds)
          .order('name');

        if (beveragesError) throw beveragesError;

        const beverages: ProductExtra[] = beveragesData.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          description: item.description || '',
          category: 'bevande'
        }));

        setAvailableBeverages(beverages);
      }
    } catch (error) {
      console.error('Error loading extras and beverages:', error);
    } finally {
      setIsLoadingExtras(false);
    }
  };

  const addExtra = (extra: ProductExtra, isExtras: boolean) => {
    const setSelected = isExtras ? setSelectedExtras : setSelectedBeverages;
    const selected = isExtras ? selectedExtras : selectedBeverages;

    setSelected(prev => {
      const existing = prev.find(item => item.id === extra.id);
      if (existing) {
        return prev.map(item =>
          item.id === extra.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...extra, quantity: 1 }];
    });
  };

  const removeExtra = (extraId: string, isExtras: boolean) => {
    const setSelected = isExtras ? setSelectedExtras : setSelectedBeverages;
    setSelected(prev => prev.filter(item => item.id !== extraId));
  };

  const updateExtraQuantity = (extraId: string, newQuantity: number, isExtras: boolean) => {
    if (newQuantity <= 0) {
      removeExtra(extraId, isExtras);
      return;
    }
    const setSelected = isExtras ? setSelectedExtras : setSelectedBeverages;
    setSelected(prev =>
      prev.map(item =>
        item.id === extraId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const calculateTotalPrice = () => {
    if (!selectedProduct) return 0;

    const productPrice = (selectedProduct.price / 100) * quantity;
    const extrasPrice = selectedExtras.reduce((total, extra) =>
      total + ((extra.price / 100) * extra.quantity), 0
    );
    const beveragesPrice = selectedBeverages.reduce((total, beverage) =>
      total + ((beverage.price / 100) * beverage.quantity), 0
    );

    return productPrice + extrasPrice + beveragesPrice;
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setShowCustomizationModal(true);
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;

    setCart(prev => ({
      ...prev,
      [selectedProduct.id]: (prev[selectedProduct.id] || 0) + quantity
    }));

    // Add to persistent cart with extras
    const savedCart = localStorage.getItem('efes_cart');
    let cartItems: any[] = [];

    try {
      cartItems = savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error('Error loading cart:', error);
      cartItems = [];
    }

    const existingItem = cartItems.find((item: any) => item.id === selectedProduct.id);
    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.extras = selectedExtras;
      existingItem.beverages = selectedBeverages;
      existingItem.specialRequests = specialRequests;
    } else {
      cartItems.push({
        id: selectedProduct.id,
        name: selectedProduct.name,
        price: selectedProduct.price,
        quantity,
        image_url: selectedProduct.image_url,
        extras: selectedExtras,
        beverages: selectedBeverages,
        specialRequests
      });
    }

    localStorage.setItem('efes_cart', JSON.stringify(cartItems));
    console.log('✅ Saved to localStorage:', cartItems);
    // Dispatch custom event to notify cart hook of changes
    window.dispatchEvent(new Event('cartUpdated'));
    console.log('✅ Dispatched cartUpdated event');
    setShowCustomizationModal(false);
  };

  const toggleCategoryExpansion = useCallback((categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTerm("");
    setIsSearchActive(false);
  }, []);

  // Filter products based on search term
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;

    const lowerTerm = searchTerm.toLowerCase();
    return products.filter(p =>
      p.name.toLowerCase().includes(lowerTerm) ||
      (p.description && p.description.toLowerCase().includes(lowerTerm))
    );
  }, [products, searchTerm]);

  // Filter categories to only show those with products
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return categories;

    const categoryIdsWithProducts = new Set(filteredProducts.map(p => p.category_id));
    return categories.filter(c => categoryIdsWithProducts.has(c.id));
  }, [categories, filteredProducts, searchTerm]);

  // Automatically expand categories when searching
  useEffect(() => {
    if (searchTerm.trim()) {
      const allCategoryIds = new Set(filteredCategories.map(c => c.id));
      setExpandedCategories(allCategoryIds);
    }
  }, [searchTerm, filteredCategories]);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          padding: '40px 20px',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          color: '#666'
        }}
      >
        Loading menu...
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ paddingBottom: '80px' }} // Add padding for floating button
    >
      {/* Search Bar */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{
          marginBottom: '20px',
          position: 'relative'
        }}
      >
        <div style={{ position: 'relative' }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#999',
              pointerEvents: 'none'
            }}
          />
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 40px 12px 44px',
              borderRadius: '12px',
              border: '2px solid #e0e0e0',
              fontSize: '15px',
              outline: 'none',
              transition: 'border-color 0.2s',
              background: 'white'
            }}
            onFocus={(e) => e.target.style.borderColor = '#d4af37'}
            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
          />
          {searchTerm && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={clearSearch}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: '#ff6b6b',
                border: 'none',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'white'
              }}
            >
              <X size={14} />
            </motion.button>
          )}
        </div>
        {searchTerm && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              fontSize: '13px',
              color: '#666',
              margin: '8px 0 0 0',
              padding: '0 4px'
            }}
          >
            Found {filteredProducts.length} item{filteredProducts.length !== 1 ? 's' : ''}
          </motion.p>
        )}
      </motion.div>

      {/* Accordion Categories */}
      <motion.div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <AnimatePresence>
          {filteredCategories.map((category) => {
            const categoryProducts = filteredProducts.filter(p => p.category_id === category.id);
            const isExpanded = expandedCategories.has(category.id);

            // Debug logging
            if (isExpanded && categoryProducts.length === 0) {
              console.log(`Category "${category.name}" (${category.id}) has no products. Total products: ${products.length}`);
            }

            return (
              <motion.div key={category.id}>
                {/* Category Header */}
                <motion.button
                  onClick={() => toggleCategoryExpansion(category.id)}
                  style={{
                    width: '100%',
                    background: '#1a1a2e',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: '600',
                    transition: 'all 0.3s ease'
                  }}
                  whileHover={{ backgroundColor: '#252541' }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '20px' }}>🍽️</span>
                    <span>{category.name}</span>
                  </div>
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown size={20} />
                  </motion.div>
                </motion.button>

                {/* Products List */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px', paddingLeft: '8px' }}>
                        {categoryProducts.map((item) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            style={{
                              background: 'rgba(255, 255, 255, 0.95)',
                              borderRadius: '12px',
                              padding: '16px',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px'
                            }}
                          >
                            <div style={{ fontSize: '32px', flexShrink: 0 }}>
                              {item.image_url ? (
                                <img
                                  src={item.image_url}
                                  alt={item.name}
                                  style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '8px',
                                    objectFit: 'cover'
                                  }}
                                />
                              ) : (
                                '🍽️'
                              )}
                            </div>
                            <div style={{ flex: 1 }}>
                              <h4 style={{
                                color: '#333',
                                margin: '0 0 4px 0',
                                fontSize: '15px',
                                fontWeight: '600'
                              }}>
                                {item.name}
                              </h4>
                              {item.description && (
                                <p style={{
                                  color: '#888',
                                  margin: '0',
                                  fontSize: '12px',
                                  lineHeight: '1.3'
                                }}>
                                  {item.description}
                                </p>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                              <span style={{
                                fontSize: '15px',
                                fontWeight: 'bold',
                                color: '#FF6B6B',
                                minWidth: '50px',
                                textAlign: 'right'
                              }}>
                                €{typeof item.price === 'number' ? (item.price / 100).toFixed(2) : '0.00'}
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {cart[item.id] > 0 && (
                                  <motion.button
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => removeFromCart(item.id)}
                                    style={{
                                      width: '28px',
                                      height: '28px',
                                      borderRadius: '50%',
                                      border: 'none',
                                      background: '#ff4757',
                                      color: 'white',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      cursor: 'pointer',
                                      fontSize: '14px'
                                    }}
                                  >
                                    <Minus size={14} />
                                  </motion.button>
                                )}
                                {cart[item.id] > 0 && (
                                  <span style={{
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    color: '#333',
                                    minWidth: '20px',
                                    textAlign: 'center'
                                  }}>
                                    {cart[item.id]}
                                  </span>
                                )}
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleProductClick(item)}
                                  style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '50%',
                                    border: 'none',
                                    background: '#2ed573',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                  }}
                                >
                                  <Plus size={14} />
                                </motion.button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Cart Summary */}
      <AnimatePresence>
        {getTotalItems() > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            style={{
              position: 'fixed',
              bottom: 'max(20px, env(safe-area-inset-bottom))',
              left: '20px',
              right: '20px',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              borderRadius: '20px',
              padding: '20px',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
              zIndex: 50
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShoppingCart size={24} />
              <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
                {getTotalItems()} items in cart
              </span>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate?.('cart')}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '2px solid white',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '15px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              View Cart
            </motion.button>
          </motion.div>
        )}

        {/* Product Customization Modal - Website Style */}
        <AnimatePresence>
          {showCustomizationModal && selectedProduct && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '20px'
              }}
              onClick={() => setShowCustomizationModal(false)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: 'white',
                  borderRadius: '20px',
                  padding: '30px',
                  maxWidth: '500px',
                  width: '100%',
                  maxHeight: '80vh',
                  overflow: 'auto',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                }}
              >
                {/* Product Info */}
                <div style={{
                  display: 'flex',
                  gap: '16px',
                  padding: '16px',
                  background: '#f5f5f5',
                  borderRadius: '12px',
                  marginBottom: '24px'
                }}>
                  {selectedProduct.image_url && (
                    <img
                      src={selectedProduct.image_url}
                      alt={selectedProduct.name}
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '8px',
                        objectFit: 'cover',
                        flexShrink: 0
                      }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 4px 0', color: '#333', fontSize: '16px', fontWeight: '600' }}>
                      {selectedProduct.name}
                    </h3>
                    {selectedProduct.description && (
                      <p style={{ margin: '0 0 8px 0', color: '#888', fontSize: '13px' }}>
                        {selectedProduct.description}
                      </p>
                    )}
                    <p style={{ margin: '0', color: '#22c55e', fontSize: '16px', fontWeight: 'bold' }}>
                      €{(selectedProduct.price / 100).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Quantity Selector */}
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ margin: '0 0 12px 0', color: '#333', fontSize: '16px', fontWeight: '600' }}>
                    Quantità:
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '6px',
                        border: '2px solid #ddd',
                        background: 'white',
                        color: '#333',
                        cursor: quantity <= 1 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: quantity <= 1 ? 0.5 : 1
                      }}
                    >
                      <Minus size={16} />
                    </motion.button>
                    <span style={{ fontSize: '18px', fontWeight: 'bold', minWidth: '30px', textAlign: 'center' }}>
                      {quantity}
                    </span>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setQuantity(quantity + 1)}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '6px',
                        border: '2px solid #d4af37',
                        background: '#d4af37',
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Plus size={16} />
                    </motion.button>
                  </div>
                </div>

                {/* Loading State */}
                {isLoadingExtras && (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                    Caricamento opzioni...
                  </div>
                )}

                {/* Extras Section - Only show if category supports extras */}
                {!isLoadingExtras && categorySupportsExtras && availableExtras.length > 0 && (
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ margin: '0 0 12px 0', color: '#333', fontSize: '16px', fontWeight: '600' }}>
                      Aggiungi Extra:
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      {availableExtras.map(extra => {
                        const selectedExtra = selectedExtras.find(item => item.id === extra.id);
                        return (
                          <div
                            key={extra.id}
                            style={{
                              border: '1px solid #ddd',
                              borderRadius: '8px',
                              padding: '12px',
                              transition: 'background-color 0.2s'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                              <div style={{ flex: 1 }}>
                                <h5 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                                  {extra.name}
                                </h5>
                                {extra.description && (
                                  <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#888' }}>
                                    {extra.description}
                                  </p>
                                )}
                                <p style={{ margin: '0', fontSize: '14px', fontWeight: '600', color: '#22c55e' }}>
                                  +€{extra.price.toFixed(2)}
                                </p>
                              </div>
                              {!selectedExtra ? (
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => addExtra(extra, true)}
                                  style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    border: 'none',
                                    background: '#2ed573',
                                    color: 'white',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '12px',
                                    flexShrink: 0
                                  }}
                                >
                                  <Plus size={12} />
                                </motion.button>
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => updateExtraQuantity(extra.id, selectedExtra.quantity - 1, true)}
                                    style={{
                                      width: '20px',
                                      height: '20px',
                                      borderRadius: '4px',
                                      border: '1px solid #ddd',
                                      background: 'white',
                                      color: '#333',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '10px'
                                    }}
                                  >
                                    <Minus size={10} />
                                  </motion.button>
                                  <span style={{ fontSize: '12px', minWidth: '16px', textAlign: 'center' }}>
                                    {selectedExtra.quantity}
                                  </span>
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => updateExtraQuantity(extra.id, selectedExtra.quantity + 1, true)}
                                    style={{
                                      width: '20px',
                                      height: '20px',
                                      borderRadius: '4px',
                                      border: '1px solid #ddd',
                                      background: 'white',
                                      color: '#333',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '10px'
                                    }}
                                  >
                                    <Plus size={10} />
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => removeExtra(extra.id, true)}
                                    style={{
                                      width: '20px',
                                      height: '20px',
                                      borderRadius: '4px',
                                      border: 'none',
                                      background: '#ff4757',
                                      color: 'white',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '10px'
                                    }}
                                  >
                                    <X size={10} />
                                  </motion.button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Beverages Section - Always show */}
                {!isLoadingExtras && availableBeverages.length > 0 && (
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ margin: '0 0 12px 0', color: '#333', fontSize: '16px', fontWeight: '600' }}>
                      Aggiungi Bevande:
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      {availableBeverages.map(beverage => {
                        const selectedBeverage = selectedBeverages.find(item => item.id === beverage.id);
                        return (
                          <div
                            key={beverage.id}
                            style={{
                              border: '1px solid #ddd',
                              borderRadius: '8px',
                              padding: '12px',
                              transition: 'background-color 0.2s'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                              <div style={{ flex: 1 }}>
                                <h5 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                                  {beverage.name}
                                </h5>
                                {beverage.description && (
                                  <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#888' }}>
                                    {beverage.description}
                                  </p>
                                )}
                                <p style={{ margin: '0', fontSize: '14px', fontWeight: '600', color: '#3b82f6' }}>
                                  +€{beverage.price.toFixed(2)}
                                </p>
                              </div>
                              {!selectedBeverage ? (
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => addExtra(beverage, false)}
                                  style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    border: 'none',
                                    background: '#2ed573',
                                    color: 'white',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '12px',
                                    flexShrink: 0
                                  }}
                                >
                                  <Plus size={12} />
                                </motion.button>
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => updateExtraQuantity(beverage.id, selectedBeverage.quantity - 1, false)}
                                    style={{
                                      width: '20px',
                                      height: '20px',
                                      borderRadius: '4px',
                                      border: '1px solid #ddd',
                                      background: 'white',
                                      color: '#333',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '10px'
                                    }}
                                  >
                                    <Minus size={10} />
                                  </motion.button>
                                  <span style={{ fontSize: '12px', minWidth: '16px', textAlign: 'center' }}>
                                    {selectedBeverage.quantity}
                                  </span>
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => updateExtraQuantity(beverage.id, selectedBeverage.quantity + 1, false)}
                                    style={{
                                      width: '20px',
                                      height: '20px',
                                      borderRadius: '4px',
                                      border: '1px solid #ddd',
                                      background: 'white',
                                      color: '#333',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '10px'
                                    }}
                                  >
                                    <Plus size={10} />
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => removeExtra(beverage.id, false)}
                                    style={{
                                      width: '20px',
                                      height: '20px',
                                      borderRadius: '4px',
                                      border: 'none',
                                      background: '#ff4757',
                                      color: 'white',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '10px'
                                    }}
                                  >
                                    <X size={10} />
                                  </motion.button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Special Requests */}
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ margin: '0 0 12px 0', color: '#333', fontSize: '16px', fontWeight: '600' }}>
                    Richieste Speciali:
                  </h3>
                  <textarea
                    placeholder="Aggiungi note speciali per la preparazione..."
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    style={{
                      width: '100%',
                      minHeight: '80px',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #ddd',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                  />
                </div>

                {/* Selected Items Summary */}
                {[...selectedExtras, ...selectedBeverages].length > 0 && (
                  <div style={{ background: '#e0f2fe', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                      Aggiunte selezionate:
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {[...selectedExtras, ...selectedBeverages].map(item => (
                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#555' }}>
                          <span>{item.name} x{item.quantity}</span>
                          <span>+€{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Total and Add to Cart */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid #ddd' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
                    Totale: €{calculateTotalPrice().toFixed(2)}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAddToCart}
                    style={{
                      background: '#22c55e',
                      color: 'white',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <ShoppingCart size={16} />
                    Aggiungi al Carrello
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </AnimatePresence>
    </motion.div>
  );
};

export default MenuPage;
