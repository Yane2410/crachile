import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { MenuPage } from "@/components/menu-page";
import { getCatalog } from "@/lib/cra/fns";
import type { Catalog } from "@/lib/cra/types";

export const Route = createFileRoute("/")({
  loader: () => getCatalog(),
  component: Home,
});

function normalizeCatalog(catalog: Catalog): Catalog {
  return {
    ...catalog,
    products: (catalog?.products ?? []).filter((product): product is Catalog["products"][number] => Boolean(product)),
    ingredients: (catalog?.ingredients ?? []).filter((ingredient) => Boolean(ingredient)),
    combos: (catalog?.combos ?? []).filter((combo) => Boolean(combo)),
  };
}

function Home() {
  const initial = normalizeCatalog(Route.useLoaderData());
  const { data } = useQuery({ queryKey: ["catalog"], queryFn: () => getCatalog(), initialData: initial });
  return <MenuPage catalog={normalizeCatalog(data)} />;
}
