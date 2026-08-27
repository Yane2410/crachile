-- Configurable combos: rules are stored separately from catalog products.
-- Existing static combo products are hidden while the new builder is prepared.
create table if not exists cra_combos (
  id serial primary key,
  name text not null,
  description text not null default '',
  price_mode text not null check (price_mode in ('fixed','percent','amount')),
  price_value int not null default 0,
  image_url text not null default '',
  available boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists cra_combo_rules (
  id serial primary key,
  combo_id int not null references cra_combos(id) on delete cascade,
  category_id text not null references cra_categories(id),
  quantity int not null check (quantity between 1 and 20),
  label text not null default '',
  sort_order int not null default 0
);

create index if not exists cra_combo_rules_combo_idx on cra_combo_rules (combo_id, sort_order, id);

update cra_categories set available = false where id = 'combos';
update cra_products set available = false where category_id = 'combos';

insert into cra_combos (name, description, price_mode, price_value, available, sort_order)
select v.name, v.description, v.price_mode, v.price_value, false, v.sort_order
from (values
  ('Combo Individual', '2 empanadas + 1 bebida', 'amount', 500, 10),
  ('Combo Doble', '4 empanadas + 2 bebidas', 'amount', 800, 20),
  ('Combo Fajita', '1 fajita + 1 bebida', 'amount', 500, 30),
  ('Combo CRA', '2 empanadas + 1 fajita + 1 bebida', 'amount', 800, 40),
  ('Combo Fajita + Papas', '1 fajita + papas + 1 bebida', 'amount', 700, 50)
) as v(name, description, price_mode, price_value, sort_order)
where not exists (select 1 from cra_combos c where c.name = v.name);

insert into cra_combo_rules (combo_id, category_id, quantity, label, sort_order)
select c.id, r.category_id, r.quantity, r.label, r.sort_order
from cra_combos c
join (values
  ('Combo Individual', 'empanadas', 2, 'Elige tus empanadas', 10),
  ('Combo Individual', 'bebidas', 1, 'Elige tu bebida', 20),
  ('Combo Doble', 'empanadas', 4, 'Elige tus empanadas', 10),
  ('Combo Doble', 'bebidas', 2, 'Elige tus bebidas', 20),
  ('Combo Fajita', 'fajitas', 1, 'Elige tu fajita', 10),
  ('Combo Fajita', 'bebidas', 1, 'Elige tu bebida', 20),
  ('Combo CRA', 'empanadas', 2, 'Elige tus empanadas', 10),
  ('Combo CRA', 'fajitas', 1, 'Elige tu fajita', 20),
  ('Combo CRA', 'bebidas', 1, 'Elige tu bebida', 30),
  ('Combo Fajita + Papas', 'fajitas', 1, 'Elige tu fajita', 10),
  ('Combo Fajita + Papas', 'papas', 1, 'Papas', 20),
  ('Combo Fajita + Papas', 'bebidas', 1, 'Elige tu bebida', 30)
) as r(combo_name, category_id, quantity, label, sort_order) on r.combo_name = c.name
where not exists (
  select 1 from cra_combo_rules x where x.combo_id = c.id and x.category_id = r.category_id
);
