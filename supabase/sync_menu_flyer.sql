-- CLASSICHE
UPDATE products SET description = 'Pomodoro, Fior di Latte, Basilico' WHERE name = '1 MAGIC';
UPDATE products SET description = 'Pomodoro, Fior di Latte, Bufala, Basilico' WHERE name = '2 BARGNANI';
UPDATE products SET description = 'Fior di Latte, Gorgonzola, Provola, Toma, Parmigiano, Basilico' WHERE name = '3 GINOBILI';
UPDATE products SET description = 'Pomodoro, Fior di Latte, Cipolla, Gorgonzola, Guanciale, Pecorino, Basilico' WHERE name = '4 DUNCAN';
UPDATE products SET description = 'Pomodoro, Fior di Latte, Prosciutto, Wurstel, Salsiccia, Spianata Calabra, Basilico' WHERE name = '5 IVERSON';
UPDATE products SET description = 'Pomodoro, Fior di Latte, Patatine Fritte, Wurstel, Basilico' WHERE name = '6 NOWITZKI';
UPDATE products SET description = 'Scamorza, Friarielli, Salsiccia, Basilico' WHERE name = '7 JOKIC';
UPDATE products SET description = 'Pomodoro, Fior di Latte, Spianata Calabra, N''duja, Salsiccia, Peperoni, Grigliati, Basilico' WHERE name = '8 SHAQ';
UPDATE products SET description = 'Fior di Latte, Porcini, Prezzemolo, Scaglie di Grana, Basilico' WHERE name = '9 DATOME';
UPDATE products SET description = 'Pomodoro, Acciughe, Olive, Capperi, Aglio, Pomodorini, Basilico' WHERE name = '10 PARKER';
UPDATE products SET description = 'Pomodoro, Patate Lesse, Porcini, Rucola, Basilico' WHERE name = '11 STEVE NASH';
UPDATE products SET description = 'Fior di Latte, Gorgonzola, Salsiccia, Zucchine Grigliate, Basilico' WHERE name = '12 RODMAN';
UPDATE products SET description = 'Pomodoro, Fior di Latte, Spianata Calabra, Basilico' WHERE name = '13 KAREEM';
UPDATE products SET description = 'Pomodoro, Fior di Latte, Olive, Spianata Calabra, Prosciutto, Funghi, Carciofi, Basilico' WHERE name = '14 STEPH CURRY';
UPDATE products SET description = 'Pomodoro, Fior di Latte, Melanzane, Parmigiano, Basilico' WHERE name = '15 GARNETT';
UPDATE products SET description = 'Pomodoro, Fior di Latte, Melanzane, Zucchine, Peperoni, Friarielli, Basilico' WHERE name = '16 DURANT';
UPDATE products SET description = 'Pomodoro, Salsiccia, Burrata, Pomodorini, Pepe, Basilico' WHERE name = '17 LEONARD';
UPDATE products SET description = 'Pomodoro, Pecorino, Guanciale, Burrata, Pepe, Basilico' WHERE name = '18 LILLARD';
UPDATE products SET description = 'Pomodoro, Fior di Latte, Tonno, Cipolla, Basilico' WHERE name = '19 GASOL';
UPDATE products SET description = 'Fior di Latte, Rucola, Prosciutto Crudo, Pomodorini, Scaglie di Grana, Basilico' WHERE name = '20 HARDEN';
UPDATE products SET description = 'Fior di Latte, Gorgonzola, Pere, Noci, Basilico' WHERE name = '21 DONCIC';
UPDATE products SET description = 'Pomodoro, Fior di Latte, Gorgonzola, Spianata, Basilico' WHERE name = '22 IRVING';
UPDATE products SET description = 'Pomodoro, Fior di Latte, Prosciutto, Funghi, Basilico' WHERE name = '23 PIPPEN';
UPDATE products SET description = 'Fior di Latte, Gorgonzola, Cipolla Rossa, Basilico' WHERE name = '24 TATUM';
UPDATE products SET description = 'Pomodoro, Fior di Latte, Prosciutto, Fontina, Basilico' WHERE name = '25 MELLI';
UPDATE products SET description = 'Pomodoro, Fior di Latte, Uovo, Guanciale, Pecorino, Pepe, Basilico' WHERE name = '26 T-MAC';

-- M.V.P.
UPDATE products SET description = 'Fior di Latte, Crema di Zucca, Salsiccia, Gorgonzola, Patate, N''duja, Basilico' WHERE name = 'KOBE';
UPDATE products SET description = 'Fior di Latte, Porcini, Pasta di Tartufo Nero, Salsiccia, Prezzemolo' WHERE name = 'JORDAN';
UPDATE products SET description = 'Fior di Latte, Stracchino, Salsiccia, Patate Lesse, Brie, Pomodorini, Basilico' WHERE name = 'ROSE';
UPDATE products SET description = 'Fior di Latte, Mortadella DOP, Burrata, Crema di Pistacchio' WHERE name = 'LEBRON';

-- FRITTI
UPDATE products SET description = 'Arancino al sugo, Frittati na di Spaghetti, Delizia ai 4 Formaggi, Crocchè di Mozzarella, Scagliozzo di Polenta' WHERE name = 'MISTO NAPOLI';
-- Keeping English descriptions for Fritti/Drinks images/names as they were custom request, but ensuring ingredients are mentioned if possible?
-- Actually, the menu just lists "Liscio", "Crudo e Burrata...", "Nutella".
-- I will keep the descriptive text I wrote earlier as it is more helpful for an App than just "Liscio".
-- Unless the user wants strict adherence? "make sure all these are in the database".
-- I will stick to the Italian ingredients names inside my descriptions?
-- E.g. "MISTO NAPOLI" description updated above.

-- DRINKS & BEERS
UPDATE products SET price = 3.50 WHERE name = 'Beer (33cl)'; -- Fix price discrepancy
-- Check other prices
-- Water 1.00 (Correct)
-- Soda 2.50 (Correct)
-- Craft Beers 5.00 (Correct)

-- Fix Misto Price if needed (6.00) -> Correct.
