-- 1. Add Role and Loyalty Columns to User Profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'customer';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS loyalty_points INTEGER DEFAULT 0;

-- 2. Create Product Addons Configuration Table
-- This allows defining which categories (e.g. Toppings) or products are available as add-ons for a main product.
CREATE TABLE IF NOT EXISTS product_addons_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    addon_category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    addon_product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    is_free BOOLEAN DEFAULT false,
    price_modifier DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT target_check CHECK (addon_category_id IS NOT NULL OR addon_product_id IS NOT NULL)
);

-- 3. RLS Policies for Addons Config
ALTER TABLE product_addons_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Addons" ON product_addons_config;
CREATE POLICY "Public Read Addons" ON product_addons_config FOR SELECT USING (true);

DROP POLICY IF EXISTS "Auth Write Addons" ON product_addons_config;
CREATE POLICY "Auth Write Addons" ON product_addons_config FOR ALL USING (auth.role() = 'authenticated'); 

-- 4. Loyalty Points Trigger
-- Increments loyalty points when a new order is placed
CREATE OR REPLACE FUNCTION increment_loyalty_points() 
RETURNS TRIGGER AS $$
BEGIN
   IF NEW.user_id IS NOT NULL THEN
     UPDATE user_profiles 
     SET loyalty_points = COALESCE(loyalty_points, 0) + 1 
     WHERE id = NEW.user_id;
   END IF;
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_increment_loyalty ON orders;
CREATE TRIGGER tr_increment_loyalty 
AFTER INSERT ON orders 
FOR EACH ROW EXECUTE FUNCTION increment_loyalty_points();

-- 5. Storage Bucket for Menu Images (Attempt to create if permissions allow)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('menu_images', 'menu_images', true) 
ON CONFLICT (id) DO NOTHING;

-- Storage Policies (Safe Drop/Create)
DROP POLICY IF EXISTS "Public Select Menu Images" ON storage.objects;
CREATE POLICY "Public Select Menu Images" ON storage.objects FOR SELECT USING ( bucket_id = 'menu_images' );

DROP POLICY IF EXISTS "Auth Upload Menu Images" ON storage.objects;
CREATE POLICY "Auth Upload Menu Images" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'menu_images' AND auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Auth Update Menu Images" ON storage.objects;
CREATE POLICY "Auth Update Menu Images" ON storage.objects FOR UPDATE USING ( bucket_id = 'menu_images' AND auth.role() = 'authenticated' );
