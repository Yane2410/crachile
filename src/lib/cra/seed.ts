import type { Catalog, Category, Ingredient, KitchenSettings, Product } from "./types.ts";

export const DEFAULT_SETTINGS: Omit<KitchenSettings, "pinHint"> = {
  restaurantName: "Comer Rezar Amar",
  tagline: "Fusión comida venezolana y chilena",
  city: "Nororiente, Talca",
  coverage: "Nororiente, Talca",
  deliveryNote: "Cobertura y costo se confirman por WhatsApp",
  hours: "Lunes a domingo · 09 a 16 hrs",
  prepMin: 25,
  prepMax: 35,
  whatsapp: "56990970274",
  transferBank: "",
  transferName: "Comer Rezar Amar",
  transferRut: "",
  transferAccount: "",
  empanada1: 2800,
  empanada2: 3200,
  empanada3: 3500,
  empanadaPremium: 300,
  fajitaBase: 2200,
};

export const SEED_CATEGORIES: Category[] = [
  { id: "combos", name: "Combos", tagline: "Más por menos, sin complicar tu pedido", sortOrder: 0, available: true },
  { id: "empanadas", name: "Empanadas", tagline: "Masa de maíz frita, rellenos al estilo venezolano", sortOrder: 1, available: true },
  { id: "fajitas", name: "Fajitas", tagline: "Tortilla rellena con salsa de ajo CRA", sortOrder: 2, available: true },
  { id: "papas", name: "Papas fritas", tagline: "Crocantes, simples o con proteína", sortOrder: 3, available: true },
  { id: "bebidas", name: "Bebidas", tagline: "Latas frías para acompañar", sortOrder: 4, available: true },
];

export const SEED_INGREDIENTS: Ingredient[] = [
  { id: "pollo", name: "Pollo", kind: "protein", premium: false, empanadaOk: true, fajitaOk: true, fajitaPrice: 900, available: true, sortOrder: 10 },
  { id: "mechada", name: "Mechada", kind: "protein", premium: true, empanadaOk: true, fajitaOk: true, fajitaPrice: 1500, available: true, sortOrder: 20 },
  { id: "jamon", name: "Jamón", kind: "protein", premium: false, empanadaOk: true, fajitaOk: true, fajitaPrice: 800, available: true, sortOrder: 30 },
  { id: "llanero", name: "Queso llanero", kind: "cheese", premium: true, empanadaOk: true, fajitaOk: true, fajitaPrice: 600, available: true, sortOrder: 40 },
  { id: "mozzarella", name: "Mozzarella", kind: "cheese", premium: false, empanadaOk: true, fajitaOk: true, fajitaPrice: 400, available: true, sortOrder: 50 },
  { id: "champinon", name: "Champiñón", kind: "veg", premium: false, empanadaOk: true, fajitaOk: true, fajitaPrice: 400, available: true, sortOrder: 60 },
  { id: "maiz", name: "Maíz", kind: "veg", premium: false, empanadaOk: true, fajitaOk: true, fajitaPrice: 250, available: true, sortOrder: 70 },
  { id: "platano", name: "Plátano", kind: "veg", premium: false, empanadaOk: true, fajitaOk: true, fajitaPrice: 400, available: true, sortOrder: 80 },
  { id: "caraota", name: "Caraota", kind: "veg", premium: false, empanadaOk: true, fajitaOk: true, fajitaPrice: 400, available: true, sortOrder: 90 },
  { id: "lechuga", name: "Lechuga", kind: "veg", premium: false, empanadaOk: false, fajitaOk: true, fajitaPrice: 150, available: true, sortOrder: 100 },
  { id: "tomate", name: "Tomate", kind: "veg", premium: false, empanadaOk: false, fajitaOk: true, fajitaPrice: 200, available: true, sortOrder: 110 },
  { id: "cebolla", name: "Cebolla", kind: "veg", premium: false, empanadaOk: false, fajitaOk: true, fajitaPrice: 200, available: true, sortOrder: 120 },
  { id: "pimenton", name: "Pimentón", kind: "veg", premium: false, empanadaOk: false, fajitaOk: true, fajitaPrice: 300, available: true, sortOrder: 130 },
];

type SeedProduct = Omit<Product, "id"> & { id: number };

