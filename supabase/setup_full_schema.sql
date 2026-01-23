-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles (linked to auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  default_address TEXT,
  preferences JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Site Content
CREATE TABLE IF NOT EXISTS site_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section TEXT NOT NULL,
  title TEXT,
  subtitle TEXT,
  content TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  additional_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Core Categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  slug TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER,
  labels JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_extra_group BOOLEAN DEFAULT false,
  extras_enabled BOOLEAN DEFAULT false
);

-- 4. Products
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  ingredients TEXT[],
  allergens TEXT[],
  is_vegetarian BOOLEAN DEFAULT false,
  is_vegan BOOLEAN DEFAULT false,
  is_gluten_free BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  preparation_time INTEGER,
  calories INTEGER,
  compare_price DECIMAL(10,2),
  gallery JSONB,
  labels TEXT[],
  meta_description TEXT,
  meta_title TEXT,
  slug TEXT UNIQUE,
  sort_order INTEGER,
  stock_quantity INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  max_uses_per_user INTEGER,
  cooldown_hours INTEGER,
  uses_limit_enabled BOOLEAN,
  cooldown_enabled BOOLEAN
);

-- 5. Offer Categories
CREATE TABLE IF NOT EXISTS offer_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  display_order INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Special Offers (Offers)
CREATE TABLE IF NOT EXISTS special_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES offer_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  discount_value DECIMAL(10,2),
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed', 'bogo', 'free_delivery')),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  minimum_order DECIMAL(10,2),
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  verification_code TEXT,
  qr_code_data TEXT,
  image_url TEXT,
  display_order INTEGER,
  available_for_lunch BOOLEAN,
  available_for_dinner BOOLEAN,
  extras_enabled BOOLEAN DEFAULT false,
  are_extras_chargeable BOOLEAN DEFAULT true,
  enabled_extra_categories UUID[], -- Array of UUIDs from categories table (where is_extra_group=true)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  customer_address TEXT,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT,
  order_status TEXT,
  payment_status TEXT,
  delivery_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  estimated_delivery_time TIMESTAMPTZ,
  billing_address JSONB,
  delivery_fee DECIMAL(10,2),
  delivered_at TIMESTAMPTZ,
  notes TEXT,
  order_type TEXT,
  paid_amount DECIMAL(10,2),
  paid_at TIMESTAMPTZ,
  payment_method TEXT,
  shipped_at TIMESTAMPTZ,
  shipping_address JSONB,
  special_instructions TEXT,
  stripe_payment_intent_id TEXT,
  stripe_session_id TEXT,
  tracking_number TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB
);

-- 8. Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID, -- Can be product or offer ID, kept loose or needs logic
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2),
  subtotal DECIMAL(10,2) NOT NULL,
  special_requests TEXT,
  size TEXT,
  toppings TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  product_price DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(10,2),
  metadata JSONB
);

-- 9. Comments
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  rating INTEGER,
  comment_text TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Extra Categories & Products for separate management if needed
-- (Though the migration used 'categories' and 'products' with flags, we'll stick to that pattern as defined above: is_extra_group)

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Create basic policies (Public Read for content, User access for own data)
-- Site Content: Public Read
CREATE POLICY "Public read site_content" ON site_content FOR SELECT USING (true);

-- Categories/Products/Offers: Public Read
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read products" ON products FOR SELECT USING (true);
CREATE POLICY "Public read offer_categories" ON offer_categories FOR SELECT USING (true);
CREATE POLICY "Public read special_offers" ON special_offers FOR SELECT USING (true);

-- Comments: Public Read Approved, Insert Public
CREATE POLICY "Public read approved comments" ON comments FOR SELECT USING (is_active = true AND is_approved = true);
CREATE POLICY "Public insert comments" ON comments FOR INSERT WITH CHECK (true);

-- User Profiles: Read/Update Own
CREATE POLICY "Users can see own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);

-- Orders: Users can see own orders. Public insert (for guest checkout) needs care.
-- Allowing public insert for demo/guest checkout scenarios
CREATE POLICY "Public insert orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Users read own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
-- Order Items: Linked to valid orders
CREATE POLICY "Public insert order_items" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Users read own order items" ON order_items FOR SELECT USING (
  exists (select 1 from orders where orders.id = order_items.order_id and orders.user_id = auth.uid())
);
