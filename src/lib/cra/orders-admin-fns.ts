import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { confirmOrder, type OrderItem, type OrderStatus } from "./orders.server";

class ClientError extends Error {}

async function requireKitchen() {
  const { loadMeta } = await import("./catalog.server");
  const { readSession } = await import("./session.server");
  const meta = await loadMeta();
  if (!readSession(meta.sessionSecret)) throw new ClientError("Sesión expirada.");
}

export type AdminOrder = {
  id: number;
  status: OrderStatus;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  paymentMethod: string;
  notes: string;
  items: OrderItem[];
  total: number;
  inventoryConsumedAt: string | null;
  createdAt: string;
};

export const adminGetOrders = createServerFn({ method: "GET" }).handler(async () => {
  await requireKitchen();
  const sql = await getSql();
  const rows = await sql<{
    id: number;
    status: OrderStatus;
    customer_name: string;
    customer_phone: string;
    delivery_address: string;
    payment_method: string;
    notes: string;
    items: OrderItem[];
    total: number;
    inventory_consumed_at: string | null;
    created_at: string;
  }>`
    select id, status, customer_name, customer_phone, delivery_address, payment_method, notes, items, total, inventory_consumed_at, created_at
    from cra_orders
    order by case when status='received' then 0 when status='confirmed' then 1 when status='preparing' then 2 when status='ready' then 3 else 4 end, created_at desc
    limit 100
  `;
  return rows.map((row) => ({
    id: Number(row.id),
    status: row.status,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    deliveryAddress: row.delivery_address,
    paymentMethod: row.payment_method,
    notes: row.notes,
    items: Array.isArray(row.items) ? row.items : [],
    total: Number(row.total),
    inventoryConsumedAt: row.inventory_consumed_at,
    createdAt: row.created_at,
  })) satisfies AdminOrder[];
});

export const adminConfirmOrder = createServerFn({ method: "POST" })
  .validator((input: unknown) => input)
  .handler(async ({ data }) => {
    try {
      await requireKitchen();
      if (!data || typeof data !== "object") throw new ClientError("Pedido inválido.");
      const id = Number((data as Record<string, unknown>).id);
      if (!Number.isInteger(id) || id < 1) throw new ClientError("Pedido inválido.");
      return { ok: true as const, result: await confirmOrder(id) };
    } catch (error) {
      throw new ClientError(error instanceof Error ? error.message : "No se pudo confirmar el pedido.");
    }
  });
