import { createServerFn } from "@tanstack/react-start";
import { loadMeta } from "./catalog.server";
import { readSession } from "./session.server";
import { createInventoryItem, deleteInventoryItem, deleteRecipeLine, loadInventory, patchInventoryItem, setRecipeLine } from "./inventory.server";
import type { InventoryUnit } from "./types";

class ClientError extends Error {}
const dataOf = (data: unknown) => data && typeof data === "object" && !Array.isArray(data) ? data as Record<string, unknown> : null;

async function requireKitchen() {
  const meta = await loadMeta();
  if (!readSession(meta.sessionSecret)) throw new ClientError("Sesión expirada.");
}

export const adminGetInventory = createServerFn({ method: "GET" }).handler(async () => { await requireKitchen(); return loadInventory(); });

export const adminCreateInventoryItem = createServerFn({ method: "POST" }).validator((input: unknown) => input).handler(async ({ data }) => {
  try {
    await requireKitchen(); const row = dataOf(data); if (!row) throw new ClientError("Datos inválidos.");
    return createInventoryItem({ name: String(row.name ?? ""), unit: row.unit as InventoryUnit, quantity: Number(row.quantity ?? 0), lowThreshold: Number(row.lowThreshold ?? 0) });
  } catch (error) { throw new ClientError(error instanceof ClientError ? error.message : error instanceof Error ? error.message : "No se pudo crear el insumo."); }
});

export const adminPatchInventoryItem = createServerFn({ method: "POST" }).validator((input: unknown) => input).handler(async ({ data }) => {
  try {
    await requireKitchen(); const row = dataOf(data); if (!row) throw new ClientError("Datos inválidos."); const id = Number(row.id); if (!Number.isInteger(id) || id < 1) throw new ClientError("Ese insumo no existe.");
    return patchInventoryItem(id, { name: typeof row.name === "string" ? row.name : undefined, unit: row.unit as InventoryUnit | undefined, quantity: row.quantity === undefined ? undefined : Number(row.quantity), lowThreshold: row.lowThreshold === undefined ? undefined : Number(row.lowThreshold), available: typeof row.available === "boolean" ? row.available : undefined });
  } catch (error) { throw new ClientError(error instanceof ClientError ? error.message : error instanceof Error ? error.message : "No se pudo guardar el insumo."); }
});

export const adminDeleteInventoryItem = createServerFn({ method: "POST" }).validator((input: unknown) => input).handler(async ({ data }) => {
  try { await requireKitchen(); const row = dataOf(data); const id = Number(row?.id); return deleteInventoryItem(id); }
  catch (error) { throw new ClientError(error instanceof Error ? error.message : "No se pudo eliminar el insumo."); }
});

export const adminSetRecipeLine = createServerFn({ method: "POST" }).validator((input: unknown) => input).handler(async ({ data }) => {
  try { await requireKitchen(); const row = dataOf(data); if (!row) throw new ClientError("Datos inválidos."); return setRecipeLine(Number(row.productId), Number(row.inventoryItemId), Number(row.quantity)); }
  catch (error) { throw new ClientError(error instanceof Error ? error.message : "No se pudo guardar el consumo."); }
});

export const adminDeleteRecipeLine = createServerFn({ method: "POST" }).validator((input: unknown) => input).handler(async ({ data }) => {
  try { await requireKitchen(); const row = dataOf(data); return deleteRecipeLine(Number(row?.id)); }
  catch (error) { throw new ClientError(error instanceof Error ? error.message : "No se pudo quitar el consumo."); }
});
