-- Sweetwaters Inventory — realistic dev seed data.
-- Run in the Supabase SQL Editor AFTER 0001_init.sql.
-- Safe to re-run: it clears items/categories first, then reinserts.
--
-- A handful of items are intentionally at or below their critical level so the
-- "Needs Ordering" / REORDER badge features have something to show.

begin;

-- Reset (items first because of the FK).
delete from public.items;
delete from public.categories;

insert into public.categories (name, sort_order) values
  ('Pastries',             1),
  ('Dairy & Alternatives', 2),
  ('Cups & Lids',          3),
  ('Syrups & Sauces',      4),
  ('Tea & Coffee',         5),
  ('Cleaning',             6);

insert into public.items (name, category_id, unit, critical_level, current_qty)
select v.name, c.id, v.unit, v.critical_level, v.current_qty
from (
  values
    -- Pastries
    ('Butter Croissant',        'Pastries',             'boxes',    2, 5),
    ('Chocolate Croissant',     'Pastries',             'boxes',    2, 1),   -- low
    ('Blueberry Muffin',        'Pastries',             'boxes',    2, 4),
    ('Cinnamon Roll',           'Pastries',             'boxes',    1, 3),
    ('Cheese Danish',           'Pastries',             'boxes',    2, 2),   -- low (==)
    ('Plain Bagel',             'Pastries',             'bags',     3, 6),
    -- Dairy & Alternatives
    ('Whole Milk',              'Dairy & Alternatives', 'cartons',  4, 9),
    ('2% Milk',                 'Dairy & Alternatives', 'cartons',  4, 3),   -- low
    ('Skim Milk',               'Dairy & Alternatives', 'cartons',  2, 5),
    ('Half & Half',             'Dairy & Alternatives', 'cartons',  3, 7),
    ('Oat Milk',                'Dairy & Alternatives', 'cartons',  4, 4),   -- low (==)
    ('Almond Milk',             'Dairy & Alternatives', 'cartons',  3, 8),
    ('Soy Milk',                'Dairy & Alternatives', 'cartons',  2, 2),   -- low (==)
    ('Heavy Cream',             'Dairy & Alternatives', 'quarts',   2, 4),
    -- Cups & Lids
    ('12oz Hot Cups',           'Cups & Lids',          'sleeves',  3, 10),
    ('16oz Hot Cups',           'Cups & Lids',          'sleeves',  3, 2),   -- low
    ('20oz Hot Cups',           'Cups & Lids',          'sleeves',  2, 5),
    ('16oz Cold Cups',          'Cups & Lids',          'sleeves',  3, 6),
    ('24oz Cold Cups',          'Cups & Lids',          'sleeves',  2, 4),
    ('Hot Cup Lids',            'Cups & Lids',          'sleeves',  3, 3),   -- low (==)
    ('Cold Cup Lids',           'Cups & Lids',          'sleeves',  3, 7),
    ('Cup Sleeves',             'Cups & Lids',          'boxes',    2, 5),
    ('Straws',                  'Cups & Lids',          'boxes',    2, 8),
    -- Syrups & Sauces
    ('Vanilla Syrup',           'Syrups & Sauces',      'bottles',  2, 5),
    ('Caramel Syrup',           'Syrups & Sauces',      'bottles',  2, 1),   -- low
    ('Hazelnut Syrup',          'Syrups & Sauces',      'bottles',  2, 3),
    ('Sugar-Free Vanilla',      'Syrups & Sauces',      'bottles',  1, 2),
    ('Mocha Sauce',             'Syrups & Sauces',      'bottles',  2, 4),
    ('White Mocha Sauce',       'Syrups & Sauces',      'bottles',  2, 2),   -- low (==)
    ('Pumpkin Spice Syrup',     'Syrups & Sauces',      'bottles',  1, 6),
    -- Tea & Coffee
    ('House Blend Beans',       'Tea & Coffee',         'bags',     4, 10),
    ('Decaf Beans',             'Tea & Coffee',         'bags',     2, 3),
    ('Espresso Beans',          'Tea & Coffee',         'bags',     4, 4),   -- low (==)
    ('Black Tea Bags',          'Tea & Coffee',         'boxes',    2, 5),
    ('Green Tea Bags',          'Tea & Coffee',         'boxes',    2, 1),   -- low
    ('Earl Grey Tea Bags',      'Tea & Coffee',         'boxes',    2, 4),
    ('Peppermint Tea Bags',     'Tea & Coffee',         'boxes',    2, 3),
    ('Chai Concentrate',        'Tea & Coffee',         'cartons',  3, 6),
    -- Cleaning
    ('Sanitizer Tablets',       'Cleaning',             'buckets',  1, 2),
    ('Paper Towels',            'Cleaning',             'cases',    2, 3),
    ('Dish Soap',               'Cleaning',             'bottles',  2, 2),   -- low (==)
    ('Espresso Machine Cleaner','Cleaning',             'jars',     1, 1),   -- low (==)
    ('Milk Frother Wipes',      'Cleaning',             'boxes',    2, 4),
    ('Trash Bags',              'Cleaning',             'rolls',    2, 5)
) as v(name, category, unit, critical_level, current_qty)
join public.categories c on c.name = v.category;

commit;
