import { createClient } from '@supabase/supabase-js';

// Database configuration
// Prioritize environment variables, fallback to hardcoded values for development if env is missing
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://crhmtzrnahdpgrpmxmjk.supabase.co';
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyaG10enJuYWhkcGdycG14bWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxMTk2NDYsImV4cCI6MjA4NDY5NTY0Nn0.Ig3jcGDMMVmOlSIp3G3Zy6sD-78mOYlpfIlc51ml2-k';

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
  coming_soon: boolean | null;
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
  coming_soon: boolean | null;
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

export interface OfferCategory {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  display_order: number | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface Offer {
  id: string;
  slug?: string | null;
  category_id?: string | null; // Added relation
  title: string;
  description: string | null;
  price: number;
  discount_value?: number;
  discount_type?: 'percentage' | 'fixed' | 'bogo' | 'free_delivery';
  valid_until?: string;
  is_active: boolean;
  minimum_order?: number;
  usage_limit?: number;
  used_count?: number;
  verification_code?: string;
  qr_code_data?: string;
  image_url?: string;
  display_order?: number;
  available_for_lunch?: boolean;
  available_for_dinner?: boolean;
  extras_enabled?: boolean; // Added this field
  are_extras_chargeable?: boolean; // Added this field
  enabled_extra_categories?: string[]; // Array of Category IDs
}

export interface ExtraCategory {
  id: string;
  name: string;
  is_extra_group: boolean;
  sort_order?: number;
}


export interface ExtraProduct {
  id: string;
  name: string;
  price: number;
  category_id: string;
  is_active: boolean;
}

// NEW: App Settings Interface
export interface AppSettings {
  id: string;
  setting_key: string;
  background_image_url: string | null;
  background_music_url: string | null;
  created_at: string;
  updated_at: string;
}
