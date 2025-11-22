import { createClient } from '@supabase/supabase-js';

// Database configuration from the main project
const SUPABASE_URL = 'https://hnoadcbppldmawognwdx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhub2FkY2JwcGxkbWF3b2dud2R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0ODgwMjEsImV4cCI6MjA3MjA2NDAyMX0.cMQBW7VFcWFdVsXY-0H0PaLRDSY13jicT4lPGh9Pmlo';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

// Database types - CORRECTED to match actual schema
export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category_id: string | null;
  ingredients: string[] | null;
  allergens: string[] | null;
  is_vegetarian: boolean | null;
  is_vegan: boolean | null;
  is_gluten_free: boolean | null;
  is_active: boolean | null;
  is_featured: boolean | null;
  preparation_time: number | null;
  calories: number | null;
  compare_price: number | null;
  gallery: any | null; // Json type
  labels: string[] | null;
  meta_description: string | null;
  meta_title: string | null;
  slug: string | null;
  sort_order: number | null;
  stock_quantity: number | null;
  created_at: string;
  updated_at: string;
  // NEW FIELDS found in real database
  max_uses_per_user: number | null;
  cooldown_hours: number | null;
  uses_limit_enabled: boolean | null;
  cooldown_enabled: boolean | null;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  slug: string;
  is_active: boolean | null;
  sort_order: number | null;
  labels: any | null; // Json type
  created_at: string;
  updated_at: string;
  // NEW FIELD found in real database
  extras_enabled: boolean | null;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_address: string | null;
  total_amount: number;
  status: string | null;
  order_status: string | null;
  payment_status: string | null;
  delivery_type: string | null;
  created_at: string;
  estimated_delivery_time: string | null;
  billing_address: any | null; // Json type
  delivery_fee: number | null;
  delivered_at: string | null;
  notes: string | null;
  order_type: string | null;
  paid_amount: number | null;
  paid_at: string | null;
  payment_method: string | null;
  shipped_at: string | null;
  shipping_address: any | null; // Json type
  special_instructions: string | null;
  stripe_payment_intent_id: string | null;
  stripe_session_id: string | null;
  tracking_number: string | null;
  updated_at: string;
  user_id: string | null;
  metadata: any | null; // Json type
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number | null; // Actually nullable in schema
  subtotal: number;
  special_requests: string | null;
  size: string | null;
  toppings: string[] | null;
  created_at: string;
  product_price: number;
  unit_price: number | null;
  metadata: any | null; // Json type
}

export interface Comment {
  id: string;
  customer_name: string;
  customer_email: string | null;
  rating: number | null;
  comment_text: string;
  is_approved: boolean | null;
  is_active: boolean | null;
  created_at: string;
}

export interface SiteContent {
  id: string;
  section: string;
  title: string | null;
  subtitle: string | null;
  content: string | null;
  image_url: string | null;
  is_active: boolean | null;
  additional_data: any | null; // Json type
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  default_address: string | null;
  preferences: any | null; // Json type
  created_at: string;
  updated_at: string;
}
