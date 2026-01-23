
-- Update Offers with Unsplash Images

-- NUGGETS (All variants get a nuggets image)
UPDATE special_offers 
SET image_url = 'https://images.unsplash.com/photo-1562967963-ed7b6f968886?w=800&q=80'
WHERE slug IN ('4-nuggets', '6-nuggets', '9-nuggets', '20-nuggets');

-- TACOS (French Tacos / Wrap style)
UPDATE special_offers 
SET image_url = 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&q=80'
WHERE slug IN ('menu-tacos', 'menu-tacos-xl');

UPDATE special_offers 
SET image_url = 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80'
WHERE slug = 'menu-coppia-tacos';

-- HAMBURGERS
UPDATE special_offers 
SET image_url = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80'
WHERE slug = 'menu-double-burger';

-- PATATINE
UPDATE special_offers 
SET image_url = 'https://images.unsplash.com/photo-1630384060421-a4323ceca041?w=800&q=80'
WHERE slug IN ('patatine-medie', 'patatine-grandi');

UPDATE special_offers 
SET image_url = 'https://images.unsplash.com/photo-1585109649139-366815a0d713?w=800&q=80'
WHERE slug = 'patatine-cheddar'; -- Cheesy fries

-- SALVA 1 EURO / SNACKS
UPDATE special_offers 
SET image_url = 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&q=80'
WHERE slug = 'box-merenda'; -- Chicken box

UPDATE special_offers 
SET image_url = 'https://images.unsplash.com/photo-1612392062631-94dd858cba88?w=800&q=80'
WHERE slug = 'hotdog';

UPDATE special_offers 
SET image_url = 'https://images.unsplash.com/photo-1633321702518-7fe2bf4295fb?w=800&q=80'
WHERE slug = 'mini-kebap-fritto'; -- Fried Kebab / Wrap

UPDATE special_offers 
SET image_url = 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80'
WHERE slug IN ('trancio-margherita', 'trancio-marinara'); -- Pizza Slice

-- MENU STUDENTE
UPDATE special_offers 
SET image_url = 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80'
WHERE slug = 'menu-studente'; -- Burger/Sandwich + Fries meal

-- VASCHETTE CARNE
UPDATE special_offers 
SET image_url = 'https://images.unsplash.com/photo-1513639776629-7b611594e29b?w=800&q=80'
WHERE slug = 'box-misto'; -- Mixed fried food
