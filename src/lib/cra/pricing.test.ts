import assert from "node:assert/strict";
import test from "node:test";
import { seedCatalog } from "./seed.ts";
import { jsonSize, sanitizeLine } from "./sanitize.ts";
import { parseCustomerInfo, validateLine, validateOrder } from "./pricing.ts";
import { buildWhatsappMessage } from "./whatsapp.ts";
import { LIMITS } from "./limits.ts";

const catalog = seedCatalog(false);
const pollo = catalog.products.find((p) => p.name === "Pollo")!;
const armaEmp = catalog.products.find((p) => p.customKind === "empanada")!;
const armaFaj = catalog.products.find((p) => p.customKind === "fajita")!;
const papas = catalog.products.find((p) => p.name === "Papas fritas pequeñas")!;

const info = {
  name: "Ana Pérez",
  phone: "912345678",
  address: "Calle Falsa 123, Talca",
  payment: "efectivo" as const,
  notes: "",
};

test("1. ignores client-sent product price (DevTools)", () => {
  const result = validateLine(catalog, {
    productId: pollo.id,
    qty: 2,
    extraIds: [],
    unitPrice: 1,
    price: 0,
    total: 0,
  });
  assert.equal(result.ok, true);
  assert.equal(result.line?.unitPrice, 2800);
  assert.equal(result.line?.lineTotal, 5600);
});

test("2. ignores client-sent extra price on fajita", () => {
  const result = validateLine(catalog, {
    productId: armaFaj.id,
    qty: 1,
    extraIds: ["pollo"],
    extraPrice: 0,
    extras: [{ id: "pollo", price: 0 }],
    unitPrice: 1,
  });
  assert.equal(result.ok, true);
  assert.equal(result.line?.unitPrice, 2200 + 900);
});

test("3. rejects negative qty / ignores negative price", () => {
  assert.equal(validateLine(catalog, { productId: pollo.id, qty: -2, extraIds: [], price: -1 }).ok, false);
  const priced = validateLine(catalog, { productId: pollo.id, qty: 1, extraIds: [], price: -999 });
  assert.equal(priced.ok, true);
  assert.equal(priced.line?.unitPrice, 2800);
});

test("4. ignores price 0 from client when product is not free", () => {
  const result = validateLine(catalog, { productId: pollo.id, qty: 1, extraIds: [], price: 0, unitPrice: 0 });
  assert.equal(result.ok, true);
  assert.equal(result.line?.unitPrice, 2800);
});

test("5. ignores arbitrarily high or low client prices", () => {
  const low = validateLine(catalog, { productId: pollo.id, qty: 1, extraIds: [], unitPrice: 1 });
  const high = validateLine(catalog, { productId: pollo.id, qty: 1, extraIds: [], unitPrice: 999999 });
  assert.equal(low.line?.unitPrice, 2800);
  assert.equal(high.line?.unitPrice, 2800);
});

test("6. ignores modified subtotal", () => {
  const result = validateOrder(catalog, [{ productId: pollo.id, qty: 2, extraIds: [], subtotal: 1 }]);
  assert.equal(result.ok, true);
  assert.equal(result.ok && result.total, 5600);
});

test("7. ignores modified total", () => {
  const result = validateOrder(catalog, [
    { productId: pollo.id, qty: 2, extraIds: [], total: 1, unitPrice: 1 },
  ]);
  assert.equal(result.ok, true);
  assert.equal(result.ok && result.total, 5600);
});

test("8. ignores client delivery cost", () => {
  const result = validateOrder(catalog, [
    { productId: pollo.id, qty: 1, extraIds: [], delivery: 0, deliveryCost: 1 },
  ]);
  assert.equal(result.ok, true);
  assert.equal(result.ok && result.total, 2800);
});

test("9. rejects unknown product_id", () => {
  const result = validateLine(catalog, { productId: 99999, qty: 1, extraIds: [] });
  assert.equal(result.ok, false);
  assert.equal(result.code, "product");
});

test("10. rejects unknown extra", () => {
  assert.equal(validateLine(catalog, { productId: armaEmp.id, qty: 1, extraIds: ["no-existe"] }).ok, false);
});

test("11. rejects 4 ingredients on empanada (and 10 / 100)", () => {
  const four = ["pollo", "mozzarella", "platano", "caraota"];
  assert.equal(validateLine(catalog, { productId: armaEmp.id, qty: 1, extraIds: four }).ok, false);
  const ten = ["pollo", "mechada", "jamon", "llanero", "mozzarella", "champinon", "maiz", "platano", "caraota", "lechuga"];
  assert.equal(validateLine(catalog, { productId: armaEmp.id, qty: 1, extraIds: ten }).ok, false);
  const hundred = Array.from({ length: 100 }, (_, i) => `x${i}`);
  assert.equal(validateLine(catalog, { productId: armaEmp.id, qty: 1, extraIds: hundred }).ok, false);
});

test("12. accepts 3 empanada ingredients and prices from catalog, not client", () => {
  const result = validateLine(catalog, {
    productId: armaEmp.id,
    qty: 1,
    extraIds: ["mechada", "platano", "llanero"],
    unitPrice: 1,
  });
  assert.equal(result.ok, true);
  assert.equal(result.line?.unitPrice, 3500 + 300 + 300);
});

test("13. rejects duplicate extras and extras not allowed on empanada", () => {
  assert.equal(validateLine(catalog, { productId: armaEmp.id, qty: 1, extraIds: ["pollo", "pollo"] }).ok, false);
  assert.equal(validateLine(catalog, { productId: armaEmp.id, qty: 1, extraIds: ["lechuga"] }).ok, false);
});

