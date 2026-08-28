import { getSql, type Sql } from "@/lib/db";
import { sanitizeLine } from "./sanitize";
import type { InventoryItem, InventorySnapshot, InventoryUnit } from "./types";

const UNITS: InventoryUnit[] = ["g", "kg", "ml", "l", "unit"];
const MAX_NAME_LENGTH = 120;
const MAX_QUANTITY = 1_000_000;
const MAX_LOW_THRESHOLD = 1_000_000;
const MAX_RECIPE_QUANTITY = 1_000_000;
type ItemRow = { id: number; name: string; unit: InventoryUnit; quantity: number | string; low_threshold: number | string; available: boolean };
type RecipeRow = { id: number; product_id: number; inventory_item_id: number; quantity: number | string };
const num = (v: unknown) => Number.isFinite(Number(v)) ? Number(v) : 0;
const mapItem = (r: ItemRow): InventoryItem => ({ id: num(r.id), name: r.name, unit: r.unit, quantity: num(r.quantity), lowThreshold: num(r.low_threshold), available: r.available === true });

export async function loadInventory(): Promise<InventorySnapshot> {
  const sql = await getSql();
  const items = await sql<ItemRow>`select id, name, unit, quantity, low_threshold, available from cra_inventory_items order by lower(name), id`;
  const recipes = await sql<RecipeRow>`select id, product_id, inventory_item_id, quantity from cra_recipe_lines order by product_id, id`;
  return { items: items.map(mapItem), recipes: recipes.map((r) => ({ id: num(r.id), productId: num(r.product_id), inventoryItemId: num(r.inventory_item_id), quantity: num(r.quantity) })) };
}

export async function createInventoryItem(input: { name: string; unit: InventoryUnit; quantity: number; lowThreshold: number }) {
  if (!UNITS.includes(input.unit)) throw new Error("Unidad de inventario inválida.");
  const name = sanitizeLine(input.name, MAX_NAME_LENGTH).trim();
  if (!name) throw new Error("El nombre del insumo es obligatorio.");
  const quantity = num(input.quantity);
  const lowThreshold = num(input.lowThreshold);
  if (!Number.isFinite(quantity) || quantity < 0 || quantity > MAX_QUANTITY) throw new Error("Cantidad de inventario inválida.");
  if (!Number.isFinite(lowThreshold) || lowThreshold < 0 || lowThreshold > MAX_LOW_THRESHOLD) throw new Error("Umbral de inventario inválido.");
  const sql = await getSql();
  await sql`insert into cra_inventory_items (name, unit, quantity, low_threshold) values (${name}, ${input.unit}, ${quantity}, ${lowThreshold})`;
  return loadInventory();
}

export async function patchInventoryItem(id: number, patch: Partial<{ name: string; unit: InventoryUnit; quantity: number; lowThreshold: number; available: boolean }>) {
  if (!Number.isInteger(id) || id < 1) throw new Error("Ese insumo no existe.");
  if (patch.unit !== undefined && !UNITS.includes(patch.unit)) throw new Error("Unidad de inventario inválida.");
  const name = patch.name === undefined ? undefined : sanitizeLine(patch.name, MAX_NAME_LENGTH).trim();
  if (name !== undefined && !name) throw new Error("El nombre del insumo es obligatorio.");
  const quantity = patch.quantity === undefined ? undefined : num(patch.quantity);
  const lowThreshold = patch.lowThreshold === undefined ? undefined : num(patch.lowThreshold);
  if (quantity !== undefined && (!Number.isFinite(quantity) || quantity < 0 || quantity > MAX_QUANTITY)) throw new Error("Cantidad de inventario inválida.");
  if (lowThreshold !== undefined && (!Number.isFinite(lowThreshold) || lowThreshold < 0 || lowThreshold > MAX_LOW_THRESHOLD)) throw new Error("Umbral de inventario inválido.");
  const sql = await getSql();
  await sql`update cra_inventory_items set name=coalesce(${name ?? null},name), unit=coalesce(${patch.unit ?? null},unit), quantity=coalesce(${quantity ?? null},quantity), low_threshold=coalesce(${lowThreshold ?? null},low_threshold), available=coalesce(${patch.available ?? null},available), updated_at=now() where id=${id}`;
  return loadInventory();
}

export async function deleteInventoryItem(id: number) {
  if (!Number.isInteger(id) || id < 1) throw new Error("Ese insumo no existe.");
  const sql = await getSql();
  await sql`delete from cra_inventory_items where id=${id}`;
  return loadInventory();
}

