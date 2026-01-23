
-- Revert all products to Jersey rendering
-- Fixing Kobe to be #12 as requested
-- Restoring consistency for "Pictures are Shirts"

TRUNCATE TABLE order_items CASCADE;
TRUNCATE TABLE orders CASCADE;
TRUNCATE TABLE special_offers CASCADE;
TRUNCATE TABLE offer_categories CASCADE;
TRUNCATE TABLE products CASCADE;
-- Categories stay, they are fine.

-- Re-Insert Products
INSERT INTO products (name, description, price, category_id, is_active, image_url, sort_order)
SELECT name, description, price, (SELECT id FROM categories WHERE slug = 'classiche'), true, image_url, sort_order
FROM (VALUES
  ('1 MAGIC', 'Pomodoro, fior di latte, basilico', 6.00, 'jersey://1/purple', 1),
  ('2 BARGNANI', 'Pomodoro, fior di latte, bufala, basilico', 8.00, 'jersey://2/red', 2),
  ('3 GINOBILI', 'Fior di latte, gorgonzola, provola, toma, parmigiano, basilico', 9.00, 'jersey://3/black', 3),
  ('4 DUNCAN', 'Pomodoro, fior di latte, cipolla, gorgonzola, guanciale, pecorino, basilico', 10.00, 'jersey://4/black', 4),
  ('5 IVERSON', 'Pomodoro, fior di latte, prosciutto, wurstel, salsiccia, spianata calabra, basilico', 9.00, 'jersey://5/black', 5),
  ('6 NOWITZKI', 'Pomodoro, fior di latte, patatine fritte, wurstel, basilico', 8.00, 'jersey://6/blue', 6),
  ('7 JOKIC', 'Scamorza, friarielli, salsiccia, basilico', 9.00, 'jersey://7/navy', 7),
  ('8 SHAQ', 'Pomodoro, fior di latte, spianata calabra, nduja, salsiccia, peperoni grigliati, basilico', 10.00, 'jersey://8/yellow', 8),
  ('9 DATOME', 'Fior di latte, porcini, prezzemolo, scaglie di grana, basilico', 10.00, 'jersey://9/green', 9),
  ('10 PARKER', 'Pomodoro, acciughe, olive, capperi, aglio, pomodorini, basilico', 8.00, 'jersey://10/black', 10),
  ('11 STEVE NASH', 'Pomodoro, patate lesse, porcini, rucola, basilico', 9.00, 'jersey://11/orange', 11),
  ('12 RODMAN', 'Fior di latte, gorgonzola, salsiccia, zucchine grigliate, basilico', 10.00, 'jersey://12/red', 12),
  ('13 KAREEM', 'Pomodoro, fior di latte, spianata calabra, basilico', 7.00, 'jersey://13/yellow', 13),
  ('14 STEPH CURRY', 'Pomodoro, fior di latte, olive, spianata calabra, prosciutto, funghi, carciofi, basilico', 9.00, 'jersey://14/blue', 14),
  ('15 GARNETT', 'Pomodoro, fior di latte, melanzane, parmigiano, basilico', 8.00, 'jersey://15/green', 15),
  ('16 DURANT', 'Pomodoro, fior di latte, melanzane, zucchine, peperoni, friarielli, basilico', 9.00, 'jersey://16/black', 16),
  ('17 LEONARD', 'Pomodoro, salsiccia, burrata, pomodorini, pepe, basilico', 10.00, 'jersey://17/silver', 17),
  ('18 LILLARD', 'Pomodoro, pecorino, guanciale, burrata, pepe, basilico', 10.00, 'jersey://18/red', 18),
  ('19 GASOL', 'Pomodoro, fior di latte, tonno, cipolla, basilico', 8.00, 'jersey://19/yellow', 19),
  ('20 HARDEN', 'Fior di latte, rucola, prosciutto crudo, pomodorini, scaglie di grana, basilico', 10.00, 'jersey://20/red', 20),
  ('21 DONCIC', 'Fior di latte, gorgonzola, pere, noci, basilico', 10.00, 'jersey://21/blue', 21),
  ('22 IRVING', 'Pomodoro, fior di latte, gorgonzola, spianata, basilico', 8.00, 'jersey://22/green', 22),
  ('23 PIPPEN', 'Pomodoro, fior di latte, prosciutto, funghi, basilico', 8.00, 'jersey://23/red', 23),
  ('24 TATUM', 'Fior di latte, gorgonzola, cipolla rossa, basilico', 8.00, 'jersey://24/green', 24),
  ('25 MELLI', 'Pomodoro, fior di latte, prosciutto, fontina, basilico', 8.00, 'jersey://25/azure', 25),
  ('26 T-MAC', 'Pomodoro, fior di latte, uovo, guanciale, pecorino, pepe, basilico', 10.00, 'jersey://26/blue', 26)
) AS t(name, description, price, image_url, sort_order);

-- MVP
INSERT INTO products (name, description, price, category_id, is_active, image_url, sort_order)
SELECT name, description, price, (SELECT id FROM categories WHERE slug = 'mvp'), true, image_url, sort_order
FROM (VALUES
  ('KOBE', 'Fior di latte, crema di zucca, salsiccia, gorgonzola, patate, nduja, basilico', 12.00, 'jersey://12/purple', 1), -- Kobe 12 as requested
  ('JORDAN', 'Fior di latte, porcini, pasta di tartufo nero, salsiccia, prezzemolo', 12.00, 'jersey://23/red', 2),
  ('ROSE', 'Fior di latte, stracchino, salsiccia, patate lesse, brie, pomodorini, basilico', 12.00, 'jersey://1/red', 3),
  ('LEBRON', 'Fior di latte, mortadella DOP, burrata, crema di pistacchio', 12.00, 'jersey://23/yellow', 4)
) AS t(name, description, price, image_url, sort_order);

-- Fritti & Drinks (No images needed or NULL)
INSERT INTO products (name, description, price, category_id, is_active, sort_order)
SELECT name, description, price, (SELECT id FROM categories WHERE slug = 'fritti'), true, sort_order
FROM (VALUES
  ('MISTO NAPOLI', 'Arancino al sugo, frittatina di spaghetti, delizia ai 4 formaggi, crocchè di mozzarella, scagliozzo di polenta', 6.00, 1),
  ('GNOCCO FRITTO LISCIO', NULL, 5.00, 2),
  ('GNOCCO FRITTO CRUDO E BURRATA E RUCOLA', NULL, 9.00, 3),
  ('GNOCCO FRITTO NUTELLA', NULL, 7.00, 4),
  ('FARINATA', NULL, 3.00, 5),
  ('PATATINE FRITTE', NULL, 4.00, 6)
) AS t(name, description, price, sort_order);

INSERT INTO products (name, price, category_id, is_active, sort_order)
SELECT name, price, (SELECT id FROM categories WHERE slug = 'drinks'), true, sort_order
FROM (VALUES
  ('ACQUA IN BOTTIGLIA 50CL', 1.00, 1),
  ('BIBITA IN LATTINA 33CL', 2.50, 2),
  ('BIRRA DA 33CL', 3.50, 3)
) AS t(name, price, sort_order);

INSERT INTO products (name, description, price, category_id, is_active, sort_order)
SELECT name, description, price, (SELECT id FROM categories WHERE slug = 'birre-artigianali'), true, sort_order
FROM (VALUES
  ('VOGLIA', 'IPA da 33cl', 5.00, 1),
  ('SESSO', 'Double IPA da 33cl', 5.00, 2),
  ('DURO', 'Golden Ale da 33cl', 5.00, 3)
) AS t(name, description, price, sort_order);
