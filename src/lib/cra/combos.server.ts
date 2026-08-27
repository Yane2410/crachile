import { getSql } from "@/lib/db";
import { LIMITS } from "./limits";
import { sanitizeImage, sanitizeLine, sanitizeMultiline } from "./combo-sanitize";
import type { CategoryId, Combo, ComboBenefitType, ComboRule } from "./types";

type ComboRow = {
  id: number;
  name: string;
  description: string;
  image_url: string;
  benefit_type: ComboBenefitType;
  benefit_value: number;
  available: boolean;
  sort_order: number;
};

type RuleRow = { id: number; combo_id: number; category_id: CategoryId; quantity: number; sort_order: number };

function asInt(v: unknown, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function asBool(v: unknown) { return v === true || v === "t" || v === "true"; }

function mapCombo(row: ComboRow, rules: RuleRow[]): Combo {
  return {
    id: asInt(row.id), name: row.name, description: row.description, imageUrl: row.image_url,
    benefitType: row.benefit_type, benefitValue: asInt(row.benefit_value), available: asBool(row.available),
    sortOrder: asInt(row.sort_order),
    rules: rules.filter((r) => asInt(r.combo_id) === asInt(row.id)).map((r) => ({
      id: asInt(r.id), categoryId: r.category_id, quantity: asInt(r.quantity), sortOrder: asInt(r.sort_order),
    })),
  };
}

export async function loadCombos(): Promise<Combo[]> {
  const sql = await getSql();
  const rows = await sql<ComboRow>`select * from cra_combos order by sort_order, id`;
  const rules = rows.length ? await sql<RuleRow>`select * from cra_combo_rules where combo_id = any(${rows.map((r) => r.id)}::bigint[]) order by sort_order, id` : [];
  return rows.map((r) => mapCombo(r, rules));
}

function validateBenefit(type: unknown, value: unknown): { type: ComboBenefitType; value: number } {
  if (type !== "fixed" && type !== "percent" && type !== "price") throw new Error("Tipo de beneficio inválido.");
  const n = Math.round(Number(value));
  if (!Number.isFinite(n) || n < 0) throw new Error("El beneficio no es válido.");
  if (type === "percent" && n > 100) throw new Error("El descuento no puede superar 100%.");
  if ((type === "fixed" || type === "price") && n > 200_000) throw new Error("El monto del beneficio no es válido.");
  return { type, value: n };
}

function normalizeRules(input: unknown): Array<{ categoryId: CategoryId; quantity: number; sortOrder: number }> {
  if (!Array.isArray(input) || input.length < 1 || input.length > 8) throw new Error("Un combo debe tener entre 1 y 8 reglas.");
  return input.map((raw, index) => {
    if (!raw || typeof raw !== "object") throw new Error("Regla inválida.");
    const r = raw as Record<string, unknown>;
    const categoryId = r.categoryId;
    if (!["empanadas", "fajitas", "papas", "bebidas"].includes(String(categoryId))) throw new Error("Categoría de combo inválida.");
    const quantity = Math.trunc(Number(r.quantity));
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) throw new Error("Cantidad de regla inválida.");
    return { categoryId: categoryId as CategoryId, quantity, sortOrder: index };
  });
}

export async function createCombo(input: {
  name: string; description?: string; imageUrl?: string; benefitType: ComboBenefitType; benefitValue: number;
  available?: boolean; rules: unknown;
}) {
  const name = sanitizeLine(input.name, LIMITS.productName);
  if (name.length < 2) throw new Error("El nombre del combo no es válido.");
  const benefit = validateBenefit(input.benefitType, input.benefitValue);
  const rules = normalizeRules(input.rules);
  const sql = await getSql();
  const rows = await sql<{ id: number }>`insert into cra_combos (name, description, image_url, benefit_type, benefit_value, available, sort_order) values (${name}, ${sanitizeMultiline(input.description ?? "", LIMITS.productDescription)}, ${input.imageUrl ? sanitizeImage(input.imageUrl) : ""}, ${benefit.type}, ${benefit.value}, ${Boolean(input.available)}, 500) returning id`;
  const id = asInt(rows[0]?.id);
  for (const rule of rules) await sql`insert into cra_combo_rules (combo_id, category_id, quantity, sort_order) values (${id}, ${rule.categoryId}, ${rule.quantity}, ${rule.sortOrder})`;
  return loadCombos();
}

export async function updateCombo(id: number, input: {
  name?: string; description?: string; imageUrl?: string; benefitType?: ComboBenefitType; benefitValue?: number;
  available?: boolean; rules?: unknown;
}) {
  const current = (await loadCombos()).find((c) => c.id === id);
  if (!current) throw new Error("Ese combo no existe.");
  const name = sanitizeLine(input.name ?? current.name, LIMITS.productName);
  const type = input.benefitType ?? current.benefitType;
  const value = input.benefitValue ?? current.benefitValue;
  const benefit = validateBenefit(type, value);
  const rules = input.rules === undefined ? current.rules : normalizeRules(input.rules);
  const sql = await getSql();
  await sql`update cra_combos set name=${name || current.name}, description=${sanitizeMultiline(input.description ?? current.description, LIMITS.productDescription)}, image_url=${input.imageUrl === undefined ? current.imageUrl : sanitizeImage(input.imageUrl)}, benefit_type=${benefit.type}, benefit_value=${benefit.value}, available=${input.available === undefined ? current.available : Boolean(input.available)}, updated_at=now() where id=${id}`;
  if (input.rules !== undefined) {
    await sql`delete from cra_combo_rules where combo_id=${id}`;
    for (const rule of rules) await sql`insert into cra_combo_rules (combo_id, category_id, quantity, sort_order) values (${id}, ${rule.categoryId}, ${rule.quantity}, ${rule.sortOrder})`;
  }
  return loadCombos();
}

export async function deleteCombo(id: number) {
  const sql = await getSql();
  await sql`delete from cra_combos where id=${id}`;
  return loadCombos();
}