export async function setRecipeLine(productId: number, inventoryItemId: number, quantity: number) {
  if (!Number.isInteger(productId) || productId < 1 || !Number.isInteger(inventoryItemId) || inventoryItemId < 1) throw new Error("Producto o insumo inválido.");
  const qty = num(quantity);
  if (!Number.isFinite(qty) || qty <= 0 || qty > MAX_RECIPE_QUANTITY) throw new Error("El consumo de la receta es inválido.");
  const sql = await getSql();
  const products = await sql<{ id: number }>`select id from cra_products where id=${productId} limit 1`;
  if (products.length === 0) throw new Error("Ese producto no existe.");
  const items = await sql<{ id: number }>`select id from cra_inventory_items where id=${inventoryItemId} limit 1`;
  if (items.length === 0) throw new Error("Ese insumo no existe.");
  await sql`insert into cra_recipe_lines (product_id, inventory_item_id, quantity) values (${productId}, ${inventoryItemId}, ${qty}) on conflict (product_id, inventory_item_id) do update set quantity=excluded.quantity`;
  return loadInventory();
}

export async function deleteRecipeLine(id: number) {
  if (!Number.isInteger(id) || id < 1) throw new Error("Esa receta no existe.");
  const sql = await getSql();
  await sql`delete from cra_recipe_lines where id=${id}`;
  return loadInventory();
}

type InventoryOrderLine = { productId: number; qty: number };
type LockedInventoryRow = { id: number; name: string; unit: InventoryUnit; quantity: number | string; available: boolean };
type Consumption = { inventoryItemId: number; name: string; unit: InventoryUnit; quantity: number };

type ConsumeResult = { ok: true; consumed: Consumption[] } | { ok: false; error: string };

function validateOrderLines(lines: InventoryOrderLine[]) {
  if (!Array.isArray(lines) || lines.length === 0) return { ok: false as const, error: "El pedido no contiene productos." };
  if (lines.length > 100) return { ok: false as const, error: "El pedido contiene demasiadas líneas." };
  const normalized = new Map<number, number>();
  for (const line of lines) {
    if (!Number.isInteger(line.productId) || line.productId < 1 || !Number.isInteger(line.qty) || line.qty < 1 || line.qty > 1000) return { ok: false as const, error: "Una línea del pedido no es válida." };
    const total = (normalized.get(line.productId) ?? 0) + line.qty;
    if (total > 1000) return { ok: false as const, error: "La cantidad solicitada no es válida." };
    normalized.set(line.productId, total);
  }
  return { ok: true as const, normalized };
}

/** Performs consumption inside an already-open transaction. */
export async function consumeInventoryForOrderTx(tx: Sql, lines: InventoryOrderLine[]): Promise<ConsumeResult> {
  const validation = validateOrderLines(lines);
  if (!validation.ok) return validation;
  const productIds = [...validation.normalized.keys()];
  const recipeRows = await tx<RecipeRow>`select id, product_id, inventory_item_id, quantity from cra_recipe_lines where product_id = any(${productIds}) order by inventory_item_id, product_id, id`;
  const required = new Map<number, number>();
  for (const recipe of recipeRows) {
    const productQty = validation.normalized.get(recipe.product_id) ?? 0;
    const recipeQty = num(recipe.quantity);
    if (!Number.isFinite(recipeQty) || recipeQty <= 0 || recipeQty > MAX_RECIPE_QUANTITY) return { ok: false, error: "Una receta contiene un consumo inválido." };
    const needed = recipeQty * productQty;
    if (!Number.isSafeInteger(Math.trunc(needed)) && !Number.isFinite(needed)) return { ok: false, error: "El consumo calculado no es válido." };
    required.set(recipe.inventory_item_id, (required.get(recipe.inventory_item_id) ?? 0) + needed);
  }
  if (required.size === 0) return { ok: true, consumed: [] };
  const inventoryIds = [...required.keys()];
  const rows = await tx<LockedInventoryRow>`select id, name, unit, quantity, available from cra_inventory_items where id = any(${inventoryIds}) order by id for update`;
  const byId = new Map(rows.map((row) => [row.id, row]));
  for (const [inventoryItemId, needed] of required) {
    const row = byId.get(inventoryItemId);
    if (!row) return { ok: false, error: "Un insumo de la receta ya no existe." };
    if (!Number.isFinite(needed) || needed <= 0 || needed > MAX_QUANTITY) return { ok: false, error: "El consumo calculado no es válido." };
    if (!row.available) return { ok: false, error: `El insumo ${row.name} no está disponible.` };
    if (num(row.quantity) < needed) return { ok: false, error: `Stock insuficiente de ${row.name}. Disponible: ${num(row.quantity)} ${row.unit}; necesario: ${needed} ${row.unit}.` };
  }
  const consumed: Consumption[] = [];
  for (const [inventoryItemId, needed] of required) {
    const row = byId.get(inventoryItemId)!;
    await tx`update cra_inventory_items set quantity = quantity - ${needed}, updated_at = now() where id = ${inventoryItemId}`;
    consumed.push({ inventoryItemId, name: row.name, unit: row.unit, quantity: needed });
  }
  return { ok: true, consumed };
}

/** Safely consumes inventory in its own transaction for callers that already have an accepted order. */
export async function consumeInventoryForOrder(lines: InventoryOrderLine[]): Promise<ConsumeResult> {
  const sql = await getSql();
  try {
    return await sql.transaction((tx) => consumeInventoryForOrderTx(tx, lines));
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "No se pudo descontar el inventario." };
  }
}
