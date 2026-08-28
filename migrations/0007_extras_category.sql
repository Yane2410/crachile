-- Extras are a normal catalog category so they can reuse the existing
-- product cards, availability controls and cart flow.
insert into cra_categories (id, name, tagline, sort_order, available)
values ('extras', 'Extras', 'Salsas y adicionales para completar tu pedido', 5, true)
on conflict (id) do update
set name = excluded.name,
    tagline = excluded.tagline,
    sort_order = excluded.sort_order,
    available = true;