export const SEED_PRODUCTS: SeedProduct[] = [
  { id: 1, categoryId: "empanadas", subcategory: "Clásicas", name: "Pollo", description: "Jugoso pollo desmenuzado y guisado a fuego lento con finos sofritos de cebolla, pimentones frescos, toque de ajo, sal de mar, pimienta recién molida y especias seleccionadas de la casa.", price: 2800, imageUrl: "/menu/product-1.jpg", available: true, isCustom: false, customKind: null, sortOrder: 10 },
  { id: 2, categoryId: "empanadas", subcategory: "Clásicas", name: "Pollo + Mozzarella", description: "Nuestro clásico pollo guisado y jugoso mezclado con una generosa porción de queso mozzarella fundido que estira y aporta máxima cremosidad.", price: 2900, imageUrl: "/menu/product-2.jpg", available: true, isCustom: false, customKind: null, sortOrder: 20 },
  { id: 3, categoryId: "empanadas", subcategory: "Clásicas", name: "Queso Llanero", description: "Auténtico queso llanero venezolano, de sabor intenso, salmuera equilibrada y textura firme que al freírse queda suave por dentro y dorado por fuera.", price: 2900, imageUrl: "/menu/product-3.jpg", available: true, isCustom: false, customKind: null, sortOrder: 30 },
  { id: 4, categoryId: "empanadas", subcategory: "Clásicas", name: "Mechada", description: "Exquisita carne mechada de vacuno, cocinada pacientemente durante horas en su propio jugo con sofrito criollo, tomates maduros, comino, pimienta y hierbas frescas.", price: 3000, imageUrl: "/menu/product-4.jpg", available: true, isCustom: false, customKind: null, sortOrder: 40 },
  { id: 5, categoryId: "empanadas", subcategory: "Clásicas", name: "Mechada + Mozzarella", description: "Mechada con mozzarella derretida.", price: 3100, imageUrl: "/menu/product-5.jpg", available: true, isCustom: false, customKind: null, sortOrder: 50 },
  { id: 6, categoryId: "empanadas", subcategory: "Especiales", name: "Pollo + Champiñón + Mozzarella", description: "Pollo, champiñón salteado y mozzarella.", price: 3100, imageUrl: "/menu/empanada-champinon.jpg", available: true, isCustom: false, customKind: null, sortOrder: 60 },
  { id: 7, categoryId: "empanadas", subcategory: "Especiales", name: "Mechada + Plátano", description: "Mechada con plátano maduro frito.", price: 3300, imageUrl: "/menu/empanada-platano.jpg", available: true, isCustom: false, customKind: null, sortOrder: 70 },
  { id: 8, categoryId: "empanadas", subcategory: "Especiales", name: "Caraota + Llanero", description: "Caraotas negras con queso llanero.", price: 3300, imageUrl: "/menu/empanada-caraota.jpg", available: true, isCustom: false, customKind: null, sortOrder: 80 },
  { id: 9, categoryId: "empanadas", subcategory: "Especiales", name: "Jamón + Llanero", description: "Jamón y queso llanero fundido.", price: 3300, imageUrl: "/menu/empanada-jamon.jpg", available: true, isCustom: false, customKind: null, sortOrder: 90 },
  { id: 10, categoryId: "empanadas", subcategory: "CRA", name: "Mechada + Plátano + Llanero", description: "La combinación de la casa: mechada, plátano y llanero.", price: 3600, imageUrl: "/menu/empanada-platano.jpg", available: true, isCustom: false, customKind: null, sortOrder: 100 },
  { id: 11, categoryId: "empanadas", subcategory: "CRA", name: "Cordon Bleu", description: "Pollo, jamón y mozzarella, crujiente por fuera.", price: 3700, imageUrl: "/menu/empanada-cordon.jpg", available: true, isCustom: false, customKind: null, sortOrder: 110 },
  { id: 12, categoryId: "empanadas", subcategory: "CRA", name: "Pabellón", description: "Mechada, caraota y plátano. El clásico en empanada.", price: 3800, imageUrl: "/menu/empanada-pabellon.jpg", available: true, isCustom: false, customKind: null, sortOrder: 120 },
  { id: 13, categoryId: "empanadas", subcategory: null, name: "Arma tu empanada", description: "Hasta 3 ingredientes. Mechada o llanero suman extra.", price: 2800, imageUrl: "/menu/empanada-custom.jpg", available: true, isCustom: true, customKind: "empanada", sortOrder: 130 },
  { id: 14, categoryId: "fajitas", subcategory: null, name: "Fajita Comer", description: "Pollo salteado con cebolla, lechuga, tomate, mozzarella y salsa de ajo CRA.", price: 3900, imageUrl: "/menu/fajita-pollo.jpg", available: true, isCustom: false, customKind: null, sortOrder: 10 },
  { id: 15, categoryId: "fajitas", subcategory: null, name: "Fajita Amar", description: "Pollo salteado con cebolla y pimentón, lechuga, tomate, mozzarella y salsa de ajo CRA.", price: 4200, imageUrl: "/menu/fajita-pollo.jpg", available: true, isCustom: false, customKind: null, sortOrder: 20 },
  { id: 16, categoryId: "fajitas", subcategory: null, name: "Fajita Rezar", description: "Carne mechada, lechuga, tomate, mozzarella y salsa de ajo CRA.", price: 4500, imageUrl: "/menu/fajita-mechada.jpg", available: true, isCustom: false, customKind: null, sortOrder: 30 },
  { id: 17, categoryId: "fajitas", subcategory: null, name: "Fajita Vegetariana", description: "Lechuga, tomate, cebolla, pimentón, champiñón, maíz, mozzarella y salsa CRA.", price: 3900, imageUrl: "/menu/fajita-veg.jpg", available: true, isCustom: false, customKind: null, sortOrder: 40 },
  { id: 18, categoryId: "fajitas", subcategory: null, name: "Arma tu fajita", description: "Hasta 8 ingredientes. Precio base + cada extra. Incluye salsa CRA.", price: 2200, imageUrl: "/menu/fajita-custom.jpg", available: true, isCustom: true, customKind: "fajita", sortOrder: 50 },
  { id: 19, categoryId: "papas", subcategory: null, name: "Papas fritas pequeñas", description: "Porción chica, recién fritas.", price: 2500, imageUrl: "/menu/papas-simple.jpg", available: true, isCustom: false, customKind: null, sortOrder: 10 },
  { id: 20, categoryId: "papas", subcategory: null, name: "Papas fritas grandes", description: "Porción grande para compartir.", price: 3500, imageUrl: "/menu/papas-simple.jpg", available: true, isCustom: false, customKind: null, sortOrder: 20 },
  { id: 21, categoryId: "papas", subcategory: null, name: "Papas Mechada", description: "Papas grandes con 80 g de carne mechada.", price: 6500, imageUrl: "/menu/papas-mechada.jpg", available: true, isCustom: false, customKind: null, sortOrder: 30 },
  { id: 22, categoryId: "papas", subcategory: null, name: "Papas Pollo", description: "Papas grandes con 80 g de pollo desmechado.", price: 6000, imageUrl: "/menu/papas-pollo.jpg", available: true, isCustom: false, customKind: null, sortOrder: 40 },
  { id: 23, categoryId: "bebidas", subcategory: null, name: "Bebida en lata", description: "Lata fría. Marca según disponibilidad del día.", price: 1500, imageUrl: "/menu/bebida.jpg", available: true, isCustom: false, customKind: null, sortOrder: 10 },
  { id: 24, categoryId: "combos", subcategory: "CRA", name: "Combo Individual", description: "2 empanadas clásicas a elección + 1 bebida en lata.", price: 6500, imageUrl: "", available: true, isCustom: false, customKind: null, sortOrder: 10 },
  { id: 25, categoryId: "combos", subcategory: "CRA", name: "Combo Doble", description: "4 empanadas clásicas a elección + 2 bebidas en lata.", price: 11500, imageUrl: "", available: true, isCustom: false, customKind: null, sortOrder: 20 },
  { id: 26, categoryId: "combos", subcategory: "CRA", name: "Combo Fajita", description: "1 Fajita Comer + 1 bebida en lata.", price: 4900, imageUrl: "", available: true, isCustom: false, customKind: null, sortOrder: 30 },
  { id: 27, categoryId: "combos", subcategory: "CRA", name: "Combo CRA", description: "2 empanadas clásicas + 1 Fajita Comer + 1 bebida en lata.", price: 9900, imageUrl: "", available: true, isCustom: false, customKind: null, sortOrder: 40 },
  { id: 28, categoryId: "combos", subcategory: "CRA", name: "Combo Fajita + Papas", description: "1 Fajita Comer + papas fritas pequeñas + 1 bebida en lata.", price: 6900, imageUrl: "", available: false, isCustom: false, customKind: null, sortOrder: 50 },
];

export function seedCatalog(pinHint = true): Catalog {
  return {
    categories: SEED_CATEGORIES,
    products: SEED_PRODUCTS,
    ingredients: SEED_INGREDIENTS,
    settings: { ...DEFAULT_SETTINGS, pinHint },
  };
}
