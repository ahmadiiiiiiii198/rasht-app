
-- Fix Fritti Menu based on Screenshot
-- 1. Remove Arancino (it's part of Misto Napoli description)
-- 2. Update Misto Napoli description
-- 3. Clarify Gnocco Fritto variations

BEGIN;

-- Remove Arancino
DELETE FROM products WHERE name = 'Arancino' AND category_id = (SELECT id FROM categories WHERE slug = 'fritti');

-- Update Misto Napoli
UPDATE products 
SET description = 'Arancino al sugo, frittatina di spaghetti, delizia ai 4 formaggi, crocchè di mozzarella, scagliozzo di polenta'
WHERE name = 'Misto Napoli';

-- Update Gnocco Fritto item names for clarity
UPDATE products SET name = 'Gnocco Fritto Liscio' WHERE name = 'Gnocco Fritto';
UPDATE products SET name = 'Gnocco Fritto con Crudo, Burrata e Rucola' WHERE name = 'Crudo e Burrata e Rucola';
UPDATE products SET name = 'Gnocco Fritto con Nutella' WHERE name = 'Nutella';

COMMIT;
