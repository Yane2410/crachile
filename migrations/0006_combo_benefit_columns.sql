-- Safely align the production combo schema with the Admin/API naming.
-- Some production rows were created with the legacy benefit labels.

-- Remove the legacy CHECK before changing the column names/values.
alter table cra_combos
  drop constraint if exists cra_combos_price_mode_check;
alter table cra_combos
  drop constraint if exists cra_combos_benefit_type_check;

-- Rename only when the legacy columns still exist. The migration is intentionally
-- idempotent so a partially prepared database can be deployed safely.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'cra_combos' and column_name = 'price_mode'
  ) and not exists (
    select 1 from information_schema.columns
    where table_name = 'cra_combos' and column_name = 'benefit_type'
  ) then
    alter table cra_combos rename column price_mode to benefit_type;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_name = 'cra_combos' and column_name = 'price_value'
  ) and not exists (
    select 1 from information_schema.columns
    where table_name = 'cra_combos' and column_name = 'benefit_value'
  ) then
    alter table cra_combos rename column price_value to benefit_value;
  end if;
end $$;

-- Convert legacy labels to the three canonical CRA benefit modes.
-- Unknown legacy modes are treated as a final-price benefit so their numeric
-- value is preserved rather than silently becoming a discount.
update cra_combos
set benefit_type = case
  when lower(trim(benefit_type)) in ('fixed', 'fixed_discount', 'discount_fixed', 'amount', 'monto') then 'fixed'
  when lower(trim(benefit_type)) in ('percent', 'percentage', 'percent_discount', 'discount_percent', 'porcentaje') then 'percent'
  when lower(trim(benefit_type)) in ('price', 'final_price', 'fixed_price', 'precio', 'precio_final') then 'price'
  else 'price'
end
where benefit_type is not null;

alter table cra_combos
  add constraint cra_combos_benefit_type_check
  check (benefit_type in ('fixed', 'percent', 'price'));
