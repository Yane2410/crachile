import { LIMITS } from "./limits.ts";
import { sanitizeLine } from "./sanitize.ts";
import type {
  CartDraft,
  Catalog,
  CustomerInfo,
  Ingredient,
  OrderFail,
  OrderResult,
  PaymentMethod,
  Product,
  ValidatedLine,
} from "./types.ts";

function fail(code: string, error: string): OrderFail {
  return { ok: false, code, error };
}

function asInt(value: unknown): number | null {
  if (typeof value === "number") {
    if (!Number.isFinite(value) || !Number.isInteger(value)) return null;
    return value;
  }
  return null;
}

function uniqueIds(raw: unknown): string[] | null {
  if (raw == null) return [];
  if (!Array.isArray(raw)) return null;
  if (raw.length > 100) return null;
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (typeof item !== "string") return null;
    const id = item.trim();
    if (!id || id.length > 40) return null;
    if (seen.has(id)) return null;
    seen.add(id);
    out.push(id);
  }
  return out;
}

function empanadaPrice(ids: string[], ingredients: Ingredient[], catalog: Catalog): number | null {
  if (ids.length < 1 || ids.length > LIMITS.empanadaMax) return null;
  const seen = new Set<string>();
  let premium = 0;
  for (const id of ids) {
    if (seen.has(id)) return null;
    seen.add(id);
    const ing = ingredients.find((x) => x.id === id);
    if (!ing || !ing.available || !ing.empanadaOk) return null;
    if (ing.premium) premium += catalog.settings.empanadaPremium;
  }
  const base =
    ids.length === 1
      ? catalog.settings.empanada1
      : ids.length === 2
        ? catalog.settings.empanada2
        : catalog.settings.empanada3;
  if (base < 0 || premium < 0) return null;
  return base + premium;
}

function fajitaPrice(ids: string[], ingredients: Ingredient[], catalog: Catalog): number | null {
  if (ids.length < 1 || ids.length > LIMITS.fajitaMax) return null;
  const seen = new Set<string>();
  let extras = 0;
  for (const id of ids) {
    if (seen.has(id)) return null;
    seen.add(id);
    const ing = ingredients.find((x) => x.id === id);
    if (!ing || !ing.available || !ing.fajitaOk || ing.fajitaPrice < 0) return null;
    extras += ing.fajitaPrice;
  }
  if (catalog.settings.fajitaBase < 0) return null;
  return catalog.settings.fajitaBase + extras;
}

function officialUnitPrice(product: Product, extraIds: string[], catalog: Catalog): number | null {
  if (product.isCustom && product.customKind === "empanada") {
    const price = empanadaPrice(extraIds, catalog.ingredients, catalog);
    return price && price > 0 ? price : null;
  }
  if (product.isCustom && product.customKind === "fajita") {
    const price = fajitaPrice(extraIds, catalog.ingredients, catalog);
    return price && price > 0 ? price : null;
  }
  if (!Number.isInteger(product.price) || product.price < 0) return null;
  return product.price;
}

function pickDraft(raw: unknown): CartDraft | OrderFail {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return fail("shape", "El pedido no es válido.");
  }
  const row = raw as Record<string, unknown>;
  const productId = asInt(row.productId);
  const qty = asInt(row.qty);
  if (productId == null || productId < 1) return fail("product", "Ese plato no existe.");
  if (qty == null) return fail("qty", "La cantidad no es válida.");
  if (qty < LIMITS.qtyMin) return fail("qty", "La cantidad no es válida.");
  if (qty > LIMITS.qtyMax) return fail("qty", "La cantidad no es válida.");
  const extraIds = uniqueIds(row.extraIds);
  if (!extraIds) return fail("extras", "Hay un ingrediente repetido o inválido.");
  return {
    productId,
    extraIds,
    qty,
    note: typeof row.note === "string" ? row.note : "",
  };
}

export function validateLine(catalog: Catalog, raw: unknown): OrderResult & { line?: ValidatedLine } {
  const draft = pickDraft(raw);
  if ("ok" in draft && draft.ok === false) return draft;

  const { productId, extraIds = [], qty, note } = draft as CartDraft;
  const product = catalog.products.find((p) => p.id === productId);
  if (!product) return fail("product", "Ese plato no existe.");
  if (!product.available) return fail("unavailable", `${product.name} no está disponible.`);
  const category = catalog.categories.find((c) => c.id === product.categoryId);
  if (!category?.available) return fail("unavailable", `${product.name} no está disponible.`);

  if (product.isCustom) {
    const max = product.customKind === "empanada" ? LIMITS.empanadaMax : LIMITS.fajitaMax;
    if (extraIds.length < 1) return fail("extras", "Elige al menos un ingrediente.");
    if (extraIds.length > max) return fail("extras", `Máximo ${max} ingredientes.`);
    const names: string[] = [];
    for (const id of extraIds) {
      const ing = catalog.ingredients.find((x) => x.id === id);
      if (!ing) return fail("extras", "Hay un ingrediente que no existe.");
      if (!ing.available) return fail("extras", `${ing.name} no está disponible.`);
      if (product.customKind === "empanada" && !ing.empanadaOk) {
        return fail("extras", `${ing.name} no va en empanada.`);
      }
      if (product.customKind === "fajita" && !ing.fajitaOk) {
        return fail("extras", `${ing.name} no va en fajita.`);
      }
      names.push(ing.name);
    }
    const unit = officialUnitPrice(product, extraIds, catalog);
    if (unit == null) return fail("price", "No se pudo calcular el precio.");
    const cleanNote = sanitizeLine(note ?? "", LIMITS.maxNote);
    return {
      ok: true,
      lines: [],
      total: unit * qty,
      count: qty,
      line: {
        productId: product.id,
        name: product.name,
        categoryLabel: category.name,
        extraIds,
        extras: names,
        qty,
        note: cleanNote,
        unitPrice: unit,
        lineTotal: unit * qty,
        imageUrl: product.imageUrl,
      },
    };
  }

  if (extraIds.length > 0) return fail("extras", "Este plato no lleva extras.");
  const unit = officialUnitPrice(product, [], catalog);
  if (unit == null) return fail("price", "No se pudo calcular el precio.");
  const cleanNote = sanitizeLine(note ?? "", LIMITS.maxNote);
  return {
    ok: true,
    lines: [],
    total: unit * qty,
    count: qty,
    line: {
      productId: product.id,
      name: product.name,
      categoryLabel: category.name,
      extraIds: [],
      extras: [],
      qty,
      note: cleanNote,
      unitPrice: unit,
      lineTotal: unit * qty,
      imageUrl: product.imageUrl,
    },
  };
}

