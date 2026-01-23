
-- Update Drink Names to be more specific
UPDATE products SET name = 'Voglia IPA' WHERE name = 'VOGLIA';
UPDATE products SET name = 'Sesso Double IPA' WHERE name = 'SESSO';
UPDATE products SET name = 'Duro Golden Ale' WHERE name = 'DURO';

-- Ensure Description Casing is standardized (optional, but nice)
-- No, I'll update textTransform in frontend, so DB data casing doesn't strictly matter if it's consistent.

-- Verify Kobe is #12
UPDATE products SET image_url = 'jersey://12/purple' WHERE name = 'KOBE';
