export type CategoryId = "empanadas" | "fajitas" | "papas" | "bebidas";

export type Category = {
  id: CategoryId;
  name: string;
  tagline: string;
  sortOrder: number;
  available: boolean;
};

export type Product = {
  id: number;
  categoryId: CategoryId;
  subcategory: string | null;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  available: boolean;
  isCustom: boolean;
  customKind: "empanada" | "fajita" | null;
  sortOrder: number;
};

export type Ingredient = {
  id: string;
  name: string;
  kind: "protein" | "cheese" | "veg" | "extra";
  premium: boolean;
  empanadaOk: boolean;
  fajitaOk: boolean;
  fajitaPrice: number;
  available: boolean;
  sortOrder: number;
};

export type PublicSettings = {
  restaurantName: string;
  tagline: string;
  city: string;
  hours: string;
  whatsapp: string;
  transferBank: string;
  transferName: string;
  transferRut: string;
  transferAccount: string;
  empanada1: number;
  empanada2: number;
  empanada3: number;
  empanadaPremium: number;
  fajitaBase: number;
  pinHint: boolean;
};

export type Catalog = {
  categories: Category[];
  products: Product[];
  ingredients: Ingredient[];
  settings: PublicSettings;
};

export type CartItem = {
  lineId: string;
  productId: number;
  name: string;
  categoryLabel?: string;
  unitPrice: number;
  qty: number;
  extras: string[];
  note: string;
  imageUrl: string;
};

export type PaymentMethod = "efectivo" | "transferencia";
