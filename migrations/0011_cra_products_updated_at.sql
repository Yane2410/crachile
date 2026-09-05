-- Keep cra_products compatible with deployments or database triggers that expect
-- a standard updated_at timestamp. Safe to run on existing installations.
alter table cra_products
  add column if not exists updated_at timestamptz not null default now();
