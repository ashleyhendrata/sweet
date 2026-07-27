-- Sweetwaters Inventory — dev seed data, sourced from the store's actual
-- inventory sheet ("Sweetwater Inventory.xlsx - Store Inventory.csv").
-- Run in the Supabase SQL Editor AFTER migrations 0001–0005 (needs a team).
-- Seeds into the OLDEST team (the backfilled "The Grove").
-- Safe to re-run: it clears that team's items/categories first, then reinserts.
--
-- critical_level = the sheet's Par Level. The sheet's "In Stock" column was
-- blank (an uncounted template), so current_qty is filled with a realistic
-- mix — most items comfortably stocked, a spread of items at or below par so
-- the "Needs Ordering" / REORDER badge features have something to show.

begin;

-- Reset the first team's data (items first because of the FK).
delete from public.items
  where team_id = (select id from public.teams order by created_at limit 1);
delete from public.categories
  where team_id = (select id from public.teams order by created_at limit 1);

insert into public.categories (name, sort_order, team_id)
select v.name, v.sort_order, (select id from public.teams order by created_at limit 1)
from (values
  ('Coffee & Espresso',      1),
  ('Syrups & Sauces',        2),
  ('Premium Teas',           3),
  ('Select Teas - Black',    4),
  ('Select Teas - Herbal',   5),
  ('Select Teas - Green',    6),
  ('Hot Cups',               7),
  ('Cold Cups & Lids',       8),
  ('Cup Supplies',           9),
  ('Breakfast Items',        10),
  ('Bakery Items',           11),
  ('Dry Goods & Pantry',     12),
  ('Cleaning & Supplies',    13)
) as v(name, sort_order);