export function validateOrder(catalog: Catalog, rawItems: unknown): OrderResult {
  if (!Array.isArray(rawItems)) return fail("empty", "El pedido está vacío.");
  if (rawItems.length < 1) return fail("empty", "El pedido está vacío.");
  if (rawItems.length > LIMITS.maxLines) return fail("size", "El pedido tiene demasiados ítems.");
  const lines: ValidatedLine[] = [];
  for (const raw of rawItems) {
    const result = validateLine(catalog, raw);
    if (!result.ok || !result.line) return result.ok ? fail("price", "No se pudo calcular el precio.") : result;
    lines.push(result.line);
  }
  const total = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  if (!Number.isFinite(total) || total <= 0) return fail("total", "El total del pedido no es válido.");
  return {
    ok: true,
    lines,
    total,
    count: lines.reduce((sum, line) => sum + line.qty, 0),
  };
}

export function mozzarellaDelta(product: Product, catalogProducts: Product[]) {
  const match = product.name.match(/^(.*)\s*\+\s*Mozzarella\s*$/i);
  if (!match) return null;
  const baseName = match[1].trim();
  const base = catalogProducts.find(
    (p) => p.name === baseName && p.categoryId === product.categoryId && p.available,
  );
  if (!base) return null;
  const delta = product.price - base.price;
  if (delta <= 0 || delta > 2000) return null;
  return { delta, baseName };
}

export function parseCustomerInfo(raw: unknown): { ok: true; info: CustomerInfo } | OrderFail {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return fail("info", "Completa nombre, teléfono y dirección.");
  }
  const row = raw as Record<string, unknown>;
  const name = sanitizeLine(row.name, LIMITS.maxName);
  const address = sanitizeLine(row.address, LIMITS.maxAddress);
  const notes = sanitizeLine(row.notes, LIMITS.maxObs);
  const phone = sanitizeLine(row.phone, LIMITS.maxPhone);
  const payment: PaymentMethod = row.payment === "transferencia" ? "transferencia" : "efectivo";
  if (name.length < 2 || phone.replace(/\D/g, "").length < 8 || address.length < 6) {
    return fail("info", "Completa nombre, teléfono y dirección.");
  }
  return { ok: true, info: { name, phone, address, payment, notes } };
}

export function toOrderDraft(items: { productId: number; extraIds?: string[]; extras?: string[]; qty: number; note: string }[], catalog?: Catalog) {
  return items.map((item) => ({
    productId: item.productId,
    extraIds: resolveExtraIds(item, catalog),
    qty: item.qty,
    note: item.note,
  }));
}

function resolveExtraIds(
  item: { extraIds?: string[]; extras?: string[] },
  catalog?: Catalog,
): string[] {
  if (item.extraIds?.length) return item.extraIds;
  if (!catalog || !item.extras?.length) return [];
  const ids: string[] = [];
  for (const name of item.extras) {
    const ing = catalog.ingredients.find((x) => x.name.toLowerCase() === name.toLowerCase());
    if (ing) ids.push(ing.id);
  }
  return ids;
}

export function cartTotal(items: { productId: number; extraIds?: string[]; extras?: string[]; qty: number; note: string }[], catalog: Catalog | undefined) {
  if (!catalog) return 0;
  return items.reduce((sum, item) => {
    const result = validateLine(catalog, {
      productId: item.productId,
      extraIds: resolveExtraIds(item, catalog),
      qty: item.qty,
      note: item.note,
    });
    return result.ok && result.line ? sum + result.line.lineTotal : sum;
  }, 0);
}

export function lineUnitPrice(
  item: { productId: number; extraIds?: string[]; extras?: string[]; note: string },
  catalog: Catalog | undefined,
) {
  if (!catalog) return 0;
  const result = validateLine(catalog, {
    productId: item.productId,
    extraIds: resolveExtraIds(item, catalog),
    qty: 1,
    note: item.note,
  });
  return result.ok && result.line ? result.line.unitPrice : 0;
}
