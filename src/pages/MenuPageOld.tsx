import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, ShoppingCart, ChevronDown } from 'lucide-react';
import { getProducts, getCategories, Product, Category } from '../lib/database';

interface ProductOption {
  size?: string;
  toppings: string[];
}

const MenuPage: React.FC = () => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<{[key: string]: number}>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productOptions, setProductOptions] = useState<ProductOption>({
    size: undefined,
    toppings: []
  });
  const [showOptionsModal, setShowOptionsModal] = useState(false);

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

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setProductOptions({ size: undefined, toppings: [] });
    setShowOptionsModal(true);
  };

  const handleAddToCartWithOptions = () => {
    if (!selectedProduct) return;

    setCart(prev => ({
      ...prev,
      [selectedProduct.id]: (prev[selectedProduct.id] || 0) + 1
    }));

    // Add to persistent cart with options
    const savedCart = localStorage.getItem('efes_cart');
    let cartItems = [];
    
    try {
      cartItems = savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error('Error loading cart:', error);
      cartItems = [];
    }

    const existingItem = cartItems.find((item: any) => item.id === selectedProduct.id);
    if (existingItem) {
      existingItem.quantity += 1;
      if (productOptions.size) existingItem.size = productOptions.size;
      if (productOptions.toppings.length > 0) existingItem.toppings = productOptions.toppings;
    } else {
      cartItems.push({
        id: selectedProduct.id,
        name: selectedProduct.name,
        price: selectedProduct.price,
        quantity: 1,
        image_url: selectedProduct.image_url,
        size: productOptions.size,
        toppings: productOptions.toppings
      });
    }

    localStorage.setItem('efes_cart', JSON.stringify(cartItems));
    setShowOptionsModal(false);
  };

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
      style={{ padding: '20px', height: '100%', overflow: 'auto', marginBottom: '100px' }}
    >
      {/* Accordion Categories */}
      <motion.div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <AnimatePresence>
          {categories.map((category) => {
            const categoryProducts = products.filter(p => p.category_id === category.id);
            const isExpanded = expandedCategory === category.id;
            
            return (
              <motion.div key={category.id}>
                {/* Category Header */}
                <motion.button
                  onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
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
                                €{typeof item.price === 'number' ? item.price.toFixed(2) : '0.00'}
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
              bottom: '20px',
              left: '20px',
              right: '20px',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              borderRadius: '20px',
              padding: '20px',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
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

        {/* Product Options Modal */}
        <AnimatePresence>
          {showOptionsModal && selectedProduct && (
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
              onClick={() => setShowOptionsModal(false)}
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
                <h2 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '24px' }}>
                  {selectedProduct.name}
                </h2>

                {selectedProduct.image_url && (
                  <img
                    src={selectedProduct.image_url}
                    alt={selectedProduct.name}
                    style={{
                      width: '100%',
                      height: '200px',
                      borderRadius: '12px',
                      objectFit: 'cover',
                      marginBottom: '20px'
                    }}
                  />
                )}

                {selectedProduct.description && (
                  <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
                    {selectedProduct.description}
                  </p>
                )}

                {/* Size Options */}
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ color: '#333', marginBottom: '10px', fontSize: '16px' }}>Size</h3>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {['Small', 'Medium', 'Large'].map(size => (
                      <motion.button
                        key={size}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setProductOptions({ ...productOptions, size })}
                        style={{
                          padding: '10px 20px',
                          borderRadius: '8px',
                          border: productOptions.size === size ? '2px solid #d4af37' : '2px solid #ddd',
                          background: productOptions.size === size ? '#d4af37' : 'white',
                          color: productOptions.size === size ? 'white' : '#333',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '14px'
                        }}
                      >
                        {size}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Toppings Options */}
                <div style={{ marginBottom: '30px' }}>
                  <h3 style={{ color: '#333', marginBottom: '10px', fontSize: '16px' }}>Toppings</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {['Cheese', 'Pepperoni', 'Mushrooms', 'Onions', 'Olives', 'Tomatoes'].map(topping => (
                      <motion.label
                        key={topping}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px',
                          borderRadius: '8px',
                          background: productOptions.toppings.includes(topping) ? '#f0f0f0' : 'transparent',
                          cursor: 'pointer'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={productOptions.toppings.includes(topping)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setProductOptions({
                                ...productOptions,
                                toppings: [...productOptions.toppings, topping]
                              });
                            } else {
                              setProductOptions({
                                ...productOptions,
                                toppings: productOptions.toppings.filter(t => t !== topping)
                              });
                            }
                          }}
                          style={{ cursor: 'pointer' }}
                        />
                        <span style={{ color: '#333', fontSize: '14px' }}>{topping}</span>
                      </motion.label>
                    ))}
                  </div>
                </div>

                {/* Price and Add to Cart */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#FF6B6B',
                    flex: 1
                  }}>
                    €{typeof selectedProduct.price === 'number' ? selectedProduct.price.toFixed(2) : '0.00'}
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAddToCartWithOptions}
                    style={{
                      background: '#2ed573',
                      color: 'white',
                      border: 'none',
                      padding: '12px 30px',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    Add to Cart
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
