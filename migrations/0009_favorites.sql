alter table cra_products add column if not exists is_favorite boolean not null default false;

update cra_products
set is_favorite = true
where name in ('Mechada + Plátano + Llanero', 'Pabellón', 'Fajita Rezar');
