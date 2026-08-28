import { getSql } from "@/lib/db";
import type { CategoryId, Catalog } from "./types";

const CATEGORY_IDS: CategoryId[] = ["combos", "empanadas", "fajitas", "papas", "bebidas", "extras"];

function assertCategoryId(value: string): asserts value is CategoryId {
  if (!CATEGORY_IDS.includes(value as CategoryId)) throw new Error("Categoría inválida.");
}

export async function patchCategory(id: string, patch: { sortOrder?: number; available?: boolean; name?: string; tagline?: string }) {
  assertCategoryId(id);
  const sql = await getSql();
  if (patch.sortOrder !== undefined && (!Number.isFinite(patch.sortOrder) || patch.sortOrder < 0)) throw new Error("Orden inválido.");
  if (patch.name !== undefined && !patch.name.trim()) throw new Error("El nombre de la categoría no puede quedar vacío.");
  await sql`update cra_categories set
    sort_order = coalesce(${patch.sortOrder ?? null}, sort_order),
    available = coalesce(${patch.available ?? null}, available),
    name = coalesce(${patch.name?.trim() ?? null}, name),
    tagline = coalesce(${patch.tagline?.trim() ?? null}, tagline)
    where id = ${id}`;
  const { loadCatalog } = await import("./catalog.server");
  return loadCatalog();
}

export async function reorderCategories(orderedIds: string[]) {
  if (orderedIds.length !== CATEGORY_IDS.length || new Set(orderedIds).size !== CATEGORY_IDS.length || orderedIds.some((id) => !CATEGORY_IDS.includes(id as CategoryId))) {
    throw new Error("El orden de categorías no es válido.");
  }
  const sql = await getSql();
  await sql.begin(async (tx) => {
    for (let index = 0; index < orderedIds.length; index++) await tx`update cra_categories set sort_order=${index + 1} where id=${orderedIds[index]}`;
  });
  const { loadCatalog } = await import("./catalog.server");
  return loadCatalog();
}

export async function reorderProducts(categoryId: string, orderedIds: number[]) {
  assertCategoryId(categoryId);
  if (!orderedIds.length || new Set(orderedIds).size !== orderedIds.length) throw new Error("El orden de productos no es válido.");
  const sql = await getSql();
  await sql.begin(async (tx) => {
    for (let index = 0; index < orderedIds.length; index++) await tx`update cra_products set sort_order=${index + 1} where id=${orderedIds[index]} and category_id=${categoryId}`;
  });
  const { loadCatalog } = await import("./catalog.server");
  return loadCatalog();
}
