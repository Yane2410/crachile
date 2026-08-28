export type CategoryId = "combos" | "empanadas" | "fajitas" | "papas" | "bebidas" | "extras";
export type CustomKind = "empanada" | "fajita";
export type IngredientKind = "protein" | "cheese" | "veg";
export type PaymentMethod = "efectivo" | "transferencia";
export type ComboBenefitType = "fixed" | "percent" | "price";

export type Category = { id: CategoryId; name: string; tagline: string; sortOrder: number; available: boolean };
export type Product = { id: number; categoryId: CategoryId; subcategory: string | null; name: string; description: string; price: number; imageUrl: string; available: boolean; isCustom: boolean; customKind: CustomKind | null; sortOrder: number };
export type Ingredient = { id: string; name: string; kind: IngredientKind; premium: boolean; empanadaOk: boolean; fajitaOk: boolean; fajitaPrice: number; available: boolean; sortOrder: number };
export type ComboRule = { id: number; categoryId: CategoryId; quantity: number; sortOrder: number };
export type Combo = { id: number; name: string; description: string; imageUrl: string; benefitType: ComboBenefitType; benefitValue: number; available: boolean; sortOrder: number; rules: ComboRule[] };

export type KitchenSettings = { restaurantName: string; tagline: string; city: string; coverage: string; deliveryNote: string; hours: string; prepMin: number; prepMax: number; whatsapp: string; transferBank: string; transferName: string; transferRut: string; transferAccount: string; empanada1: number; empanada2: number; empanada3: number; empanadaPremium: number; fajitaBase: number; pinHint: boolean };
export type Catalog = { categories: Category[]; products: Product[]; ingredients: Ingredient[]; combos?: Combo[]; settings: KitchenSettings };

export type ComboSelection = { productId: number; extraIds?: string[] };
export type CartDraft = { productId: number; extraIds?: string[]; qty: number; note?: string; comboId?: number; selections?: ComboSelection[] };

export type ValidatedComboItem = { productId: number; name: string; categoryLabel: string; qty: number; unitPrice: number; extraIds: string[]; extras: string[] };
export type ValidatedLine = { productId: number; name: string; categoryLabel: string; extraIds: string[]; extras: string[]; qty: number; note: string; unitPrice: number; lineTotal: number; imageUrl: string; comboId?: number; comboName?: string; comboItems?: ValidatedComboItem[]; comboDiscount?: number };
export type OrderFail = { ok: false; code: string; error: string };
export type OrderOk = { ok: true; lines: ValidatedLine[]; total: number; count: number };
export type OrderResult = OrderOk | OrderFail;
export type CustomerInfo = { name: string; phone: string; address: string; payment: PaymentMethod; notes: string };

export type CartItem = { lineId: string; productId: number; extraIds: string[]; extras: string[]; note: string; qty: number; name: string; categoryLabel: string; imageUrl: string; comboId?: number; comboName?: string; comboSelections?: ComboSelection[]; comboDiscount?: number };