import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "./types";

type CartState = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "lineId">) => void;
  setQty: (lineId: string, qty: number) => void;
  remove: (lineId: string) => void;
  clear: () => void;
};

function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const existing = get().items.find(
          (i) =>
            i.productId === item.productId &&
            i.note === item.note &&
            i.extras.join("|") === item.extras.join("|") &&
            i.unitPrice === item.unitPrice,
        );
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.lineId === existing.lineId
                ? { ...i, qty: i.qty + item.qty }
                : i,
            ),
          });
          return;
        }
        set({ items: [...get().items, { ...item, lineId: newId() }] });
      },
      setQty: (lineId, qty) => {
        if (qty <= 0) {
          set({ items: get().items.filter((i) => i.lineId !== lineId) });
          return;
        }
        set({
          items: get().items.map((i) =>
            i.lineId === lineId ? { ...i, qty } : i,
          ),
        });
      },
      remove: (lineId) =>
        set({ items: get().items.filter((i) => i.lineId !== lineId) }),
      clear: () => set({ items: [] }),
    }),
    { name: "cra-cart" },
  ),
);

export function cartCount(items: CartItem[]): number {
  return items.reduce((n, i) => n + i.qty, 0);
}

export function cartTotal(items: CartItem[]): number {
  return items.reduce((n, i) => n + i.unitPrice * i.qty, 0);
}
