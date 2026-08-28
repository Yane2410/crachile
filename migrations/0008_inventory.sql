create table if not exists cra_inventory_items (
  id bigserial primary key,
  name text not null,
  unit text not null check (unit in ('g','kg','ml','l','unit')),
  quantity numeric(12,3) not null default 0 check (quantity >= 0),
  low_threshold numeric(12,3) not null default 0 check (low_threshold >= 0),
  available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists cra_inventory_items_name_uq on cra_inventory_items (lower(name));

create table if not exists cra_recipe_lines (
  id bigserial primary key,
  product_id bigint not null references cra_products(id) on delete cascade,
  inventory_item_id bigint not null references cra_inventory_items(id) on delete cascade,
  quantity numeric(12,3) not null check (quantity > 0),
  created_at timestamptz not null default now(),
  unique (product_id, inventory_item_id)
);

create index if not exists cra_recipe_lines_product_idx on cra_recipe_lines (product_id);
create index if not exists cra_recipe_lines_inventory_idx on cra_recipe_lines (inventory_item_id);
