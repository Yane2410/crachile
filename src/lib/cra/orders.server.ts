import { getSql } from "@/lib/db";
import { consumeInventoryForOrder } from "./inventory.server";
import { sanitizeLine } from "./sanitize";

export type OrderStatus = "received" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled";
export type OrderItem = { productId: number; name: string; qty: number; unitPrice: number; extras?: string[]; note?: string };
export type NewOrder = {
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  paymentMethod: "efectivo" | "transferencia";
  notes?: string;
  items: OrderItem[];
  total: number;
};

type OrderRow = NewOrder & { id: number; status: OrderStatus; inventoryConsumedAt: string | null; createdAt: string; updatedAt: string };
const clean = (value: unknown, max: number) => sanitizeLine(String(value ?? ""), max).trim();

export async function createOrder(input: NewOrder) {
  if (!input.items?.length) throw new Error("El pedido no contiene productos.");
  const items = input.items.map((item) => ({
    productId: Number(item.productId), name: clean(item.name, 160), qty: Number(item.qty), unitPrice: Number(item.unitPrice),
    extras: Array.isArray(item.extras) ? item.extras.map((x) => clean(x, 120)).filter(Boolean).slice(0, 20) : [],
    note: clean(item.note, 500),
  }));
  if (items.some((item) => !Number.isInteger(item.productId) || item.productId < 1 || !Number.isInteger(item.qty) || item.qty < 1 || item.unitPrice < 0)) {
    throw new Error("El pedido contiene una línea inválida.");
  }
  const total = Math.max(0, Math.trunc(Number(input.total)));
  const sql = await getSql();
  const rows = await sql<{ id: number; status: OrderStatus; created_at: string }>`
    insert into cra_orders (customer_name, customer_phone, delivery_address, payment_method, notes, items, total)
    values (${clean(input.customerName, 120)}, ${clean(input.customerPhone, 40)}, ${clean(input.deliveryAddress, 240)}, ${input.paymentMethod}, ${clean(input.notes, 500)}, ${JSON.stringify(items)}::jsonb, ${total})
    returning id, status, created_at
  `;
  return rows[0];
}

export async function confirmOrder(id: number) {
  if (!Number.isInteger(id) || id < 1) throw new Error("Pedido inválido.");
  const sql = await getSql();
  return sql.transaction(async (tx) => {
    const rows = await tx<{ id: number; status: OrderStatus; items: OrderItem[]; inventory_consumed_at: string | null }>`
      select id, status, items, inventory_consumed_at from cra_orders where id=${id} for update
    `;
    const order = rows[0];
    if (!order) throw new Error("Pedido no encontrado.");
    if (order.status !== "received") throw new Error(`El pedido ya está en estado ${order.status}.`);
    if (order.inventory_consumed_at) throw new Error("El inventario de este pedido ya fue descontado.");

    const result = await consumeInventoryForOrder(order.items.map((item) => ({ productId: item.productId, qty: item.qty })));
    if (!result.ok) throw new Error(result.error);

    const updated = await tx<{ id: number; status: OrderStatus }>`
      update cra_orders set status='confirmed', inventory_consumed_at=now(), updated_at=now() where id=${id} and status='received' and inventory_consumed_at is null returning id, status
    `;
    if (!updated[0]) throw new Error("No se pudo confirmar el pedido.");
    return { ...updated[0], consumed: result.consumed };
  });
}
