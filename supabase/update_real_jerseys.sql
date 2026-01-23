-- Update MVP Pizzas to use Real Photos (stored locally)
UPDATE products SET image_url = '/jersey-jordan.png' WHERE name = 'JORDAN';
UPDATE products SET image_url = '/jersey-kobe.png' WHERE name = 'KOBE';
UPDATE products SET image_url = '/jersey-lebron.png' WHERE name = 'LEBRON';
UPDATE products SET image_url = '/jersey-rose.png' WHERE name = 'ROSE';

-- Update Classiche to use Generated Jerseys with ACCURATE Team Colors
-- 1 MAGIC (Lakers)
UPDATE products SET image_url = 'jersey://1/purple' WHERE name LIKE '1 MAGIC';
-- 2 KAWHI (Spurs/Clippers - Silver/Black)
UPDATE products SET image_url = 'jersey://2/silver' WHERE name LIKE '2 KAWHI%';
-- 3 CP3 (Suns/Clippers - Orange)
UPDATE products SET image_url = 'jersey://3/orange' WHERE name LIKE '3 CP3%';
-- 4 WESTBROOK (OKC/Clippers - Blue)
UPDATE products SET image_url = 'jersey://4/blue' WHERE name LIKE '4 WESTBROOK%';
-- 6 LEBRON (Heat/Lakers - Black/Red or Yellow - Use Red for variance vs MVP)
UPDATE products SET image_url = 'jersey://6/red' WHERE name LIKE '6 LEBRON%';
-- 10 PARKER (Spurs)
UPDATE products SET image_url = 'jersey://10/black' WHERE name LIKE '10 PARKER%';
-- 11 STEVE NASH (Suns)
UPDATE products SET image_url = 'jersey://11/orange' WHERE name LIKE '11 STEVE NASH%';
-- 12 RODMAN (Bulls)
UPDATE products SET image_url = 'jersey://12/red' WHERE name LIKE '12 RODMAN%';
-- 13 KAREEM (Lakers)
UPDATE products SET image_url = 'jersey://13/purple' WHERE name LIKE '13 KAREEM%';
-- 14 STEPH CURRY (Warriors)
UPDATE products SET image_url = 'jersey://14/blue' WHERE name LIKE '14 STEPH CURRY%';
-- 15 GARNETT (Celtics)
UPDATE products SET image_url = 'jersey://15/green' WHERE name LIKE '15 GARNETT%';
-- 16 DURANT (Warriors/Suns)
UPDATE products SET image_url = 'jersey://16/yellow' WHERE name LIKE '16 DURANT%';
-- 17 LEONARD (Spurs/Raptors)
UPDATE products SET image_url = 'jersey://17/black' WHERE name LIKE '17 LEONARD%';
-- 18 LILLARD (Blazers)
UPDATE products SET image_url = 'jersey://18/red' WHERE name LIKE '18 LILLARD%';
-- 19 GASOL (Grizzlies/Lakers)
UPDATE products SET image_url = 'jersey://19/navy' WHERE name LIKE '19 GASOL%';
-- 23 (If any generic)
-- 24 (If any generic)
-- Others default to white or specific if known.
