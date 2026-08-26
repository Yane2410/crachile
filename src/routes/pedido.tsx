import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckoutView } from "@/components/checkout-view";
import { getCatalog } from "@/lib/server/catalog";

export const Route = createFileRoute("/pedido")({
  loader: () => getCatalog(),
  component: PedidoPage,
});

function PedidoPage() {
  const initial = Route.useLoaderData();
  const { data } = useQuery({
    queryKey: ["catalog"],
    queryFn: () => getCatalog(),
    initialData: initial,
  });
  return <CheckoutView catalog={data} />;
}
