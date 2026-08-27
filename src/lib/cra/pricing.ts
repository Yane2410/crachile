import { LIMITS } from "./limits.ts";
import { sanitizeLine } from "./sanitize.ts";
import type { CartDraft, Catalog, ComboSelection, CustomerInfo, Ingredient, OrderFail, OrderResult, PaymentMethod, Product, ValidatedComboItem, ValidatedLine } from "./types.ts";

function fail(code: string, error: string): OrderFail { return { ok: false, code, error }; }
function asInt(value: unknown): number | null { return typeof value === "number" && Number.isFinite(value) && Number.isInteger(value) ? value : null; }
function uniqueIds(raw: unknown): string[] | null {
  if (raw == null) return [];
  if (!Array.isArray(raw) || raw.length > 100) return null;
  const out: string[] = [], seen = new Set<string>();
  for (const item of raw) { if (typeof item !== "string") return null; const id = item.trim(); if (!id || id.length > 40 || seen.has(id)) return null; seen.add(id); out.push(id); }
  return out;
}
function empanadaPrice(ids: string[], ingredients: Ingredient[], catalog: Catalog): number | null {
  if (ids.length < 1 || ids.length > LIMITS.empanadaMax) return null; const seen = new Set<string>(); let premium = 0;
  for (const id of ids) { if (seen.has(id)) return null; seen.add(id); const ing = ingredients.find(x => x.id === id); if (!ing || !ing.available || !ing.empanadaOk) return null; if (ing.premium) premium += catalog.settings.empanadaPremium; }
  const base = ids.length === 1 ? catalog.settings.empanada1 : ids.length === 2 ? catalog.settings.empanada2 : catalog.settings.empanada3;
  return base >= 0 && premium >= 0 ? base + premium : null;
}
function fajitaPrice(ids: string[], ingredients: Ingredient[], catalog: Catalog): number | null {
  if (ids.length < 1 || ids.length > LIMITS.fajitaMax) return null; const seen = new Set<string>(); let extras = 0;
  for (const id of ids) { if (seen.has(id)) return null; seen.add(id); const ing = ingredients.find(x => x.id === id); if (!ing || !ing.available || !ing.fajitaOk || ing.fajitaPrice < 0) return null; extras += ing.fajitaPrice; }
  return catalog.settings.fajitaBase >= 0 ? catalog.settings.fajitaBase + extras : null;
}
function officialUnitPrice(product: Product, extraIds: string[], catalog: Catalog): number | null {
  if (product.isCustom && product.customKind === "empanada") { const p = empanadaPrice(extraIds, catalog.ingredients, catalog); return p && p > 0 ? p : null; }
  if (product.isCustom && product.customKind === "fajita") { const p = fajitaPrice(extraIds, catalog.ingredients, catalog); return p && p > 0 ? p : null; }
  return Number.isInteger(product.price) && product.price >= 0 ? product.price : null;
}
function pickDraft(raw: unknown): CartDraft | OrderFail {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return fail("shape", "El pedido no es válido.");
  const row = raw as Record<string, unknown>, productId = asInt(row.productId), qty = asInt(row.qty);
  if (productId == null || productId < 1) return fail("product", "Ese plato no existe.");
  if (qty == null || qty < LIMITS.qtyMin || qty > LIMITS.qtyMax) return fail("qty", "La cantidad no es válida.");
  const extraIds = uniqueIds(row.extraIds); if (!extraIds) return fail("extras", "Hay un ingrediente repetido o inválido.");
  const comboId = row.comboId == null ? undefined : asInt(row.comboId); if (row.comboId != null && (comboId == null || comboId < 1)) return fail("combo", "El combo no es válido.");
  let selections: ComboSelection[] | undefined;
  if (row.selections != null) {
    if (!Array.isArray(row.selections) || row.selections.length > 100) return fail("combo", "Las selecciones del combo no son válidas.");
    selections = [];
    for (const rawSelection of row.selections) {
      if (!rawSelection || typeof rawSelection !== "object" || Array.isArray(rawSelection)) return fail("combo", "Las selecciones del combo no son válidas.");
      const s = rawSelection as Record<string, unknown>, sid = asInt(s.productId), sextras = uniqueIds(s.extraIds);
      if (sid == null || sid < 1 || !sextras) return fail("combo", "Las selecciones del combo no son válidas.");
      selections.push({ productId: sid, extraIds: sextras });
    }
  }
  return { productId, extraIds, qty, note: typeof row.note === "string" ? row.note : "", comboId, selections };
}

