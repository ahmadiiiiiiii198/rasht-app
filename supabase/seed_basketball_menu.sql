-- Seeding Basketball Menu Data

-- 1. Create Main Categories
INSERT INTO categories (name, slug, is_active, sort_order) VALUES
('Classiche', 'classiche', true, 1),
('M.V.P.', 'mvp', true, 2),
('Fritti', 'fritti', true, 3),
('Drinks', 'drinks', true, 4),
('Birre Artigianali', 'birre-artigianali', true, 5)
ON CONFLICT (slug) DO NOTHING;

-- 2. Create Extra Categories (for completeness if needed)
INSERT INTO categories (name, slug, is_active, is_extra_group) VALUES
('Variations', 'variations', true, true)
ON CONFLICT (slug) DO UPDATE SET is_extra_group = true;

-- 3. Insert Products
DO $$
DECLARE
    cat_classiche UUID;
    cat_mvp UUID;
    cat_fritti UUID;
    cat_drinks UUID;
    cat_birre_art UUID;
BEGIN
    SELECT id INTO cat_classiche FROM categories WHERE slug = 'classiche';
    SELECT id INTO cat_mvp FROM categories WHERE slug = 'mvp';
    SELECT id INTO cat_fritti FROM categories WHERE slug = 'fritti';
    SELECT id INTO cat_drinks FROM categories WHERE slug = 'drinks';
    SELECT id INTO cat_birre_art FROM categories WHERE slug = 'birre-artigianali';

    -- Classiche (Standard Pizzas - utilizing Jersey Image Protocol)
    -- Format: jersey://number/primaryColor
    
    INSERT INTO products (name, description, price, category_id, is_active, image_url, sort_order) VALUES
    ('1 Magic', 'Pomodoro, fior di latte, basilico', 6.00, cat_classiche, true, 'jersey://32/purple', 1),
    ('2 Bargnani', 'Pomodoro, fior di latte, bufala, basilico', 8.00, cat_classiche, true, 'jersey://77/red', 2),
    ('3 Ginobili', 'Fior di latte, gorgonzola, provola, toma, parmigiano, basilico', 9.00, cat_classiche, true, 'jersey://20/black', 3),
    ('4 Duncan', 'Pomodoro, fior di latte, cipolla, gorgonzola, guanciale, pecorino, basilico', 10.00, cat_classiche, true, 'jersey://21/black', 4),
    ('5 Iverson', 'Pomodoro, fior di latte, prosciutto, wurstel, salsiccia, spianata calabra, basilico', 9.00, cat_classiche, true, 'jersey://3/black', 5),
    ('6 Nowitzki', 'Pomodoro, fior di latte, patatine fritte, wurstel, basilico', 8.00, cat_classiche, true, 'jersey://41/blue', 6),
    ('7 Jokic', 'Scamorza, friarielli, salsiccia, basilico', 9.00, cat_classiche, true, 'jersey://15/navy', 7),
    ('8 Shaq', 'Pomodoro, fior di latte, spianata calabra, nduja, salsiccia, peperoni grigliati, basilico', 10.00, cat_classiche, true, 'jersey://34/yellow', 8),
    ('9 Datome', 'Pomodoro, fior di latte, porcini, prezzemolo, scaglie di grana, basilico', 10.00, cat_classiche, true, 'jersey://70/green', 9),
    ('10 Parker', 'Pomodoro, acciughe, olive, capperi, aglio, pomodorini, basilico', 8.00, cat_classiche, true, 'jersey://9/black', 10),
    ('11 Steve Nash', 'Pomodoro, patate lesse, porcini, rucola, basilico', 9.00, cat_classiche, true, 'jersey://13/orange', 11),
    ('12 Rodman', 'Fior di latte, gorgonzola, salsiccia, zucchine grigliate, basilico', 10.00, cat_classiche, true, 'jersey://91/red', 12),
    ('13 Kareem', 'Pomodoro, fior di latte, spianata calabra, basilico', 7.00, cat_classiche, true, 'jersey://33/yellow', 13),
    ('14 Steph Curry', 'Pomodoro, fior di latte, olive, spianata calabra, prosciutto, funghi, carciofi, basilico', 9.00, cat_classiche, true, 'jersey://30/blue', 14),
    ('15 Garnett', 'Pomodoro, fior di latte, melanzane, parmigiano, basilico', 8.00, cat_classiche, true, 'jersey://5/green', 15),
    ('16 Durant', 'Pomodoro, fior di latte, melanzane, zucchine, peperoni, friarielli, basilico', 9.00, cat_classiche, true, 'jersey://35/black', 16),
    ('17 Leonard', 'Pomodoro, salsiccia, burrata, pomodorini, pepe, basilico', 10.00, cat_classiche, true, 'jersey://2/silver', 17),
    ('18 Lillard', 'Pomodoro, pecorino, guanciale, burrata, pepe, basilico', 10.00, cat_classiche, true, 'jersey://0/red', 18),
    ('19 Gasol', 'Pomodoro, fior di latte, tonno, cipolla, basilico', 8.00, cat_classiche, true, 'jersey://16/yellow', 19),
    ('20 Harden', 'Fior di latte, rucola, prosciutto crudo, pomodorini, scaglie di grana, basilico', 10.00, cat_classiche, true, 'jersey://13/red', 20),
    ('21 Doncic', 'Fior di latte, gorgonzola, pere, noci, basilico', 10.00, cat_classiche, true, 'jersey://77/blue', 21),
    ('22 Irving', 'Pomodoro, fior di latte, gorgonzola, spianata, basilico', 8.00, cat_classiche, true, 'jersey://11/green', 22),
    ('23 Pippen', 'Pomodoro, fior di latte, prosciutto, funghi, basilico', 8.00, cat_classiche, true, 'jersey://33/red', 23),
    ('24 Tatum', 'Fior di latte, gorgonzola, cipolla rossa, basilico', 8.00, cat_classiche, true, 'jersey://0/green', 24),
    ('25 Melli', 'Pomodoro, fior di latte, prosciutto, fontina, basilico', 8.00, cat_classiche, true, 'jersey://9/azure', 25),
    ('26 T-Mac', 'Pomodoro, fior di latte, uovo, guanciale, pecorino, pepe, basilico', 10.00, cat_classiche, true, 'jersey://1/blue', 26);

    -- M.V.P. (Special Pizzas - Premium Jerseys)
    -- Using gold/special colors
    INSERT INTO products (name, description, price, category_id, is_active, image_url, sort_order) VALUES
    ('Kobe', 'Fior di latte, crema di zucca, salsiccia, gorgonzola, patate, nduja, basilico', 12.00, cat_mvp, true, 'jersey://24/purple-gold', 1),
    ('Jordan', 'Fior di latte, porcini, pasta di tartufo nero, salsiccia, prezzemolo', 12.00, cat_mvp, true, 'jersey://23/red-black', 2),
    ('Rose', 'Fior di latte, stracchino, salsiccia, patate lesse, brie, pomodorini, basilico', 12.00, cat_mvp, true, 'jersey://1/red-black', 3),
    ('Lebron', 'Fior di latte, mortadella DOP, burrata, crema di pistacchio', 12.00, cat_mvp, true, 'jersey://23/yellow-purple', 4);

    -- Fritti
    INSERT INTO products (name, price, category_id, is_active, sort_order) VALUES
    ('Misto Napoli', 6.00, cat_fritti, true, 1),
    ('Arancino', 2.50, cat_fritti, true, 2), -- Guessed price based on range
    ('Gnocco Fritto', 5.00, cat_fritti, true, 3),
    ('Crudo e Burrata e Rucola', 9.00, cat_fritti, true, 4),
    ('Nutella', 7.00, cat_fritti, true, 5),
    ('Farinata', 3.00, cat_fritti, true, 6),
    ('Patatine Fritte', 4.00, cat_fritti, true, 7);

    -- Drinks
    INSERT INTO products (name, price, category_id, is_active, sort_order) VALUES
    ('Acqua in Bottiglia 50cl', 1.00, cat_drinks, true, 1),
    ('Bibita in Lattina 33cl', 2.50, cat_drinks, true, 2),
    ('Birra 33cl', 3.50, cat_drinks, true, 3);

    -- Birre Artigianali
    INSERT INTO products (name, description, price, category_id, is_active, sort_order) VALUES
    ('Voglia', 'IPA da 33cl', 5.00, cat_birre_art, true, 1),
    ('Sesso', 'Double IPA da 33cl', 5.00, cat_birre_art, true, 2),
    ('Duro', 'Golden Ale da 33cl', 5.00, cat_birre_art, true, 3);
    
    
    -- ALSO Populate Offer Categories & Special Offers for the OffersPage (highlighting MVPs)
    -- We can map MVPs to Special Offers too
    
    INSERT INTO offer_categories (name, display_order, is_active) VALUES ('MVP Specials', 1, true);
    
    INSERT INTO special_offers (title, description, price, category_id, is_active, image_url, slug)
    SELECT p.name, p.description, p.price, (SELECT id FROM offer_categories WHERE name = 'MVP Specials'), true, p.image_url, LOWER(p.name)
    FROM products p WHERE p.category_id = cat_mvp;

END $$;
