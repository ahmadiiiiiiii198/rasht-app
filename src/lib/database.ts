import { supabase, Product, Category, Order, OrderItem } from './supabase';

export type { Product, Category, Order, OrderItem };

// Products service
export const getProducts = async (categoryId?: string): Promise<Product[]> => {
  try {
    let query = supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('❌ Error fetching products:', error);
      return [];
    }
    
    console.log('✅ getProducts returned:', data?.length || 0, 'products');
    if (data && data.length > 0) {
      console.log('First product:', data[0]);
    }
    return data || [];
  } catch (error) {
    console.error('❌ Exception in getProducts:', error);
    return [];
  }
};

// Categories service
export const getCategories = async (): Promise<Category[]> => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    
    if (error) {
      console.error('❌ Error fetching categories:', error);
      return [];
    }
    
    console.log('✅ getCategories returned:', data?.length || 0, 'categories');
    if (data && data.length > 0) {
      console.log('First category:', data[0]);
    }
    return data || [];
  } catch (error) {
    console.error('❌ Exception in getCategories:', error);
    return [];
  }
};

// Featured products
export const getFeaturedProducts = async (): Promise<Product[]> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .eq('is_featured', true)
      .order('sort_order', { ascending: true })
      .limit(6);
    
    if (error) {
      console.error('Error fetching featured products:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return [];
  }
};

// Orders service - get user orders
export const getUserOrders = async (customerEmail: string): Promise<Order[]> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_email', customerEmail)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
};

// Get order items for a specific order
export const getOrderItems = async (orderId: string): Promise<OrderItem[]> => {
  try {
    const { data, error } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);
    
    if (error) {
      console.error('Error fetching order items:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching order items:', error);
    return [];
  }
};

// Create new order
export interface CreateOrderData {
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_address?: string;
  total_amount?: number;
  delivery_fee?: number;
  delivery_type?: string;
  payment_method?: string; // Added payment_method
  special_instructions?: string;
  items: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    price: number;
    special_requests?: string;
    size?: string;
    toppings?: string[];
  }>;
}

export const createOrder = async (orderData: CreateOrderData): Promise<string | null> => {
  try {
    // Generate order number
    const orderNumber = `ORD-${Date.now()}`;
    
    // Calculate total from items
    const itemsTotal = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const finalTotal = typeof orderData.total_amount === 'number' ? orderData.total_amount : itemsTotal;
    const deliveryFee = typeof orderData.delivery_fee === 'number'
      ? orderData.delivery_fee
      : Math.max(finalTotal - itemsTotal, 0);
    
    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_name: orderData.customer_name,
        customer_email: orderData.customer_email,
        customer_phone: orderData.customer_phone,
        customer_address: orderData.customer_address,
        total_amount: finalTotal,
        delivery_fee: deliveryFee,
        delivery_type: orderData.delivery_type || 'delivery',
        payment_method: orderData.payment_method || 'cash', // Default to cash if not provided
        special_instructions: orderData.special_instructions,
        status: 'pending',
        order_status: 'pending',
        payment_status: 'pending'
      })
      .select()
      .single();
    
    if (orderError || !order) {
      console.error('Error creating order:', orderError);
      return null;
    }
    
    // Create order items
    const orderItems = orderData.items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      product_price: item.price,
      unit_price: item.price,
      subtotal: item.price * item.quantity,
      special_requests: item.special_requests,
      size: item.size,
      toppings: item.toppings
    }));
    
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);
    
    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      // Could rollback order here if needed
    }
    
    return order.id;
  } catch (error) {
    console.error('Error creating order:', error);
    return null;
  }
};