function validateRegular(catalog: Catalog, productId: number, extraIds: string[], qty: number, note: string): OrderResult & { line?: ValidatedLine } {
  const product = catalog.products.find(p => p.id === productId); if (!product) return fail("product", "Ese plato no existe.");
  if (!product.available) return fail("unavailable", `${product.name} no está disponible.`);
  const category = catalog.categories.find(c => c.id === product.categoryId); if (!category?.available) return fail("unavailable", `${product.name} no está disponible.`);
  if (product.isCustom) {
    const max = product.customKind === "empanada" ? LIMITS.empanadaMax : LIMITS.fajitaMax;
    if (extraIds.length < 1) return fail("extras", "Elige al menos un ingrediente."); if (extraIds.length > max) return fail("extras", `Máximo ${max} ingredientes.`);
    const names: string[] = [];
    for (const id of extraIds) { const ing = catalog.ingredients.find(x => x.id === id); if (!ing) return fail("extras", "Hay un ingrediente que no existe."); if (!ing.available) return fail("extras", `${ing.name} no está disponible.`); if (product.customKind === "empanada" && !ing.empanadaOk) return fail("extras", `${ing.name} no va en empanada.`); if (product.customKind === "fajita" && !ing.fajitaOk) return fail("extras", `${ing.name} no va en fajita.`); names.push(ing.name); }
    const unit = officialUnitPrice(product, extraIds, catalog); if (unit == null) return fail("price", "No se pudo calcular el precio.");
    return { ok: true, lines: [], total: unit * qty, count: qty, line: { productId: product.id, name: product.name, categoryLabel: category.name, extraIds, extras: names, qty, note: sanitizeLine(note, LIMITS.maxNote), unitPrice: unit, lineTotal: unit * qty, imageUrl: product.imageUrl } };
  }
  if (extraIds.length) return fail("extras", "Este plato no lleva extras."); const unit = officialUnitPrice(product, [], catalog); if (unit == null) return fail("price", "No se pudo calcular el precio.");
  return { ok: true, lines: [], total: unit * qty, count: qty, line: { productId: product.id, name: product.name, categoryLabel: category.name, extraIds: [], extras: [], qty, note: sanitizeLine(note, LIMITS.maxNote), unitPrice: unit, lineTotal: unit * qty, imageUrl: product.imageUrl } };
}

function validateCombo(catalog: Catalog, comboId: number, selections: ComboSelection[], qty: number): OrderResult & { line?: ValidatedLine } {
  const combo = (catalog.combos ?? []).find(c => c.id === comboId && c.available); if (!combo) return fail("combo", "Ese combo no está disponible.");
  if (!Array.isArray(selections) || selections.length !== combo.rules.reduce((s, r) => s + r.quantity, 0)) return fail("combo", "Completa todas las selecciones del combo.");
  const remaining = combo.rules.map(r => ({ ...r, left: r.quantity })); const items: ValidatedComboItem[] = []; let subtotal = 0;
  for (const selection of selections) {
    const product = catalog.products.find(p => p.id === selection.productId); if (!product || !product.available) return fail("combo", "Uno de los productos seleccionados no está disponible.");
    const category = catalog.categories.find(c => c.id === product.categoryId); if (!category?.available) return fail("combo", "Una categoría del combo no está disponible.");
    const rule = remaining.find(r => r.categoryId === product.categoryId && r.left > 0); if (!rule) return fail("combo", "Las selecciones no cumplen las categorías del combo.");
    const validated = validateRegular(catalog, product.id, selection.extraIds ?? [], 1, ""); if (!validated.ok || !validated.line) return validated.ok ? fail("combo", "No se pudo validar una selección.") : validated;
    rule.left--; subtotal += validated.line.unitPrice;
    items.push({ productId: product.id, name: product.name, categoryLabel: category.name, qty: 1, unitPrice: validated.line.unitPrice, extraIds: validated.line.extraIds, extras: validated.line.extras });
  }
  if (remaining.some(r => r.left !== 0)) return fail("combo", "Completa todas las selecciones del combo.");
  let perCombo = subtotal, discount = 0;
  if (combo.benefitType === "fixed") discount = Math.min(subtotal, Math.max(0, combo.benefitValue));
  else if (combo.benefitType === "percent") discount = Math.min(subtotal, Math.round(subtotal * Math.max(0, combo.benefitValue) / 100));
  else perCombo = Math.max(0, Math.min(subtotal, combo.benefitValue));
  if (combo.benefitType !== "price") perCombo = subtotal - discount;
  const lineTotal = perCombo * qty;
  return { ok: true, lines: [], total: lineTotal, count: qty, line: { productId: items[0]?.productId ?? 1, name: combo.name, categoryLabel: "Combo", extraIds: [], extras: [], qty, note: "", unitPrice: perCombo, lineTotal, imageUrl: combo.imageUrl, comboId: combo.id, comboName: combo.name, comboItems: items, comboDiscount: discount * qty } };
}

