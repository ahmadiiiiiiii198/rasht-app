
-- Fix Jersey Numbers to match Menu Index
-- User Request: "number of the players are the white numbers infromt of the pizza names"

BEGIN;

UPDATE products SET image_url = 'jersey://1/purple' WHERE name = '1 Magic';
UPDATE products SET image_url = 'jersey://2/red' WHERE name = '2 Bargnani';
UPDATE products SET image_url = 'jersey://3/black' WHERE name = '3 Ginobili';
UPDATE products SET image_url = 'jersey://4/black' WHERE name = '4 Duncan';
UPDATE products SET image_url = 'jersey://5/black' WHERE name = '5 Iverson';
UPDATE products SET image_url = 'jersey://6/blue' WHERE name = '6 Nowitzki';
UPDATE products SET image_url = 'jersey://7/navy' WHERE name = '7 Jokic';
UPDATE products SET image_url = 'jersey://8/yellow' WHERE name = '8 Shaq';
UPDATE products SET image_url = 'jersey://9/green' WHERE name = '9 Datome';
UPDATE products SET image_url = 'jersey://10/black' WHERE name = '10 Parker';
UPDATE products SET image_url = 'jersey://11/orange' WHERE name = '11 Steve Nash';
UPDATE products SET image_url = 'jersey://12/red' WHERE name = '12 Rodman';
UPDATE products SET image_url = 'jersey://13/yellow' WHERE name = '13 Kareem';
UPDATE products SET image_url = 'jersey://14/blue' WHERE name = '14 Steph Curry';
UPDATE products SET image_url = 'jersey://15/green' WHERE name = '15 Garnett';
UPDATE products SET image_url = 'jersey://16/black' WHERE name = '16 Durant';
UPDATE products SET image_url = 'jersey://17/silver' WHERE name = '17 Leonard';
UPDATE products SET image_url = 'jersey://18/red' WHERE name = '18 Lillard';
UPDATE products SET image_url = 'jersey://19/yellow' WHERE name = '19 Gasol';
UPDATE products SET image_url = 'jersey://20/red' WHERE name = '20 Harden';
UPDATE products SET image_url = 'jersey://21/blue' WHERE name = '21 Doncic';
UPDATE products SET image_url = 'jersey://22/green' WHERE name = '22 Irving';
UPDATE products SET image_url = 'jersey://23/red' WHERE name = '23 Pippen';
UPDATE products SET image_url = 'jersey://24/green' WHERE name = '24 Tatum';
UPDATE products SET image_url = 'jersey://25/azure' WHERE name = '25 Melli';
UPDATE products SET image_url = 'jersey://26/blue' WHERE name = '26 T-Mac';

COMMIT;
