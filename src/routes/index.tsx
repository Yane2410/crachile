import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { MenuPage } from "@/components/menu-page";
import { getCatalog } from "@/lib/cra/fns";

export const Route = createFileRoute("/")({
  loader: () => getCatalog(),
  component: Home,
});

function Home() {
  const initial = Route.useLoaderData();
  const { data } = useQuery({ queryKey: ["catalog"], queryFn: () => getCatalog(), initialData: initial });
  return <MenuPage catalog={data} />;
}
