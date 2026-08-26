create table if not exists categories (
  id text primary key,
  name text not null,
  tagline text not null default '',
  sort_order int not null default 0,
  available boolean not null default true
);

create table if not exists products (
  id serial primary key,
  category_id text not null references categories(id),
  subcategory text,
  name text not null,
  description text not null default '',
  price int not null,
  image_url text not null default '',
  available boolean not null default true,
  is_custom boolean not null default false,
  custom_kind text,
  sort_order int not null default 0
);

create table if not exists ingredients (
  id text primary key,
  name text not null,
  kind text not null,
  premium boolean not null default false,
  empanada_ok boolean not null default false,
  fajita_ok boolean not null default false,
  fajita_price int not null default 0,
  available boolean not null default true,
  sort_order int not null default 0
);

create table if not exists settings (
  key text primary key,
  value text not null
);

create table if not exists admin_sessions (
  token text primary key,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

insert into categories (id, name, tagline, sort_order) values
  ('empanadas', 'Empanadas', 'Masa de maíz frita, rellenos al estilo venezolano', 1),
  ('fajitas', 'Fajitas', 'Tortilla rellena con salsa de ajo CRA', 2),
  ('papas', 'Papas fritas', 'Crocantes, simples o con proteína', 3),
  ('bebidas', 'Bebidas', 'Latas frías para acompañar', 4)
on conflict (id) do nothing;

insert into products (id, category_id, subcategory, name, description, price, image_url, is_custom, custom_kind, sort_order) values
  (1,  'empanadas', 'Clásicas',   'Pollo',                         'Pechuga desmechada, jugosa y sazonada.', 2800, '/menu/empanada-pollo.jpg', false, null, 10),
  (2,  'empanadas', 'Clásicas',   'Pollo + Mozzarella',            'Pollo desmechado con mozzarella fundida.', 2900, '/menu/empanada-pollo.jpg', false, null, 20),
  (3,  'empanadas', 'Clásicas',   'Queso Llanero',                 'Queso llanero que estira en cada bocado.', 2900, '/menu/empanada-queso.jpg', false, null, 30),
  (4,  'empanadas', 'Clásicas',   'Mechada',                       'Carne mechada bien guisada, al estilo de casa.', 3000, '/menu/empanada-mechada.jpg', false, null, 40),
  (5,  'empanadas', 'Clásicas',   'Mechada + Mozzarella',          'Mechada con mozzarella derretida.', 3100, '/menu/empanada-mechada.jpg', false, null, 50),
  (6,  'empanadas', 'Especiales', 'Pollo + Champiñón + Mozzarella','Pollo, champiñón salteado y mozzarella.', 3100, '/menu/empanada-champinon.jpg', false, null, 60),
  (7,  'empanadas', 'Especiales', 'Mechada + Plátano',             'Mechada con plátano maduro frito.', 3300, '/menu/empanada-platano.jpg', false, null, 70),
  (8,  'empanadas', 'Especiales', 'Caraota + Llanero',             'Caraotas negras con queso llanero.', 3300, '/menu/empanada-caraota.jpg', false, null, 80),
  (9,  'empanadas', 'Especiales', 'Jamón + Llanero',               'Jamón y queso llanero fundido.', 3300, '/menu/empanada-jamon.jpg', false, null, 90),
  (10, 'empanadas', 'CRA',        'Mechada + Plátano + Llanero',   'La combinación de la casa: mechada, plátano y llanero.', 3600, '/menu/empanada-platano.jpg', false, null, 100),
  (11, 'empanadas', 'CRA',        'Cordon Bleu',                   'Pollo, jamón y mozzarella, crujiente por fuera.', 3700, '/menu/empanada-cordon.jpg', false, null, 110),
  (12, 'empanadas', 'CRA',        'Pabellón',                      'Mechada, caraota y plátano. El clásico en empanada.', 3800, '/menu/empanada-pabellon.jpg', false, null, 120),
  (13, 'empanadas', null,         'Arma tu empanada',              'Hasta 3 ingredientes. Mechada o llanero suman extra.', 2800, '/menu/empanada-custom.jpg', true, 'empanada', 130),
  (14, 'fajitas',   null,         'Fajita Comer',                  'Pollo salteado con cebolla, lechuga, tomate, mozzarella y salsa de ajo CRA.', 3900, '/menu/fajita-pollo.jpg', false, null, 10),
  (15, 'fajitas',   null,         'Fajita Amar',                   'Pollo salteado con cebolla y pimentón, lechuga, tomate, mozzarella y salsa de ajo CRA.', 4200, '/menu/fajita-pollo.jpg', false, null, 20),
  (16, 'fajitas',   null,         'Fajita Rezar',                  'Carne mechada, lechuga, tomate, mozzarella y salsa de ajo CRA.', 4500, '/menu/fajita-mechada.jpg', false, null, 30),
  (17, 'fajitas',   null,         'Fajita Vegetariana',            'Lechuga, tomate, cebolla, pimentón, champiñón, maíz, mozzarella y salsa CRA.', 3900, '/menu/fajita-veg.jpg', false, null, 40),
  (18, 'fajitas',   null,         'Arma tu fajita',                'Hasta 8 ingredientes. Precio base + cada extra. Incluye salsa CRA.', 2200, '/menu/fajita-custom.jpg', true, 'fajita', 50),
  (19, 'papas',     null,         'Papas fritas pequeñas',         'Porción chica, recién fritas.', 2500, '/menu/papas-simple.jpg', false, null, 10),
  (20, 'papas',     null,         'Papas fritas grandes',          'Porción grande para compartir.', 3500, '/menu/papas-simple.jpg', false, null, 20),
  (21, 'papas',     null,         'Papas Mechada',                 'Papas grandes con 80 g de carne mechada.', 6500, '/menu/papas-mechada.jpg', false, null, 30),
  (22, 'papas',     null,         'Papas Pollo',                   'Papas grandes con 80 g de pollo desmechado.', 6000, '/menu/papas-pollo.jpg', false, null, 40),
  (23, 'bebidas',   null,         'Bebida en lata',                'Lata fría. Marca según disponibilidad del día.', 1500, '/menu/bebida.jpg', false, null, 10)
on conflict (id) do nothing;

select setval('products_id_seq', 50, true);

insert into ingredients (id, name, kind, premium, empanada_ok, fajita_ok, fajita_price, sort_order) values
  ('pollo',      'Pollo',          'protein', false, true,  true,  900, 10),
  ('mechada',    'Mechada',        'protein', true,  true,  true, 1500, 20),
  ('jamon',      'Jamón',          'protein', false, true,  true,  800, 30),
  ('llanero',    'Queso llanero',  'cheese',  true,  true,  true,  600, 40),
  ('mozzarella', 'Mozzarella',     'cheese',  false, true,  true,  400, 50),
  ('champinon',  'Champiñón',      'veg',     false, true,  true,  400, 60),
  ('maiz',       'Maíz',           'veg',     false, true,  true,  250, 70),
  ('platano',    'Plátano',        'veg',     false, true,  true,  400, 80),
  ('caraota',    'Caraota',        'veg',     false, true,  true,  400, 90),
  ('lechuga',    'Lechuga',        'veg',     false, false, true,  150, 100),
  ('tomate',     'Tomate',         'veg',     false, false, true,  200, 110),
  ('cebolla',    'Cebolla',        'veg',     false, false, true,  200, 120),
  ('pimenton',   'Pimentón',       'veg',     false, false, true,  300, 130)
on conflict (id) do nothing;

insert into settings (key, value) values
  ('restaurant_name', 'Comer Rezar Amar'),
  ('tagline', 'Cocina venezolana en Talca'),
  ('city', 'Talca · nororiente · delivery a toda la ciudad'),
  ('hours', 'Lunes a domingo · 12:00 a 23:00'),
  ('whatsapp', ''),
  ('transfer_bank', ''),
  ('transfer_name', 'Comer Rezar Amar'),
  ('transfer_rut', ''),
  ('transfer_account', ''),
  ('empanada_1', '2800'),
  ('empanada_2', '3200'),
  ('empanada_3', '3500'),
  ('empanada_premium', '300'),
  ('fajita_base', '2200'),
  ('admin_pin_hash', '7f89598182ad2268da7867c2233d3a00fd8647d7b6fc25adfa5cf6e2190a5d4b'),
  ('pin_changed', 'false')
on conflict (key) do nothing;
