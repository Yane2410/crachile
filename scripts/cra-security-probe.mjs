/**
 * Hits the live createOrder server function from the browser origin
 * (so CSRF + RPC behave like a real client). Prints a PASS/FAIL table.
 */
import { chromium } from "playwright";

const BASE = process.env.CRA_PROBE_URL || "http://127.0.0.1:8080";

const INFO = {
  name: "Ana Pérez",
  phone: "912345678",
  address: "Calle Falsa 123, Talca",
  payment: "efectivo",
  notes: "Sin cilantro",
};

const CASES = [
  {
    id: 1,
    name: "Precio de producto modificado",
    payload: {
      items: [{ productId: 1, qty: 2, extraIds: [], unitPrice: 1, price: 0, total: 0 }],
      info: INFO,
    },
    expect: { ok: true, total: 5600 },
  },
  {
    id: 2,
    name: "Total modificado",
    payload: {
      items: [{ productId: 1, qty: 1, extraIds: [], total: 1 }],
      info: INFO,
      total: 1,
    },
    expect: { ok: true, total: 2800 },
  },
  {
    id: 3,
    name: "Subtotal modificado",
    payload: {
      items: [{ productId: 1, qty: 2, extraIds: [], subtotal: 1 }],
      info: INFO,
      subtotal: 0,
    },
    expect: { ok: true, total: 5600 },
  },
  {
    id: 4,
    name: "Extra con precio modificado",
    payload: {
      items: [
        {
          productId: 18,
          qty: 1,
          extraIds: ["pollo"],
          extraPrice: 0,
          extras: [{ id: "pollo", price: 0 }],
          unitPrice: 1,
        },
      ],
      info: INFO,
    },
    expect: { ok: true, total: 3100 },
  },
  {
    id: 5,
    name: "Producto inexistente",
    payload: { items: [{ productId: 99999, qty: 1, extraIds: [] }], info: INFO },
    expect: { ok: false },
  },
  {
    id: 6,
    name: "Extra inexistente",
    payload: { items: [{ productId: 13, qty: 1, extraIds: ["no-existe"] }], info: INFO },
    expect: { ok: false },
  },
  {
    id: 7,
    name: "4 ingredientes en empanada",
    payload: {
      items: [{ productId: 13, qty: 1, extraIds: ["pollo", "mozzarella", "platano", "caraota"] }],
      info: INFO,
    },
    expect: { ok: false },
  },
  {
    id: 8,
    name: "9 ingredientes en fajita",
    payload: {
      items: [
        {
          productId: 18,
          qty: 1,
          extraIds: ["pollo", "mechada", "jamon", "llanero", "mozzarella", "champinon", "maiz", "platano", "caraota"],
        },
      ],
      info: INFO,
    },
    expect: { ok: false },
  },
  {
    id: 9,
    name: "Cantidad negativa",
    payload: { items: [{ productId: 1, qty: -2, extraIds: [] }], info: INFO },
    expect: { ok: false },
  },
  {
    id: 10,
    name: "Cantidad 0",
    payload: { items: [{ productId: 1, qty: 0, extraIds: [] }], info: INFO },
    expect: { ok: false },
  },
  {
    id: 11,
    name: "Cantidad extremadamente grande",
    payload: { items: [{ productId: 1, qty: 9999, extraIds: [] }], info: INFO },
    expect: { ok: false },
  },
  {
    id: 12,
    name: "ID inválido",
    payload: { items: [{ productId: "abc", qty: 1, extraIds: [] }], info: INFO },
    expect: { ok: false },
  },
  {
    id: 13,
    name: "Payload con tipos incorrectos",
    payload: { items: "pollo", info: INFO },
    expect: { ok: false },
  },
  {
    id: 14,
    name: "Texto malicioso en observaciones",
    payload: {
      items: [{ productId: 1, qty: 1, extraIds: [], note: "<script>alert(1)</script>" }],
      info: { ...INFO, notes: "<img src=x onerror=alert(1)> **boom**" },
    },
    expect: { ok: true, total: 2800, noScript: true },
  },
];

function passFail(ok) {
  return ok ? "PASS" : "FAIL";
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto(BASE, { waitUntil: "networkidle" });

const results = [];
for (const testCase of CASES) {
  const outcome = await page.evaluate(async (payload) => {
    const { createOrder } = await import("/src/lib/cra/fns.ts");
    try {
      const result = await createOrder({ data: payload });
      return { threw: false, result };
    } catch (error) {
      return {
        threw: true,
        result: {
          ok: false,
          error: error instanceof Error ? error.message : "error",
          stack: error instanceof Error ? error.stack : "",
        },
      };
    }
  }, testCase.payload);

  const result = outcome.result ?? {};
  let ok = result.ok === testCase.expect.ok;
  if (testCase.expect.ok && testCase.expect.total != null) {
    ok = ok && result.total === testCase.expect.total;
  }
  if (testCase.expect.noScript) {
    const msg = String(result.message ?? "");
    ok = ok && !msg.includes("<script>") && !msg.includes("<img") && !msg.includes("**");
  }
  const sensitive = JSON.stringify(result).match(/stack|pin_hash|session_secret|DATABASE_URL|scrypt\$/i);
  if (sensitive) ok = false;

  results.push({
    id: testCase.id,
    name: testCase.name,
    expected: testCase.expect,
    got: { ok: result.ok, total: result.total, error: result.error, threw: outcome.threw },
    status: passFail(ok),
  });
}

const huge = await page.evaluate(async () => {
  const { createOrder } = await import("/src/lib/cra/fns.ts");
  const payload = {
    items: [{ productId: 1, qty: 1, extraIds: [], note: "x".repeat(40_000) }],
    info: {
      name: "Ana Pérez",
      phone: "912345678",
      address: "Calle Falsa 123, Talca",
      payment: "efectivo",
      notes: "",
    },
  };
  try {
    const result = await createOrder({ data: payload });
    return result;
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "error" };
  }
});
results.push({
  id: 15,
  name: "Payload excesivamente grande",
  expected: { ok: false },
  got: { ok: huge.ok, error: huge.error },
  status: passFail(huge.ok === false),
});

const happy = await page.evaluate(async () => {
  const { createOrder } = await import("/src/lib/cra/fns.ts");
  return createOrder({
    data: {
      items: [
        { productId: 1, qty: 1, extraIds: [] },
        { productId: 13, qty: 1, extraIds: ["mechada", "platano", "llanero"] },
        { productId: 18, qty: 1, extraIds: ["pollo", "lechuga", "tomate"] },
      ],
      info: {
        name: "Ana Pérez",
        phone: "912345678",
        address: "Calle Falsa 123, Talca",
        payment: "efectivo",
        notes: "Sin cilantro",
      },
    },
  });
});
const emp = 3500 + 300 + 300;
const faj = 2200 + 900 + 150 + 200;
const expectedHappy = 2800 + emp + faj;
results.push({
  id: 16,
  name: "Pedido normal (catálogo + arma empanada 3 + arma fajita 3)",
  expected: { ok: true, total: expectedHappy },
  got: { ok: happy.ok, total: happy.total, error: happy.error },
  status: passFail(happy.ok === true && happy.total === expectedHappy && String(happy.message || "").includes("TOTAL A PAGAR")),
});

await browser.close();

const failed = results.filter((r) => r.status === "FAIL");
console.log(JSON.stringify({ passed: results.length - failed.length, failed: failed.length, results }, null, 2));
process.exit(failed.length ? 1 : 0);
