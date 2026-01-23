-- Update Fritti Items
UPDATE products SET 
    image_url = '/food-farinata.png?v=new',
    description = 'A classic Ligurian chickpea pancake, golden and crispy on the outside, soft on the inside, seasoned with rosemary and black pepper.'
WHERE name = 'FARINATA';

UPDATE products SET 
    image_url = '/food-fries.png?v=new',
    description = 'Classic golden potato fries, crispy on the outside and soft on the inside, salted to perfection.'
WHERE name = 'French Fries (Patatine Fritte)';

UPDATE products SET 
    image_url = '/food-gnocco-plain.png?v=new',
    description = 'Traditional Emilian puffy fried dough pillows, light, airy, and served hot. Perfect on their own or with charcuterie.'
WHERE name = 'Gnocco Fritto Plain (Liscio)';

UPDATE products SET 
    image_url = '/food-gnocco-savory.png?v=new',
    description = 'Our signature puffy fried dough served with premium Prosciutto Crudo di Parma, fresh Burrata cheese, and peppery arugula.'
WHERE name = 'Gnocco Fritto (Crudo, Burrata & Arugula)';

UPDATE products SET 
    image_url = '/food-gnocco-nutella.png?v=new',
    description = 'A decadent dessert treat: warm fried dough pillows drizzled generously with rich Nutella and dusted with powdered sugar.'
WHERE name = 'Gnocco Fritto (Nutella)';

UPDATE products SET 
    image_url = '/food-misto-napoli.png?v=new',
    description = 'A taste of Naples street food: Rice Arancini, Potato Crocchè, Pasta Fritters, and Fried Polenta squares.'
WHERE name = 'MISTO NAPOLI';

-- Update Drink Items (Descriptions only, images already mostly good but confirming)
UPDATE products SET 
    image_url = '/drink-beer.png?v=new',
    description = 'Chilled 33cl bottled beer, the perfect refreshing companion to our pizzas and fried delights.'
WHERE name = 'Beer (33cl)';

UPDATE products SET 
    image_url = '/drink-coke.png?v=new',
    description = 'Ice-cold 33cl canned soft drink. Choose your favorite cola or soda flavor.'
WHERE name = 'Soda Cans (33cl)';

UPDATE products SET 
    image_url = '/drink-water.png?v=new',
    description = 'Pure still mineral water in a 50cl bottle to keep you refreshed.'
WHERE name = 'Water (50cl)';
