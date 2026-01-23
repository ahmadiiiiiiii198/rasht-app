-- Update ALL Pizzas to use the new High Quality Jersey Protocol
-- This replaces direct image URLs with the dynamic texture system

-- MVP Section
UPDATE products SET image_url = 'jersey://23/red?v=hq' WHERE name = 'JORDAN';
UPDATE products SET image_url = 'jersey://24/purple?v=hq' WHERE name = 'KOBE';
UPDATE products SET image_url = 'jersey://23/yellow?v=hq' WHERE name = 'LEBRON';
UPDATE products SET image_url = 'jersey://1/red?v=hq' WHERE name = 'ROSE';

-- Classiche Section
UPDATE products SET image_url = 'jersey://32/purple?v=hq' WHERE name = '1 MAGIC';
UPDATE products SET image_url = 'jersey://7/red?v=hq' WHERE name = '2 BARGNANI';
UPDATE products SET image_url = 'jersey://20/silver?v=hq' WHERE name = '3 GINOBILI';
UPDATE products SET image_url = 'jersey://21/black?v=hq' WHERE name = '4 DUNCAN';
UPDATE products SET image_url = 'jersey://3/black?v=hq' WHERE name = '5 IVERSON';
UPDATE products SET image_url = 'jersey://41/blue?v=hq' WHERE name = '6 NOWITZKI';
UPDATE products SET image_url = 'jersey://15/navy?v=hq' WHERE name = '7 JOKIC';
UPDATE products SET image_url = 'jersey://34/yellow?v=hq' WHERE name = '8 SHAQ';
UPDATE products SET image_url = 'jersey://70/green?v=hq' WHERE name = '9 DATOME';
UPDATE products SET image_url = 'jersey://9/silver?v=hq' WHERE name = '10 PARKER';
UPDATE products SET image_url = 'jersey://13/orange?v=hq' WHERE name = '11 STEVE NASH';
UPDATE products SET image_url = 'jersey://91/red?v=hq' WHERE name = '12 RODMAN';
UPDATE products SET image_url = 'jersey://33/yellow?v=hq' WHERE name = '13 KAREEM';
UPDATE products SET image_url = 'jersey://30/blue?v=hq' WHERE name = '14 STEPH CURRY';
UPDATE products SET image_url = 'jersey://5/green?v=hq' WHERE name = '15 GARNETT';
UPDATE products SET image_url = 'jersey://35/orange?v=hq' WHERE name = '16 DURANT'; -- Suns Orange/Purple
UPDATE products SET image_url = 'jersey://2/black?v=hq' WHERE name = '17 LEONARD'; -- Clippers Black/Navy
UPDATE products SET image_url = 'jersey://0/green?v=hq' WHERE name = '18 LILLARD';
UPDATE products SET image_url = 'jersey://16/yellow?v=hq' WHERE name = '19 GASOL'; -- Lakers Gasol
UPDATE products SET image_url = 'jersey://1/black?v=hq' WHERE name = '20 HARDEN'; -- Clippers
UPDATE products SET image_url = 'jersey://77/blue?v=hq' WHERE name = '21 DONCIC';
UPDATE products SET image_url = 'jersey://11/blue?v=hq' WHERE name = '22 IRVING';
UPDATE products SET image_url = 'jersey://33/red?v=hq' WHERE name = '23 PIPPEN';
UPDATE products SET image_url = 'jersey://0/green?v=hq' WHERE name = '24 TATUM';
UPDATE products SET image_url = 'jersey://20/red?v=hq' WHERE name = '25 MELLI'; -- Olimpia/Pelicans? Lets go Red
UPDATE products SET image_url = 'jersey://1/blue?v=hq' WHERE name = '26 T-MAC';

-- Verify update
SELECT name, image_url FROM products WHERE category_id IN (SELECT id FROM categories WHERE name IN ('MVP', 'Classiche'));
