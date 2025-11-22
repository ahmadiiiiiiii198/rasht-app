import { useState, useEffect } from 'react';

export interface Extra {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
  extras?: Extra[];
  beverages?: Extra[];
  specialRequests?: string;
}

export const useCart = () => {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount and listen for changes
  useEffect(() => {
    const loadCart = () => {
      const savedCart = localStorage.getItem('efes_cart');
      console.log('📦 loadCart called, localStorage has:', savedCart ? JSON.parse(savedCart).length + ' items' : '0 items');
      if (savedCart) {
        try {
          const parsed = JSON.parse(savedCart);
          console.log('✅ Loaded from localStorage:', parsed);
          setItems(parsed);
        } catch (error) {
          console.error('Error loading cart:', error);
        }
      }
    };

    // Initial load
    console.log('🚀 useCart hook mounted, loading initial cart');
    loadCart();

    // Listen for custom cart update events
    const handleCartUpdate = () => {
      console.log('🔔 cartUpdated event received in useCart hook');
      loadCart();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    console.log('👂 useCart hook listening for cartUpdated event');

    // Also listen for storage events (from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'efes_cart') {
        loadCart();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Helper to save cart
  const saveCart = (newItems: CartItem[]) => {
    setItems(newItems);
    localStorage.setItem('efes_cart', JSON.stringify(newItems));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const addItem = (item: CartItem) => {
    const newItems = [...items, item];
    saveCart(newItems);
  };

  const removeItem = (itemId: string) => {
    const newItems = items.filter(item => item.id !== itemId);
    saveCart(newItems);
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    const newItems = items.map(item =>
      item.id === itemId ? { ...item, quantity } : item
    );
    saveCart(newItems);
  };

  const updateSpecialRequests = (itemId: string, specialRequests: string) => {
    const newItems = items.map(item =>
      item.id === itemId ? { ...item, specialRequests } : item
    );
    saveCart(newItems);
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem('efes_cart');
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const getTotalItems = () => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return items.reduce((sum, item) => {
      let itemTotal = item.price * item.quantity;

      // Add extras cost
      if (item.extras && item.extras.length > 0) {
        itemTotal += item.extras.reduce((extrasSum, extra) =>
          extrasSum + (extra.price * extra.quantity), 0
        );
      }

      // Add beverages cost
      if (item.beverages && item.beverages.length > 0) {
        itemTotal += item.beverages.reduce((beveragesSum, beverage) =>
          beveragesSum + (beverage.price * beverage.quantity), 0
        );
      }

      return sum + itemTotal;
    }, 0);
  };

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    updateSpecialRequests,
    clearCart,
    getTotalItems,
    getTotalPrice
  };
};