insert into public.items (name, category_id, unit, critical_level, current_qty, team_id)
select v.name, c.id, v.unit, v.critical_level, v.current_qty, c.team_id
from (
  values
    -- Coffee & Espresso
    ('Espresso Beans (House Blend)', 'Coffee & Espresso', 'lbs',             20, 25),
    ('Espresso Beans (Decaf)',       'Coffee & Espresso', 'lbs',              5,  2),  -- low
    ('Drip Coffee Beans (Light Roast)', 'Coffee & Espresso', 'lbs',         10, 12),
    ('Drip Coffee Beans (Dark Roast)',  'Coffee & Espresso', 'lbs',         10,  6),  -- low
    ('Cold Brew Concentrate',        'Coffee & Espresso', '32oz bottles',    12, 15),
    ('Whole Milk',                   'Coffee & Espresso', 'gallons',        10, 14),
    ('2% Milk',                      'Coffee & Espresso', 'gallons',         5,  5),  -- low (==)
    ('Oat Milk',                     'Coffee & Espresso', 'half-gallons',    8, 10),
    ('Almond Milk',                  'Coffee & Espresso', 'half-gallons',    4,  3),  -- low
    ('Heavy Cream',                  'Coffee & Espresso', 'quarts',          4,  6),
    -- Syrups & Sauces
    ('Vanilla Syrup',                'Syrups & Sauces', '750ml bottles',     4,  6),
    ('Sugar Free Vanilla',           'Syrups & Sauces', '750ml bottles',     3,  4),
    ('Hazelnut Syrup',               'Syrups & Sauces', '750ml bottles',     3,  2),  -- low
    ('Sugar Free Hazelnut',          'Syrups & Sauces', '750ml bottles',     2,  3),
    ('Pistachio Syrup',              'Syrups & Sauces', '750ml bottles',     2,  2),  -- low (==)
    ('Lychee Syrup',                 'Syrups & Sauces', '750ml bottles',     3,  5),
    ('Guava Syrup',                  'Syrups & Sauces', '750ml bottles',     3,  4),
    ('Lavender Syrup',               'Syrups & Sauces', '750ml bottles',     2,  3),
    ('Lime Syrup',                   'Syrups & Sauces', '750ml bottles',     2,  1),  -- low
    ('Energy Boost',                 'Syrups & Sauces', '750ml bottles',     3,  5),
    ('Blackberry Syrup',             'Syrups & Sauces', '750ml bottles',     2,  3),
    ('Coconut Syrup',                'Syrups & Sauces', '750ml bottles',     3,  4),
    ('Brown Sugar Syrup',            'Syrups & Sauces', '750ml bottles',     3,  3),  -- low (==)
    ('Strawberry Puree',             'Syrups & Sauces', 'bottles',           2,  3),
    ('Mango Puree',                  'Syrups & Sauces', 'bottles',           2,  4),
    ('Raspberry Puree',              'Syrups & Sauces', 'bottles',           2,  2),  -- low (==)
    ('Peach Syrup',                  'Syrups & Sauces', '750ml bottles',     2,  3),
    ('Yuzu Syrup',                   'Syrups & Sauces', '750ml bottles',     2,  4),
    ('Pineapple Syrup',              'Syrups & Sauces', '750ml bottles',     2,  3),
    ('Mint Syrup',                   'Syrups & Sauces', '750ml bottles',     2,  2),  -- low (==)
    ('Caramel Sauce',                'Syrups & Sauces', 'bottles',           3,  5),
    ('Chocolate Sauce',              'Syrups & Sauces', 'bottles',           3,  4),
    ('White Mocha Sauce',            'Syrups & Sauces', 'bottles',           2,  3),
    -- Premium Teas
    ('Earl Grey Tea Bags',           'Premium Teas', 'boxes of 100',         3,  4),
    ('Dragon Pearl Jasmine Tea',     'Premium Teas', 'boxes of 100',         3,  2),  -- low
    ('Greek Mint Tea',                'Premium Teas', 'boxes of 100',        2,  3),
    ('Winter Blossom Tea',           'Premium Teas', 'boxes of 100',         2,  2),  -- low (==)
    ('Royal Chai Tea',               'Premium Teas', 'boxes of 100',        3,  4),
    -- Select Teas - Black
    ('English Breakfast Tea Bags',   'Select Teas - Black', 'boxes of 100',  4,  5),
    ('Imperial Black Tea Bags',      'Select Teas - Black', 'boxes of 100',  3,  3),  -- low (==)
    ('Cinnamon Spice Tea Bags',      'Select Teas - Black', 'boxes of 100',  2,  3),
    ('Passion Fruit Tea Bags',       'Select Teas - Black', 'boxes of 100',  2,  2),  -- low (==)
    -- Select Teas - Herbal
    ('Chamomile Tea Bags',           'Select Teas - Herbal', 'boxes of 100', 2,  3),
    ('Mandarin Orange Rooibos',      'Select Teas - Herbal', 'boxes of 100', 2,  1),  -- low
    -- Select Teas - Green
    ('Pomegranate Green Tea',        'Select Teas - Green', 'boxes of 100',  2,  2),  -- low (==)
    ('Jasmine Green Tea Bags',       'Select Teas - Green', 'boxes of 100',  2,  3),
    -- Hot Cups
    ('Hot Paper Cups (12oz)',        'Hot Cups', 'cases of 500',             3,  5),
    ('Hot Paper Cups (16oz)',        'Hot Cups', 'cases of 500',             3,  4),
    ('Hot Paper Cups (20oz)',        'Hot Cups', 'cases of 500',             2,  1),  -- low
    ('Hot Cup Lids (one size)',      'Hot Cups', 'cases of 1000',            4,  6),
    -- Cold Cups & Lids
    ('Cold Cups (clear 16oz)',       'Cold Cups & Lids', 'cases of 500',     3,  4),
    ('Cold Cups (clear 20oz)',       'Cold Cups & Lids', 'cases of 500',     3,  5),
    ('Cold Cups (clear 32oz)',       'Cold Cups & Lids', 'cases of 500',     2,  2),  -- low (==)
    ('Dome Lids (fits 16/20oz)',     'Cold Cups & Lids', 'cases of 1000',    3,  4),
    ('Dome Lids (fits 32oz)',        'Cold Cups & Lids', 'cases of 1000',    2,  3),
    ('Flat Lids - Ice (fits 16/20oz)', 'Cold Cups & Lids', 'cases of 1000',  3,  2),  -- low
    ('Flat Lids - Ice (fits 32oz)',  'Cold Cups & Lids', 'cases of 1000',    2,  3),
    -- Cup Supplies
    ('Boba Straws (wide)',           'Cup Supplies', 'boxes of 500',         3,  4),
    ('Regular Straws',               'Cup Supplies', 'boxes of 500',         2,  3),
    ('Napkins',                      'Cup Supplies', 'cases',                2,  4),
    ('Stirrers',                     'Cup Supplies', 'boxes',                2,  1),  -- low
    -- Breakfast Items
    ('American Cheese Slices',       'Breakfast Items', 'lbs',               4,  5),
    ('Turkey Slices',                'Breakfast Items', 'lbs',               3,  4),
    ('Ham Slices',                   'Breakfast Items', 'lbs',               3,  2),  -- low
    ('Bacon Strips',                 'Breakfast Items', 'lbs',               5,  6),
    ('Bagels (plain)',               'Breakfast Items', 'dozen',             4,  5),
    ('Everything Bagels',            'Breakfast Items', 'dozen',             3,  3),  -- low (==)
    ('Biscuits',                     'Breakfast Items', 'dozen',             4,  6),
    ('Croissants',                   'Breakfast Items', 'dozen',             3,  4),
    ('Pretzels',                     'Breakfast Items', 'dozen',             2,  1),  -- low
    -- Bakery Items
    ('Tiramisu',                     'Bakery Items', 'dozen',                2,  3),
    ('Blueberry Cheesecake',         'Bakery Items', 'dozen',                2,  2),  -- low (==)
    ('Blueberry Scones',             'Bakery Items', 'dozen',                2,  4),
    ('Danishes',                     'Bakery Items', 'dozen',                1,  1),  -- low (==)
    ('Salted Vanilla Cake',          'Bakery Items', 'dozen',                2,  3),
    ('Cookies (chocolate chip)',     'Bakery Items', 'dozen',                2,  4),
    ('Brownies',                     'Bakery Items', 'dozen',                1,  2),
    ('Chocolate Cakes',              'Bakery Items', 'each',                 3,  2),  -- low
    -- Dry Goods & Pantry
    ('Sugar',                        'Dry Goods & Pantry', 'bags',           5,  6),
    ('Honey',                        'Dry Goods & Pantry', 'bottles',        3,  4),
    ('Chips',                        'Dry Goods & Pantry', 'each',           2,  1),  -- low
    ('Marshmallow',                  'Dry Goods & Pantry', 'boxes',          8,  9),
    ('Granola Bars',                 'Dry Goods & Pantry', 'boxes',          6,  5),  -- low
    ('Hot Sauce',                    'Dry Goods & Pantry', 'boxes',          4,  5),
    ('Fruit Jam',                    'Dry Goods & Pantry', 'boxes',          2,  3),
    -- Cleaning & Supplies
    ('Dish Soap',                    'Cleaning & Supplies', 'bottles',       4,  5),
    ('Sanitizer Solution',           'Cleaning & Supplies', 'gallons',       2,  1),  -- low
    ('Espresso Machine Cleaner',     'Cleaning & Supplies', 'tablets',       1,  1),  -- low (==)
    ('Paper Towels',                 'Cleaning & Supplies', 'cases',         2,  3),
    ('Trash Bags (large)',           'Cleaning & Supplies', 'boxes',         2,  4),
    ('Hand Soap (pump)',             'Cleaning & Supplies', 'bottles',       4,  3),  -- low
    ('Sponges / Scrubbers',          'Cleaning & Supplies', 'packs',         3,  4)
) as v(name, category, unit, critical_level, current_qty)
join public.categories c
  on c.name = v.category
  and c.team_id = (select id from public.teams order by created_at limit 1);

commit;
