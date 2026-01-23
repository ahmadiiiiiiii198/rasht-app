
-- Full Menu Update based on provided English/Italian text

-- CLASSICHE
UPDATE products SET description = 'Pomodoro, Fior di Latte, Basilico' WHERE name = '1 MAGIC';
UPDATE products SET description = 'Pomodoro, Fior di Latte, Bufala, Basilico' WHERE name = '2 BARGNANI';
UPDATE products SET description = 'Fior di Latte, Gorgonzola, Provola, Toma, Parmigiano, Basilico' WHERE name = '3 GINOBILI';
UPDATE products SET description = 'Pomodoro, Fior di Latte, Onion, Gorgonzola, Guanciale, Pecorino, Basilico' WHERE name = '4 DUNCAN';
UPDATE products SET description = 'Pomodoro, Fior di Latte, Ham, Würstel, Sausage, Spianata Calabra, Basilico' WHERE name = '5 IVERSON';
UPDATE products SET description = 'Pomodoro, Fior di Latte, French Fries, Würstel, Basilico' WHERE name = '6 NOWITZKI';
UPDATE products SET description = 'Scamorza, Friarielli (Broccoli Rabe), Sausage, Basilico' WHERE name = '7 JOKIC';
UPDATE products SET description = 'Pomodoro, Fior di Latte, Spianata Calabra, N''duja, Sausage, Grilled Peppers, Basilico' WHERE name = '8 SHAQ';
UPDATE products SET description = 'Fior di Latte, Porcini Mushrooms, Parsley, Grana Cheese Flakes, Basilico' WHERE name = '9 DATOME';
UPDATE products SET description = 'Pomodoro, Anchovies, Olives, Capers, Garlic, Cherry Tomatoes, Basilico' WHERE name = '10 PARKER';
UPDATE products SET description = 'Pomodoro, Boiled Potatoes, Porcini Mushrooms, Arugula, Basilico' WHERE name = '11 STEVE NASH';
UPDATE products SET description = 'Fior di Latte, Gorgonzola, Sausage, Grilled Zucchini, Basilico' WHERE name = '12 RODMAN';
UPDATE products SET description = 'Pomodoro, Fior di Latte, Spianata Calabra, Basilico' WHERE name = '13 KAREEM';
UPDATE products SET description = 'Pomodoro, Fior di Latte, Olives, Spianata Calabra, Ham, Mushrooms, Artichokes, Basilico' WHERE name = '14 STEPH CURRY';
UPDATE products SET description = 'Pomodoro, Fior di Latte, Eggplant, Parmigiano, Basilico' WHERE name = '15 GARNETT';
UPDATE products SET description = 'Pomodoro, Fior di Latte, Eggplant, Zucchini, Peppers, Friarielli, Basilico' WHERE name = '16 DURANT';
UPDATE products SET description = 'Pomodoro, Sausage, Burrata, Cherry Tomatoes, Pepper, Basilico' WHERE name = '17 LEONARD';
UPDATE products SET description = 'Pomodoro, Pecorino, Guanciale, Burrata, Pepper, Basilico' WHERE name = '18 LILLARD';
UPDATE products SET description = 'Pomodoro, Fior di Latte, Tuna, Onion, Basilico' WHERE name = '19 GASOL';
UPDATE products SET description = 'Fior di Latte, Arugula, Prosciutto Crudo, Cherry Tomatoes, Grana Flakes, Basilico' WHERE name = '20 HARDEN';
UPDATE products SET description = 'Fior di Latte, Gorgonzola, Pears, Walnuts, Basilico' WHERE name = '21 DONCIC';
UPDATE products SET description = 'Pomodoro, Fior di Latte, Gorgonzola, Spianata, Basilico' WHERE name = '22 IRVING';
UPDATE products SET description = 'Pomodoro, Fior di Latte, Ham, Mushrooms, Basilico' WHERE name = '23 PIPPEN';
UPDATE products SET description = 'Fior di Latte, Gorgonzola, Red Onion, Basilico' WHERE name = '24 TATUM';
UPDATE products SET description = 'Pomodoro, Fior di Latte, Ham, Fontina cheese, Basilico' WHERE name = '25 MELLI';
UPDATE products SET description = 'Pomodoro, Fior di Latte, Egg, Guanciale, Pecorino, Pepper, Basilico' WHERE name = '26 T-MAC';

-- MVP
UPDATE products SET description = 'Fior di Latte, Pumpkin Cream, Sausage, Gorgonzola, Potatoes, N''duja, Basilico' WHERE name = 'KOBE';
UPDATE products SET description = 'Fior di Latte, Porcini Mushrooms, Black Truffle Paste, Sausage, Parsley' WHERE name = 'JORDAN';
UPDATE products SET description = 'Fior di Latte, Stracchino, Sausage, Boiled Potatoes, Brie, Cherry Tomatoes, Basilico' WHERE name = 'ROSE';
UPDATE products SET description = 'Fior di Latte, PDO Mortadella, Burrata, Pistachio Cream' WHERE name = 'LEBRON';

-- FRITTI & SIDES (Renaming to match English text)
UPDATE products SET description = 'Mixed plate containing Arancino with sauce, Spaghetti fritter, 4-cheese delight, Mozzarella croquette, Polenta scagliozzo' WHERE name = 'MISTO NAPOLI';
UPDATE products SET name = 'Gnocco Fritto Plain (Liscio)' WHERE name = 'GNOCCO FRITTO LISCIO';
UPDATE products SET name = 'Gnocco Fritto (Crudo, Burrata & Arugula)' WHERE name = 'GNOCCO FRITTO CRUDO E BURRATA E RUCOLA';
UPDATE products SET name = 'Gnocco Fritto (Nutella)' WHERE name = 'GNOCCO FRITTO NUTELLA';
UPDATE products SET name = 'French Fries (Patatine Fritte)' WHERE name = 'PATATINE FRITTE';

-- DRINKS (Renaming to English)
UPDATE products SET name = 'Water (50cl)' WHERE name = 'ACQUA IN BOTTIGLIA 50CL';
UPDATE products SET name = 'Soda Cans (33cl)' WHERE name = 'BIBITA IN LATTINA 33CL';
UPDATE products SET name = 'Beer (33cl)' WHERE name = 'BIRRA DA 33CL';
-- Craft beers stay as Voglia IPA, etc.
