import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { adminConfirmOrder, adminGetOrders, type AdminOrder } from "@/lib/cra/orders-admin-fns";
import { formatClp } from "@/lib/cra/sanitize";

const STATUS_LABELS: Record<AdminOrder["status"], string> = {
  received: "Recibido",
  confirmed: "Confirmado",
  preparing: "Preparando",
  ready: "Listo",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" });
}

export function AdminOrdersPanel() {
  const queryClient = useQueryClient();
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const orders = useQuery({ queryKey: ["admin-orders"], queryFn: () => adminGetOrders(), refetchInterval: 20_000 });
  const confirm = useMutation({
    mutationFn: (id: number) => adminConfirmOrder({ data: { id } }),
    onSuccess: async (response) => {
      toast.success(`Pedido confirmado. ${response.result.consumed.length ? "Inventario descontado correctamente." : "Sin recetas de inventario asociadas."}`);
      await queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      await queryClient.invalidateQueries({ queryKey: ["catalog"] });
    },
    onError: (error: Error) => toast.error(error.message),
    onSettled: () => setConfirmingId(null),
  });

  return <section className="mt-6 rounded-[var(--radius-lg)] bg-surface p-4 shadow-[var(--shadow-border)]">
    <div className="flex items-center justify-between gap-3">
      <div><h2 className="font-display text-2xl font-semibold">Pedidos</h2><p className="mt-1 text-sm text-muted">Confirma aquí los pedidos aceptados. Al confirmar, CRA descuenta el inventario de forma atómica.</p></div>
      <Button variant="secondary" size="icon" aria-label="Actualizar pedidos" onClick={() => void orders.refetch()} disabled={orders.isFetching}><RefreshCw className={orders.isFetching ? "size-4 animate-spin" : "size-4"}/></Button>
    </div>
    {orders.isLoading ? <p className="mt-4 text-sm text-muted">Cargando pedidos…</p> : orders.isError ? <p className="mt-4 text-sm text-heart">No se pudieron cargar los pedidos. Revisa la sesión del Admin.</p> : orders.data?.length ? <div className="mt-4 space-y-3">{orders.data.map((order) => <article key={order.id} className="rounded-[var(--radius-md)] bg-bg p-4 shadow-[var(--shadow-border)]">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">Pedido #{order.id} · {STATUS_LABELS[order.status]}</p><p className="text-xs text-muted">{formatDate(order.createdAt)} · {order.customerName} · {order.customerPhone}</p></div><p className="font-semibold">{formatClp(order.total)}</p></div>
      <p className="mt-2 text-sm">📍 {order.deliveryAddress}</p>
      <p className="text-sm">💳 {order.paymentMethod}</p>
      <ul className="mt-3 space-y-1 text-sm">{order.items.map((item, index) => <li key={`${order.id}-${index}`}><strong>{item.qty}×</strong> {item.name}{item.extras?.length ? ` · ${item.extras.join(", ")}` : ""}{item.note ? ` · ${item.note}` : ""}</li>)}</ul>
      {order.notes ? <p className="mt-2 rounded-md bg-surface px-3 py-2 text-xs">Nota: {order.notes}</p> : null}
      {order.status === "received" ? <Button className="mt-4 w-full" disabled={confirm.isPending} onClick={() => { setConfirmingId(order.id); confirm.mutate(order.id); }}><Check className="size-4"/>{confirmingId === order.id ? "Confirmando…" : "Confirmar pedido y descontar inventario"}</Button> : order.inventoryConsumedAt ? <p className="mt-3 text-xs font-semibold text-muted">Inventario descontado · {formatDate(order.inventoryConsumedAt)}</p> : null}
    </article>)}</div> : <div className="mt-4 rounded-md bg-surface-2 px-4 py-6 text-center text-sm text-muted">No hay pedidos registrados todavía.</div>}
  </section>;
}
