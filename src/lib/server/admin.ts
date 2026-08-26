import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MAX_IMAGE = 450_000;

export const adminMe = createServerFn({ method: "GET" }).handler(async () => {
  const mod = await import("./admin.server");
  return mod.me();
});

export const adminLogin = createServerFn({ method: "POST" })
  .validator(z.object({ pin: z.string().min(4).max(32) }))
  .handler(async ({ data }) => {
    const mod = await import("./admin.server");
    return mod.login(data.pin);
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(
  async () => {
    const mod = await import("./admin.server");
    return mod.logout();
  },
);

export const adminUpdateProduct = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.number().int(),
      name: z.string().min(1).max(80).optional(),
      description: z.string().max(280).optional(),
      price: z.number().int().min(0).max(100000).optional(),
      available: z.boolean().optional(),
      imageUrl: z.string().max(MAX_IMAGE).optional(),
      subcategory: z.string().max(40).nullable().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const mod = await import("./admin.server");
    return mod.updateProduct(data);
  });

export const adminCreateProduct = createServerFn({ method: "POST" })
  .validator(
    z.object({
      categoryId: z.enum(["empanadas", "fajitas", "papas", "bebidas"]),
      name: z.string().min(1).max(80),
      description: z.string().max(280).optional(),
      price: z.number().int().min(0).max(100000),
      subcategory: z.string().max(40).nullable().optional(),
      imageUrl: z.string().max(MAX_IMAGE).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const mod = await import("./admin.server");
    return mod.createProduct(data);
  });

export const adminDeleteProduct = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.number().int() }))
  .handler(async ({ data }) => {
    const mod = await import("./admin.server");
    return mod.deleteProduct(data.id);
  });

export const adminUpdateIngredient = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().min(1).max(40),
      name: z.string().min(1).max(40).optional(),
      available: z.boolean().optional(),
      fajitaPrice: z.number().int().min(0).max(20000).optional(),
      premium: z.boolean().optional(),
      empanadaOk: z.boolean().optional(),
      fajitaOk: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const mod = await import("./admin.server");
    return mod.updateIngredient(data);
  });

export const adminUpdateSettings = createServerFn({ method: "POST" })
  .validator(
    z.object({
      restaurantName: z.string().min(1).max(80).optional(),
      tagline: z.string().max(120).optional(),
      city: z.string().max(120).optional(),
      hours: z.string().max(120).optional(),
      whatsapp: z.string().max(20).optional(),
      transferBank: z.string().max(80).optional(),
      transferName: z.string().max(80).optional(),
      transferRut: z.string().max(20).optional(),
      transferAccount: z.string().max(40).optional(),
      empanada1: z.number().int().min(0).optional(),
      empanada2: z.number().int().min(0).optional(),
      empanada3: z.number().int().min(0).optional(),
      empanadaPremium: z.number().int().min(0).optional(),
      fajitaBase: z.number().int().min(0).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const mod = await import("./admin.server");
    return mod.updateSettings(data);
  });

export const adminChangePin = createServerFn({ method: "POST" })
  .validator(
    z.object({
      current: z.string().min(4).max(32),
      next: z.string().min(4).max(32),
    }),
  )
  .handler(async ({ data }) => {
    const mod = await import("./admin.server");
    return mod.changePin(data.current, data.next);
  });
