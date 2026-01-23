
-- 1. Create Offer Categories
INSERT INTO offer_categories (name, display_order, is_active)
VALUES
    ('Hamburgers', 2, true),
    ('Tacos', 3, true)
ON CONFLICT DO NOTHING;

-- 2. Create Extra Categories (Salse, Variazioni, Bibite)
-- We need to check if 'Bibite' exists as a main category or create it.
-- Based on previous search, no 'Bevande' or 'Drink' found. Creating one.
INSERT INTO categories (name, slug, is_active, is_extra_group)
VALUES 
    ('Bibite', 'bibite', true, true),
    ('Salse', 'salse', true, true),
    ('Aggiunte', 'aggiunte', true, true)
ON CONFLICT (slug) DO UPDATE SET is_extra_group = true;

-- 3. Create Products for Extras
-- Get Category IDs first
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
    
    -- Offer IDs
    offer_n4_id UUID;
    offer_n6_id UUID;
    offer_n9_id UUID;
    offer_n20_id UUID;
BEGIN
    -- Get or Create IDs for Extra Categories
    SELECT id INTO cat_bibite_id FROM categories WHERE slug = 'bibite';
    SELECT id INTO cat_salse_id FROM categories WHERE slug = 'salse';
    SELECT id INTO cat_aggiunte_id FROM categories WHERE slug = 'aggiunte';

    -- Insert Salse
    INSERT INTO products (name, price, category_id, is_active) VALUES
    ('Salsa Yogurt', 1.00, cat_salse_id, true),
    ('Salsa Piccante', 1.00, cat_salse_id, true),
    ('Salsa Algerienne', 1.00, cat_salse_id, true),
    ('Salsa Samurai', 1.00, cat_salse_id, true),
    ('Salsa Marocchina', 1.00, cat_salse_id, true),
    ('Salsa Burger', 1.00, cat_salse_id, true),
    ('Salsa Barbecue', 1.00, cat_salse_id, true),
    ('Salsa Rosa', 1.00, cat_salse_id, true),
    ('Ketchup', 1.00, cat_salse_id, true),
    ('Maionese', 1.00, cat_salse_id, true)
    ON CONFLICT DO NOTHING;

    -- Insert Aggiunte
    INSERT INTO products (name, price, category_id, is_active) VALUES
    ('Cheddar', 1.00, cat_aggiunte_id, true),
    ('Supplemento Pollo', 1.00, cat_aggiunte_id, true)
    ON CONFLICT DO NOTHING;

    -- Insert Bibite (Placeholders if empty)
    INSERT INTO products (name, price, category_id, is_active) VALUES
    ('Coca Cola 33cl', 2.00, cat_bibite_id, true),
    ('Fanta 33cl', 2.00, cat_bibite_id, true),
    ('Sprite 33cl', 2.00, cat_bibite_id, true),
    ('Acqua Naturale 50cl', 1.00, cat_bibite_id, true),
    ('Acqua Frizzante 50cl', 1.00, cat_bibite_id, true)
    ON CONFLICT DO NOTHING;

    -- Get Offer Category IDs (assuming names match what we inserted or existing)
    -- Existing: 'nuggets ', 'Taccus' (we should use Tacos now?), 'Patatine', 'salva 1 euro', 'menu studente ', 'Vaschette carne'
    -- Note: Previous search showed 'nuggets ' (with space), 'Taccus', 'menu studente ', 'salva 1 euro'.
    -- We will try to match loosely or use the new ones.
    
    SELECT id INTO cat_nuggets_id FROM offer_categories WHERE name ILIKE 'nuggets%' LIMIT 1;
    SELECT id INTO cat_tacos_id FROM offer_categories WHERE name ILIKE 'Tacos%' OR name ILIKE 'Taccus%' LIMIT 1;
    SELECT id INTO cat_hamburgers_id FROM offer_categories WHERE name ILIKE 'Hamburgers%' LIMIT 1;
    SELECT id INTO cat_patatine_id FROM offer_categories WHERE name ILIKE 'Patatine%' LIMIT 1;
    SELECT id INTO cat_salva_id FROM offer_categories WHERE name ILIKE 'salva 1 euro%' LIMIT 1;
    SELECT id INTO cat_studenti_id FROM offer_categories WHERE name ILIKE 'menu studen%' LIMIT 1;
    SELECT id INTO cat_vaschette_id FROM offer_categories WHERE name ILIKE 'Vaschette%' LIMIT 1;

    -- 4. Insert Special Offers (with Slugs)
    
    -- NUGGETS
    INSERT INTO special_offers (title, slug, description, price, discount_value, discount_type, category_id, is_active, extras_enabled, enabled_extra_categories) VALUES
    ('4 Nuggets', '4-nuggets', '4 deliziosi nuggets di pollo dorati', 2.50, 0, 'fixed', cat_nuggets_id, true, true, ARRAY[cat_salse_id]),
    ('6 Nuggets', '6-nuggets', '6 deliziosi nuggets di pollo dorati', 3.00, 0, 'fixed', cat_nuggets_id, true, true, ARRAY[cat_salse_id]),
    ('9 Nuggets', '9-nuggets', '9 deliziosi nuggets di pollo dorati', 4.00, 0, 'fixed', cat_nuggets_id, true, true, ARRAY[cat_salse_id]),
    ('20 Nuggets', '20-nuggets', '20 deliziosi nuggets di pollo dorati per condividere', 8.00, 0, 'fixed', cat_nuggets_id, true, true, ARRAY[cat_salse_id]);

    -- TACOS
    INSERT INTO special_offers (title, slug, description, price, discount_value, discount_type, category_id, is_active, extras_enabled, enabled_extra_categories) VALUES
    ('Menu Tacos', 'menu-tacos', 'Tacos con bibita lattina e patatine', 9.00, 0, 'fixed', cat_tacos_id, true, true, ARRAY[cat_bibite_id, cat_salse_id, cat_aggiunte_id]),
    ('Menu Tacos XL', 'menu-tacos-xl', 'Tacos con bibita lattina, patatine e 6 nuggets', 11.50, 0, 'fixed', cat_tacos_id, true, true, ARRAY[cat_bibite_id, cat_salse_id, cat_aggiunte_id]),
    ('Menu Coppia Tacos', 'menu-coppia-tacos', '2 Tacos, 2 patatine, 2 bibite e 4 baklava', 18.00, 0, 'fixed', cat_tacos_id, true, true, ARRAY[cat_bibite_id, cat_salse_id, cat_aggiunte_id]);

    -- HAMBURGERS
    INSERT INTO special_offers (title, slug, description, price, discount_value, discount_type, category_id, is_active, extras_enabled, enabled_extra_categories) VALUES
    ('Menu Double Burger', 'menu-double-burger', 'Doppio hamburger, patatine, bibita e 6 nuggets', 10.00, 0, 'fixed', cat_hamburgers_id, true, true, ARRAY[cat_bibite_id, cat_salse_id, cat_aggiunte_id]);

    -- PATATINE
    INSERT INTO special_offers (title, slug, description, price, discount_value, discount_type, category_id, is_active, extras_enabled, enabled_extra_categories) VALUES
    ('Patatine Medie', 'patatine-medie', 'Porzione media di patatine fritte', 3.00, 0, 'fixed', cat_patatine_id, true, true, ARRAY[cat_salse_id, cat_aggiunte_id]),
    ('Patatine Grandi', 'patatine-grandi', 'Porzione grande di patatine fritte', 5.00, 0, 'fixed', cat_patatine_id, true, true, ARRAY[cat_salse_id, cat_aggiunte_id]),
    ('Patatine Cheddar', 'patatine-cheddar', 'Patatine fritte con fonduta di cheddar', 4.00, 0, 'fixed', cat_patatine_id, true, true, ARRAY[cat_salse_id, cat_aggiunte_id]);

    -- SALVA 1 EURO
    INSERT INTO special_offers (title, slug, description, price, discount_value, discount_type, category_id, is_active, extras_enabled, enabled_extra_categories) VALUES
    ('Box Merenda', 'box-merenda', '4 Chicken Nuggets O 4 Alette con 4 Baklava', 3.50, 0, 'fixed', cat_salva_id, true, true, ARRAY[cat_salse_id]),
    ('Hotdog', 'hotdog', 'Panino con wurstel', 1.50, 0, 'fixed', cat_salva_id, true, true, ARRAY[cat_salse_id, cat_aggiunte_id]),
    ('Mini Kebap Fritto', 'mini-kebap-fritto', 'Mini kebap fritto croccante', 1.50, 0, 'fixed', cat_salva_id, true, true, ARRAY[cat_salse_id]),
    ('Trancio Margherita', 'trancio-margherita', 'Trancio di pizza margherita', 2.00, 0, 'fixed', cat_salva_id, true, false, null),
    ('Trancio Marinara', 'trancio-marinara', 'Trancio di pizza marinara', 1.50, 0, 'fixed', cat_salva_id, true, false, null);

    -- MENU STUDENTI
    INSERT INTO special_offers (title, slug, description, price, discount_value, discount_type, category_id, is_active, extras_enabled, enabled_extra_categories) VALUES
    ('Menu Studente', 'menu-studente', '1 Arrotolato/Panino + Bibita + Patatine (Supplemento Pollo +1€)', 7.50, 0, 'fixed', cat_studenti_id, true, true, ARRAY[cat_bibite_id, cat_salse_id, cat_aggiunte_id]);

    -- VASCHETTE CARNE
    INSERT INTO special_offers (title, slug, description, price, discount_value, discount_type, category_id, is_active, extras_enabled, enabled_extra_categories) VALUES
    ('Box Misto', 'box-misto', '6 Nuggets + 6 Alette + 6 Crocchette di patate', 8.00, 0, 'fixed', cat_vaschette_id, true, true, ARRAY[cat_salse_id]);

END $$;
