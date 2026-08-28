create table if not exists cra_orders (
  id bigserial primary key,
  status text not null default 'received' check (status in ('received','confirmed','preparing','ready','delivered','cancelled')),
  customer_name text not null,
  customer_phone text not null,
  delivery_address text not null,
  payment_method text not null,
  notes text not null default '',
  items jsonb not null,
  total integer not null check (total >= 0),
  inventory_consumed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists cra_orders_status_created_idx on cra_orders (status, created_at desc);
