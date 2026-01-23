-- Seeding Initial Data

-- 1. Create Offer Categories
INSERT INTO offer_categories (name, display_order, is_active)
VALUES
    ('Hamburgers', 2, true),
    ('Tacos', 3, true),
    ('Patatine', 4, true),
    ('Nuggets', 1, true),
    ('Salva 1 Euro', 5, true),
    ('Menu Studente', 6, true),
    ('Vaschette', 7, true)
ON CONFLICT DO NOTHING;

-- 2. Create Extra Categories
INSERT INTO categories (name, slug, is_active, is_extra_group)
VALUES 
    ('Bibite', 'bibite', true, true),
    ('Salse', 'salse', true, true),
    ('Aggiunte', 'aggiunte', true, true)
ON CONFLICT (slug) DO UPDATE SET is_extra_group = true;

-- 3. Create Products for Extras
DO $$
DECLARE
    cat_bibite_id UUID;
    cat_salse_id UUID;
    cat_aggiunte_id UUID;
    
    cat_nuggets_id UUID;
    cat_tacos_id UUID;
    cat_hamburgers_id UUID;
    cat_patatine_id UUID;
    cat_salva_id UUID;
    cat_studenti_id UUID;
    cat_vaschette_id UUID;
BEGIN
    -- Get or Create IDs for Extra Categories
    SELECT id INTO cat_bibite_id FROM categories WHERE slug = 'bibite';
    SELECT id INTO cat_salse_id FROM categories WHERE slug = 'salse';
    SELECT id INTO cat_aggiunte_id FROM categories WHERE slug = 'aggiunte';

    -- Insert Salse
    INSERT INTO products (name, price, category_id, is_active) VALUES
    ('Salsa Yogurt', 0.50, cat_salse_id, true),
    ('Salsa Piccante', 0.50, cat_salse_id, true),
    ('Salsa Algerienne', 0.50, cat_salse_id, true),
    ('Salsa Samurai', 0.50, cat_salse_id, true),
    ('Salsa Marocchina', 0.50, cat_salse_id, true),
    ('Salsa Burger', 0.50, cat_salse_id, true),
    ('Salsa Barbecue', 0.50, cat_salse_id, true),
    ('Salsa Rosa', 0.50, cat_salse_id, true),
    ('Ketchup', 0.50, cat_salse_id, true),
    ('Maionese', 0.50, cat_salse_id, true)
    ON CONFLICT DO NOTHING;

    -- Insert Aggiunte
    INSERT INTO products (name, price, category_id, is_active) VALUES
    ('Cheddar', 1.00, cat_aggiunte_id, true),
    ('Supplemento Pollo', 1.00, cat_aggiunte_id, true)
    ON CONFLICT DO NOTHING;

    -- Insert Bibite
    INSERT INTO products (name, price, category_id, is_active) VALUES
    ('Coca Cola 33cl', 2.00, cat_bibite_id, true),
    ('Fanta 33cl', 2.00, cat_bibite_id, true),
    ('Sprite 33cl', 2.00, cat_bibite_id, true),
    ('Acqua Naturale 50cl', 1.00, cat_bibite_id, true),
    ('Acqua Frizzante 50cl', 1.00, cat_bibite_id, true)
    ON CONFLICT DO NOTHING;

    -- Get Offer Category IDs
    SELECT id INTO cat_nuggets_id FROM offer_categories WHERE name ILIKE 'Nuggets%' LIMIT 1;
    SELECT id INTO cat_tacos_id FROM offer_categories WHERE name ILIKE 'Tacos%' LIMIT 1;
    SELECT id INTO cat_hamburgers_id FROM offer_categories WHERE name ILIKE 'Hamburgers%' LIMIT 1;
    SELECT id INTO cat_patatine_id FROM offer_categories WHERE name ILIKE 'Patatine%' LIMIT 1;
    SELECT id INTO cat_salva_id FROM offer_categories WHERE name ILIKE 'Salva%' LIMIT 1;
    SELECT id INTO cat_studenti_id FROM offer_categories WHERE name ILIKE 'Menu Studen%' LIMIT 1;
    SELECT id INTO cat_vaschette_id FROM offer_categories WHERE name ILIKE 'Vaschette%' LIMIT 1;

    -- 4. Insert Special Offers (with Slugs and Images)
    
    -- NUGGETS
    INSERT INTO special_offers (title, slug, description, price, discount_value, discount_type, category_id, is_active, extras_enabled, enabled_extra_categories, image_url) VALUES
    ('4 Nuggets', '4-nuggets', '4 deliziosi nuggets di pollo dorati', 2.50, 0, 'fixed', cat_nuggets_id, true, true, ARRAY[cat_salse_id], 'https://images.unsplash.com/photo-1562967963-ed7b6f968886?w=800&q=80'),
    ('6 Nuggets', '6-nuggets', '6 deliziosi nuggets di pollo dorati', 3.00, 0, 'fixed', cat_nuggets_id, true, true, ARRAY[cat_salse_id], 'https://images.unsplash.com/photo-1562967963-ed7b6f968886?w=800&q=80'),
    ('9 Nuggets', '9-nuggets', '9 deliziosi nuggets di pollo dorati', 4.00, 0, 'fixed', cat_nuggets_id, true, true, ARRAY[cat_salse_id], 'https://images.unsplash.com/photo-1562967963-ed7b6f968886?w=800&q=80'),
    ('20 Nuggets', '20-nuggets', '20 deliziosi nuggets di pollo dorati per condividere', 8.00, 0, 'fixed', cat_nuggets_id, true, true, ARRAY[cat_salse_id], 'https://images.unsplash.com/photo-1562967963-ed7b6f968886?w=800&q=80');

    -- TACOS
    INSERT INTO special_offers (title, slug, description, price, discount_value, discount_type, category_id, is_active, extras_enabled, enabled_extra_categories, image_url) VALUES
    ('Menu Tacos', 'menu-tacos', 'Tacos con bibita lattina e patatine', 9.00, 0, 'fixed', cat_tacos_id, true, true, ARRAY[cat_bibite_id, cat_salse_id, cat_aggiunte_id], 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&q=80'),
    ('Menu Tacos XL', 'menu-tacos-xl', 'Tacos con bibita lattina, patatine e 6 nuggets', 11.50, 0, 'fixed', cat_tacos_id, true, true, ARRAY[cat_bibite_id, cat_salse_id, cat_aggiunte_id], 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&q=80'),
    ('Menu Coppia Tacos', 'menu-coppia-tacos', '2 Tacos, 2 patatine, 2 bibite e 4 baklava', 18.00, 0, 'fixed', cat_tacos_id, true, true, ARRAY[cat_bibite_id, cat_salse_id, cat_aggiunte_id], 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80');

    -- HAMBURGERS
    INSERT INTO special_offers (title, slug, description, price, discount_value, discount_type, category_id, is_active, extras_enabled, enabled_extra_categories, image_url) VALUES
    ('Menu Double Burger', 'menu-double-burger', 'Doppio hamburger, patatine, bibita e 6 nuggets', 10.00, 0, 'fixed', cat_hamburgers_id, true, true, ARRAY[cat_bibite_id, cat_salse_id, cat_aggiunte_id], 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80');

    -- PATATINE
    INSERT INTO special_offers (title, slug, description, price, discount_value, discount_type, category_id, is_active, extras_enabled, enabled_extra_categories, image_url) VALUES
    ('Patatine Medie', 'patatine-medie', 'Porzione media di patatine fritte', 3.00, 0, 'fixed', cat_patatine_id, true, true, ARRAY[cat_salse_id, cat_aggiunte_id], 'https://images.unsplash.com/photo-1630384060421-a4323ceca041?w=800&q=80'),
    ('Patatine Grandi', 'patatine-grandi', 'Porzione grande di patatine fritte', 5.00, 0, 'fixed', cat_patatine_id, true, true, ARRAY[cat_salse_id, cat_aggiunte_id], 'https://images.unsplash.com/photo-1630384060421-a4323ceca041?w=800&q=80'),
    ('Patatine Cheddar', 'patatine-cheddar', 'Patatine fritte con fonduta di cheddar', 4.00, 0, 'fixed', cat_patatine_id, true, true, ARRAY[cat_salse_id, cat_aggiunte_id], 'https://images.unsplash.com/photo-1585109649139-366815a0d713?w=800&q=80');

    -- SALVA 1 EURO
    INSERT INTO special_offers (title, slug, description, price, discount_value, discount_type, category_id, is_active, extras_enabled, enabled_extra_categories, image_url) VALUES
    ('Box Merenda', 'box-merenda', '4 Chicken Nuggets O 4 Alette con 4 Baklava', 3.50, 0, 'fixed', cat_salva_id, true, true, ARRAY[cat_salse_id], 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&q=80'),
    ('Hotdog', 'hotdog', 'Panino con wurstel', 1.50, 0, 'fixed', cat_salva_id, true, true, ARRAY[cat_salse_id, cat_aggiunte_id], 'https://images.unsplash.com/photo-1612392062631-94dd858cba88?w=800&q=80'),
    ('Mini Kebap Fritto', 'mini-kebap-fritto', 'Mini kebap fritto croccante', 1.50, 0, 'fixed', cat_salva_id, true, true, ARRAY[cat_salse_id], 'https://images.unsplash.com/photo-1633321702518-7fe2bf4295fb?w=800&q=80'),
    ('Trancio Margherita', 'trancio-margherita', 'Trancio di pizza margherita', 2.00, 0, 'fixed', cat_salva_id, true, false, null, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80'),
    ('Trancio Marinara', 'trancio-marinara', 'Trancio di pizza marinara', 1.50, 0, 'fixed', cat_salva_id, true, false, null, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80');

    -- MENU STUDENTI
    INSERT INTO special_offers (title, slug, description, price, discount_value, discount_type, category_id, is_active, extras_enabled, enabled_extra_categories, image_url) VALUES
    ('Menu Studente', 'menu-studente', '1 Arrotolato/Panino + Bibita + Patatine (Supplemento Pollo +1€)', 7.50, 0, 'fixed', cat_studenti_id, true, true, ARRAY[cat_bibite_id, cat_salse_id, cat_aggiunte_id], 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80');

    -- VASCHETTE CARNE
    INSERT INTO special_offers (title, slug, description, price, discount_value, discount_type, category_id, is_active, extras_enabled, enabled_extra_categories, image_url) VALUES
    ('Box Misto', 'box-misto', '6 Nuggets + 6 Alette + 6 Crocchette di patate', 8.00, 0, 'fixed', cat_vaschette_id, true, true, ARRAY[cat_salse_id], 'https://images.unsplash.com/photo-1513639776629-7b611594e29b?w=800&q=80');

END $$;
