import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MenuView } from "@/components/menu-view";
import { getCatalog } from "@/lib/server/catalog";

export const Route = createFileRoute("/")({
  loader: () => getCatalog(),
  component: Home,
});

function Home() {
  const initial = Route.useLoaderData();
  const { data } = useQuery({
    queryKey: ["catalog"],
    queryFn: () => getCatalog(),
    initialData: initial,
  });
  return <MenuView catalog={data} />;
}
