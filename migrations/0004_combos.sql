-- CRA combos are normal catalog products so they reuse the existing
-- photo, price, description and availability controls in Admin.
insert into cra_categories (id, name, tagline, sort_order, available)
values ('combos', 'Combos', 'Más por menos, sin complicar tu pedido', 0, true)
on conflict (id) do nothing;

insert into cra_products (
  category_id, subcategory, name, description, price, image_url,
  available, is_custom, custom_kind, sort_order
)
select 'combos', 'CRA', v.name, v.description, v.price, '', v.available, false, null, v.sort_order
from (values
  ('Combo Individual', '2 empanadas clásicas a elección + 1 bebida en lata.', 6500, true, 10),
  ('Combo Doble', '4 empanadas clásicas a elección + 2 bebidas en lata.', 11500, true, 20),
  ('Combo Fajita', '1 Fajita Comer + 1 bebida en lata.', 4900, true, 30),
  ('Combo CRA', '2 empanadas clásicas + 1 Fajita Comer + 1 bebida en lata.', 9900, true, 40),
  ('Combo Fajita + Papas', '1 Fajita Comer + papas fritas pequeñas + 1 bebida en lata.', 6900, false, 50)
) as v(name, description, price, available, sort_order)
where not exists (
  select 1 from cra_products p
  where p.category_id = 'combos' and p.name = v.name
);
