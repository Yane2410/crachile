import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PedidoPage } from "@/components/pedido-page";
import { getCatalog } from "@/lib/cra/fns";

export const Route = createFileRoute("/pedido")({
  loader: () => getCatalog(),
  component: Pedido,
});

function Pedido() {
  const initial = Route.useLoaderData();
  const { data } = useQuery({ queryKey: ["catalog"], queryFn: () => getCatalog(), initialData: initial });
  return <PedidoPage catalog={data} />;
}