test("14. rejects 9 ingredients on fajita, accepts 8", () => {
  const nine = ["pollo", "mechada", "jamon", "llanero", "mozzarella", "champinon", "maiz", "platano", "caraota"];
  assert.equal(validateLine(catalog, { productId: armaFaj.id, qty: 1, extraIds: nine }).ok, false);
  const eight = nine.slice(0, 8);
  const ok = validateLine(catalog, { productId: armaFaj.id, qty: 1, extraIds: eight, unitPrice: 1 });
  assert.equal(ok.ok, true);
  const extraSum = eight.reduce((sum, id) => sum + catalog.ingredients.find((i) => i.id === id)!.fajitaPrice, 0);
  assert.equal(ok.line?.unitPrice, 2200 + extraSum);
});

test("15. rejects qty 0, negative, decimal, NaN, Infinity, string, huge", () => {
  assert.equal(validateLine(catalog, { productId: pollo.id, qty: 0, extraIds: [] }).ok, false);
  assert.equal(validateLine(catalog, { productId: pollo.id, qty: -2, extraIds: [] }).ok, false);
  assert.equal(validateLine(catalog, { productId: pollo.id, qty: 1.5, extraIds: [] }).ok, false);
  assert.equal(validateLine(catalog, { productId: pollo.id, qty: Number.NaN, extraIds: [] }).ok, false);
  assert.equal(validateLine(catalog, { productId: pollo.id, qty: Infinity, extraIds: [] }).ok, false);
  assert.equal(validateLine(catalog, { productId: pollo.id, qty: 9999, extraIds: [] }).ok, false);
  assert.equal(validateLine(catalog, { productId: pollo.id, qty: "2", extraIds: [] }).ok, false);
  assert.equal(validateLine(catalog, { productId: pollo.id, qty: true, extraIds: [] }).ok, false);
});

test("16. rejects disabled product and disabled extra", () => {
  const disabledProduct = {
    ...catalog,
    products: catalog.products.map((p) => (p.id === pollo.id ? { ...p, available: false } : p)),
  };
  const r1 = validateLine(disabledProduct, { productId: pollo.id, qty: 1, extraIds: [] });
  assert.equal(r1.ok, false);
  assert.equal(r1.code, "unavailable");

  const disabledExtra = {
    ...catalog,
    ingredients: catalog.ingredients.map((i) => (i.id === "pollo" ? { ...i, available: false } : i)),
  };
  const r2 = validateLine(disabledExtra, { productId: armaEmp.id, qty: 1, extraIds: ["pollo"] });
  assert.equal(r2.ok, false);
});

test("17. rejects extras on a fixed product and invalid id types", () => {
  assert.equal(validateLine(catalog, { productId: pollo.id, qty: 1, extraIds: ["mozzarella"] }).ok, false);
  assert.equal(validateLine(catalog, { productId: "1", qty: 1, extraIds: [] }).ok, false);
  assert.equal(validateLine(catalog, { productId: null, qty: 1, extraIds: [] }).ok, false);
  assert.equal(validateOrder(catalog, "not-an-array").ok, false);
});

test("18. sanitizes malicious notes and never copies them raw into WhatsApp", () => {
  const bad = parseCustomerInfo({ name: "a", phone: "12", address: "x" });
  assert.equal(bad.ok, false);
  const good = parseCustomerInfo({
    name: "<script>Ana</script>",
    phone: "912345678",
    address: "Calle Falsa 123",
    notes: "Hola **world**<img src=x onerror=alert(1)>\u0000",
    payment: "efectivo",
    total: 1,
  });
  assert.equal(good.ok, true);
  if (good.ok) {
    assert.equal(good.info.name.includes("<"), false);
    assert.equal(good.info.notes.includes("*"), false);
    assert.equal(good.info.notes.includes("<"), false);
    const order = validateOrder(catalog, [{ productId: pollo.id, qty: 1, extraIds: [], note: "<script>x</script>" }]);
    assert.equal(order.ok, true);
    if (order.ok) {
      const msg = buildWhatsappMessage(order.lines, good.info, catalog.settings);
      assert.equal(msg.includes("<script>"), false);
      assert.equal(msg.includes("TOTAL A PAGAR"), true);
      assert.match(msg, /\$2\.800|\$2800/);
    }
  }
});

test("19. rejects oversized payloads by size helper", () => {
  const huge = { items: [{ productId: 1, qty: 1, note: "x".repeat(30_000) }] };
  assert.equal(jsonSize(huge) > LIMITS.payloadBytes, true);
  assert.equal(sanitizeLine("<b>hola</b>", 80), "hola");
});

test("20. happy path: mix of catalog products plus custom empanada/fajita", () => {
  const result = validateOrder(catalog, [
    { productId: pollo.id, qty: 2, extraIds: [] },
    { productId: papas.id, qty: 1, extraIds: [] },
    { productId: armaEmp.id, qty: 1, extraIds: ["pollo", "mozzarella"] },
    { productId: armaFaj.id, qty: 1, extraIds: ["mechada", "lechuga", "tomate"] },
  ]);
  assert.equal(result.ok, true);
  if (result.ok) {
    const emp = 3200;
    const faj = 2200 + 1500 + 150 + 200;
    assert.equal(result.total, 2800 * 2 + 2500 + emp + faj);
    const msg = buildWhatsappMessage(result.lines, { ...info, notes: "Sin cilantro" }, catalog.settings);
    assert.equal(msg.includes("Sin cilantro"), true);
    assert.equal(msg.includes("Arma tu empanada"), true);
    assert.equal(msg.includes("Pollo"), true);
  }
});
