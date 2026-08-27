create table if not exists cra_combos (
  id bigserial primary key,
  name text not null,
  description text not null default '',
  image_url text not null default '',
  benefit_type text not null check (benefit_type in ('fixed','percent','price')),
  benefit_value integer not null default 0 check (benefit_value >= 0),
  available boolean not null default false,
  sort_order integer not null default 500,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists cra_combo_rules (
  id bigserial primary key,
  combo_id bigint not null references cra_combos(id) on delete cascade,
  category_id text not null references cra_categories(id) on delete restrict,
  quantity integer not null check (quantity between 1 and 20),
  sort_order integer not null default 0
);

create index if not exists cra_combo_rules_combo_idx on cra_combo_rules(combo_id, sort_order, id);
create index if not exists cra_combos_available_idx on cra_combos(available, sort_order, id);
