-- CRA catalog + kitchen PIN. Unowned rows (no user accounts).
create table if not exists cra_meta (
  id int primary key default 1 check (id = 1),
  pin_hash text not null,
  pin_changed boolean not null default false,
  session_secret text not null,
  settings jsonb not null
);

create table if not exists cra_categories (
  id text primary key,
  name text not null,
  tagline text not null default '',
  sort_order int not null default 0,
  available boolean not null default true
);

create table if not exists cra_products (
  id serial primary key,
  category_id text not null references cra_categories(id),
  subcategory text,
  name text not null,
  description text not null default '',
  price int not null default 0,
  image_url text not null default '',
  available boolean not null default true,
  is_custom boolean not null default false,
  custom_kind text,
  sort_order int not null default 0
);

create table if not exists cra_ingredients (
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

create table if not exists cra_rate_events (
  id bigserial primary key,
  bucket text not null,
  created_at timestamptz not null default now()
);

create index if not exists cra_rate_events_bucket_idx
  on cra_rate_events (bucket, created_at);