export function validateLine(catalog: Catalog, raw: unknown): OrderResult & { line?: ValidatedLine } {
  const draft = pickDraft(raw); if (!draft.ok && draft.ok === false) return draft;
  const d = draft as CartDraft;
  if (d.comboId != null) return validateCombo(catalog, d.comboId, d.selections ?? [], d.qty);
  return validateRegular(catalog, d.productId, d.extraIds ?? [], d.qty, d.note ?? "");
}
export function validateOrder(catalog: Catalog, rawItems: unknown): OrderResult {
  if (!Array.isArray(rawItems) || rawItems.length < 1) return fail("empty", "El pedido está vacío."); if (rawItems.length > LIMITS.maxLines) return fail("size", "El pedido tiene demasiados ítems.");
  const lines: ValidatedLine[] = []; for (const raw of rawItems) { const result = validateLine(catalog, raw); if (!result.ok || !result.line) return result.ok ? fail("price", "No se pudo calcular el precio.") : result; lines.push(result.line); }
  const total = lines.reduce((sum, line) => sum + line.lineTotal, 0); if (!Number.isFinite(total) || total <= 0) return fail("total", "El total del pedido no es válido.");
  return { ok: true, lines, total, count: lines.reduce((sum, line) => sum + line.qty, 0) };
}
export function mozzarellaDelta(product: Product, catalogProducts: Product[]) { const match = product.name.match(/^(.*)\s*\+\s*Mozzarella\s*$/i); if (!match) return null; const baseName = match[1].trim(); const base = catalogProducts.find(p => p.name === baseName && p.categoryId === product.categoryId && p.available); if (!base) return null; const delta = product.price - base.price; return delta > 0 && delta <= 2000 ? { delta, baseName } : null; }
export function parseCustomerInfo(raw: unknown): { ok: true; info: CustomerInfo } | OrderFail { if (!raw || typeof raw !== "object" || Array.isArray(raw)) return fail("info", "Completa nombre, teléfono y dirección."); const row = raw as Record<string, unknown>; const name = sanitizeLine(row.name, LIMITS.maxName), address = sanitizeLine(row.address, LIMITS.maxAddress), notes = sanitizeLine(row.notes, LIMITS.maxObs), phone = sanitizeLine(row.phone, LIMITS.maxPhone), payment: PaymentMethod = row.payment === "transferencia" ? "transferencia" : "efectivo"; if (name.length < 2 || phone.replace(/\D/g, "").length < 8 || address.length < 6) return fail("info", "Completa nombre, teléfono y dirección."); return { ok: true, info: { name, phone, address, payment, notes } }; }
export function toOrderDraft(items: { productId: number; extraIds?: string[]; extras?: string[]; qty: number; note: string; comboId?: number; comboSelections?: ComboSelection[] }[], catalog?: Catalog) { return items.map(item => ({ productId: item.productId, extraIds: resolveExtraIds(item, catalog), qty: item.qty, note: item.note, ...(item.comboId ? { comboId: item.comboId, selections: item.comboSelections ?? [] } : {}) })); }
function resolveExtraIds(item: { extraIds?: string[]; extras?: string[] }, catalog?: Catalog): string[] { if (item.extraIds?.length) return item.extraIds; if (!catalog || !item.extras?.length) return []; return item.extras.map(name => catalog.ingredients.find(i => i.name.toLowerCase() === name.toLowerCase())?.id).filter((id): id is string => Boolean(id)); }
export function cartTotal(items: { productId: number; extraIds?: string[]; extras?: string[]; qty: number; note: string; comboId?: number; comboSelections?: ComboSelection[] }[], catalog: Catalog | undefined) { if (!catalog) return 0; return items.reduce((sum, item) => { const r = validateLine(catalog, { productId: item.productId, extraIds: resolveExtraIds(item, catalog), qty: item.qty, note: item.note, ...(item.comboId ? { comboId: item.comboId, selections: item.comboSelections ?? [] } : {}) }); return r.ok && r.line ? sum + r.line.lineTotal : sum; }, 0); }
export function lineUnitPrice(item: { productId: number; extraIds?: string[]; extras?: string[]; note: string; comboId?: number; comboSelections?: ComboSelection[] }, catalog: Catalog | undefined) { if (!catalog) return 0; const r = validateLine(catalog, { productId: item.productId, extraIds: resolveExtraIds(item, catalog), qty: 1, note: item.note, ...(item.comboId ? { comboId: item.comboId, selections: item.comboSelections ?? [] } : {}) }); return r.ok && r.line ? r.line.unitPrice : 0; }
