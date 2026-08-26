import { getSql } from "@/lib/db";
import type {
  Catalog,
  Category,
  CategoryId,
  Ingredient,
  Product,
  PublicSettings,
} from "@/lib/types";

type CategoryRow = {
  id: string;
  name: string;
  tagline: string;
  sort_order: number;
  available: boolean;
};

type ProductRow = {
  id: number;
  category_id: string;
  subcategory: string | null;
  name: string;
  description: string;
  price: number;
  image_url: string;
  available: boolean;
  is_custom: boolean;
  custom_kind: string | null;
  sort_order: number;
};

type IngredientRow = {
  id: string;
  name: string;
  kind: string;
  premium: boolean;
  empanada_ok: boolean;
  fajita_ok: boolean;
  fajita_price: number;
  available: boolean;
  sort_order: number;
};

type SettingRow = { key: string; value: string };

const CATEGORY_IDS: CategoryId[] = ["empanadas", "fajitas", "papas", "bebidas"];

function asCategoryId(id: string): CategoryId {
  return (CATEGORY_IDS.includes(id as CategoryId) ? id : "empanadas") as CategoryId;
}

function mapCategory(row: CategoryRow): Category {
  return {
    id: asCategoryId(row.id),
    name: row.name,
    tagline: row.tagline,
    sortOrder: row.sort_order,
    available: row.available,
  };
}

function mapProduct(row: ProductRow): Product {
  const kind =
    row.custom_kind === "empanada" || row.custom_kind === "fajita"
      ? row.custom_kind
      : null;
  return {
    id: row.id,
    categoryId: asCategoryId(row.category_id),
    subcategory: row.subcategory,
    name: row.name,
    description: row.description,
    price: row.price,
    imageUrl: row.image_url,
    available: row.available,
    isCustom: row.is_custom,
    customKind: kind,
    sortOrder: row.sort_order,
  };
}

function mapIngredient(row: IngredientRow): Ingredient {
  const kind =
    row.kind === "protein" ||
    row.kind === "cheese" ||
    row.kind === "veg" ||
    row.kind === "extra"
      ? row.kind
      : "extra";
  return {
    id: row.id,
    name: row.name,
    kind,
    premium: row.premium,
    empanadaOk: row.empanada_ok,
    fajitaOk: row.fajita_ok,
    fajitaPrice: row.fajita_price,
    available: row.available,
    sortOrder: row.sort_order,
  };
}

export function parseSettings(rows: SettingRow[]): PublicSettings {
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const num = (k: string, fallback: number) => {
    const n = Number(map[k]);
    return Number.isFinite(n) ? n : fallback;
  };
  return {
    restaurantName: map.restaurant_name || "Comer Rezar Amar",
    tagline: map.tagline || "Cocina venezolana en Talca",
    city: map.city || "Talca",
    hours: map.hours || "",
    whatsapp: map.whatsapp || "",
    transferBank: map.transfer_bank || "",
    transferName: map.transfer_name || "",
    transferRut: map.transfer_rut || "",
    transferAccount: map.transfer_account || "",
    empanada1: num("empanada_1", 2800),
    empanada2: num("empanada_2", 3200),
    empanada3: num("empanada_3", 3500),
    empanadaPremium: num("empanada_premium", 300),
    fajitaBase: num("fajita_base", 2200),
    pinHint: map.pin_changed !== "true",
  };
}

export async function loadCatalog(): Promise<Catalog> {
  const sql = await getSql();
  const [categories, products, ingredients, settings] = await Promise.all([
    sql<CategoryRow>`select id, name, tagline, sort_order, available from categories order by sort_order`,
    sql<ProductRow>`select p.id, p.category_id, p.subcategory, p.name, p.description, p.price, p.image_url, p.available, p.is_custom, p.custom_kind, p.sort_order from products p join categories c on c.id = p.category_id order by c.sort_order, p.sort_order, p.id`,
    sql<IngredientRow>`select id, name, kind, premium, empanada_ok, fajita_ok, fajita_price, available, sort_order from ingredients order by sort_order`,
    sql<SettingRow>`select key, value from settings`,
  ]);
  return {
    categories: categories.map(mapCategory),
    products: products.map(mapProduct),
    ingredients: ingredients.map(mapIngredient),
    settings: parseSettings(settings),
  };
}
