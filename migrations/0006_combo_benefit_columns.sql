-- Align combo benefit columns with the Admin/API naming.
-- The original combo migration created price_mode/price_value;
-- the application now uses benefit_type/benefit_value.

alter table cra_combos
  rename column price_mode to benefit_type;

alter table cra_combos
  rename column price_value to benefit_value;

alter table cra_combos
  drop constraint if exists cra_combos_price_mode_check;

alter table cra_combos
  add constraint cra_combos_benefit_type_check
  check (benefit_type in ('fixed', 'percent', 'price'));
