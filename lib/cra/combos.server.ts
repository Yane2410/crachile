import { getSql } from "@/lib/db";
import { LIMITS } from "./limits";
import { sanitizeImage, sanitizeLine, sanitizeMultiline } from "./sanitize";
import type { Combo, CategoryId } from "./types";

type ComboRow = { id: number; name: string; description: string; price_mode: "fixed" | "percent" | "amount"; price_value: number; image_url: string; available: boolean; sort_order: number };
type RuleRow = { id: number; combo_id: number; category_id: CategoryId; quantity: number; label: string; sort_order: number };

function map(row: ComboRow, rules: RuleRow[]): Combo {
  return { id: row.id, name: row.name, description: row.description, priceMode: row.price_mode, priceValue: Number(row.price_value), imageUrl: row.image_url, available: row.available, sortOrder: Number(row.sort_order), rules: rules.filter((r) => r.combo_id === row.id).map((r) => ({ id: r.id, categoryId: r.category_id, quantity: Number(r.quantity), label: r.label, sortOrder: Number(r.sort_order) })) };
}
export async function loadCombos(): Promise<Combo[]> {
  const sql = await getSql();
  const rows = await sql<ComboRow>`select * from cra_combos order by sort_order, id`;
  const rules = await sql<RuleRow>`select * from cra_combo_rules order by combo_id, sort_order, id`;
  return rows.map((row) => map(row, rules));
}
function comboName(value: unknown) { const name = sanitizeLine(value, LIMITS.productName); if (name.length < 2) throw new Error("El nombre del combo no es válido."); return name; }
function comboDescription(value: unknown) { return sanitizeMultiline(typeof value === "string" ? value : "", LIMITS.productDescription); }
function comboMode(value: unknown): Combo["priceMode"] { if (value === "fixed" || value === "percent" || value === "amount") return value; throw new Error("Tipo de beneficio inválido."); }
function comboValue(mode: Combo["priceMode"], value: unknown) { const n = Number(value); if (!Number.isFinite(n) || n < 0) throw new Error("Valor del beneficio inválido."); const max = mode === "percent" ? 100 : 200_000; if (n > max) throw new Error("Valor del beneficio fuera de rango."); return Math.round(n); }
function rulesInput(value: unknown): Array<{ categoryId: CategoryId; quantity: number; label: string; sortOrder: number }> {
  if (!Array.isArray(value) || value.length < 1 || value.length > 8) throw new Error("Un combo necesita al menos una regla.");
  const allowed: CategoryId[] = ["empanadas", "fajitas", "papas", "bebidas"];
  return value.map((item, index) => {
    if (!item || typeof item !== "object") throw new Error("Regla inválida.");
    const row = item as Record<string, unknown>;
    if (typeof row.categoryId !== "string" || !allowed.includes(row.categoryId as CategoryId)) throw new Error("Categoría de regla inválida.");
    const quantity = Number(row.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) throw new Error("Cantidad de regla inválida.");
    return { categoryId: row.categoryId as CategoryId, quantity, label: sanitizeLine(typeof row.label === "string" ? row.label : "", 80), sortOrder: index * 10 };
  });
}
export async function createCombo(input: Record<string, unknown>) {
  const sql = await getSql(); const name = comboName(input.name); const description = comboDescription(input.description); const priceMode = comboMode(input.priceMode); const priceValue = comboValue(priceMode, input.priceValue); const imageUrl = typeof input.imageUrl === "string" && input.imageUrl ? sanitizeImage(input.imageUrl) : ""; const rules = rulesInput(input.rules);
  const rows = await sql<{ id: number }>`insert into cra_combos (name, description, price_mode, price_value, image_url, available, sort_order) values (${name}, ${description}, ${priceMode}, ${priceValue}, ${imageUrl}, false, 500) returning id`;
  for (const rule of rules) await sql`insert into cra_combo_rules (combo_id, category_id, quantity, label, sort_order) values (${rows[0].id}, ${rule.categoryId}, ${rule.quantity}, ${rule.label}, ${rule.sortOrder})`;
  return loadCombos();
}
export async function patchCombo(id: number, input: Record<string, unknown>) {
  const sql = await getSql(); const current = await sql<ComboRow>`select * from cra_combos where id = ${id}`; if (!current[0]) throw new Error("Ese combo no existe."); const row = current[0];
  const name = input.name === undefined ? row.name : comboName(input.name); const description = input.description === undefined ? row.description : comboDescription(input.description); const priceMode = input.priceMode === undefined ? row.price_mode : comboMode(input.priceMode); const priceValue = input.priceValue === undefined ? Number(row.price_value) : comboValue(priceMode, input.priceValue); const imageUrl = input.imageUrl === undefined ? row.image_url : (typeof input.imageUrl === "string" ? sanitizeImage(input.imageUrl) : row.image_url); const available = input.available === undefined ? row.available : Boolean(input.available);
  await sql`update cra_combos set name=${name}, description=${description}, price_mode=${priceMode}, price_value=${priceValue}, image_url=${imageUrl}, available=${available}, updated_at=now() where id=${id}`;
  if (input.rules !== undefined) { const rules = rulesInput(input.rules); await sql`delete from cra_combo_rules where combo_id=${id}`; for (const rule of rules) await sql`insert into cra_combo_rules (combo_id, category_id, quantity, label, sort_order) values (${id}, ${rule.categoryId}, ${rule.quantity}, ${rule.label}, ${rule.sortOrder})`; }
  return loadCombos();
}
export async function deleteCombo(id: number) { const sql = await getSql(); await sql`delete from cra_combos where id=${id}`; return loadCombos(); }
