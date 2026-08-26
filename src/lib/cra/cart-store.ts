import { create } from "zustand";
import { persist } from "zustand/middleware";
import { cartTotal, lineUnitPrice, toOrderDraft, validateLine } from "./pricing.ts";
import type { CartItem, Catalog } from "./types.ts";

function clampQty(value: number) {
  return Number.isFinite(value) ? Math.min(20, Math.max(0, Math.round(value))) : 1;
}

function extraKey(item: { extraIds?: string[]; extras?: string[] }) {
  return (item.extraIds?.length ? item.extraIds : item.extras ?? []).join("|");
}

function newLineId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

type CartState = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "lineId"> & { lineId?: string }) => void;
  setQty: (lineId: string, qty: number) => void;
  remove: (lineId: string) => void;
  clear: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const qty = clampQty(item.qty);
        if (qty < 1) return;
        const extraIds = item.extraIds ?? [];
        const extras = item.extras ?? [];
        const note = (item.note ?? "").trim().slice(0, 140);
        const existing = get().items.find(
          (row) =>
            row.productId === item.productId &&
            row.note === note &&
            extraKey(row) === extraKey({ extraIds, extras }),
        );
        if (existing) {
          set({
            items: get().items.map((row) =>
              row.lineId === existing.lineId ? { ...row, qty: clampQty(row.qty + qty) } : row,
            ),
          });
          return;
        }
        set({
          items: [
            ...get().items,
            {
              ...item,
              extraIds,
              extras,
              note,
              qty,
              lineId: newLineId(),
            },
          ],
        });
      },
      setQty: (lineId, qty) => {
        const next = clampQty(qty);
        if (next < 1) {
          set({ items: get().items.filter((row) => row.lineId !== lineId) });
          return;
        }
        set({
          items: get().items.map((row) => (row.lineId === lineId ? { ...row, qty: next } : row)),
        });
      },
      remove: (lineId) => set({ items: get().items.filter((row) => row.lineId !== lineId) }),
      clear: () => set({ items: [] }),
    }),
    {
      name: "cra-cart",
      version: 2,
      migrate: (state) => {
        const items = ((state as { items?: CartItem[] } | undefined)?.items ?? []).map((item) => ({
          lineId: String(item.lineId ?? newLineId()),
          productId: Number(item.productId) || 0,
          extraIds: Array.isArray(item.extraIds) ? item.extraIds : [],
          extras: Array.isArray(item.extras) ? item.extras : [],
          note: String(item.note ?? ""),
          qty: clampQty(Number(item.qty) || 0),
          name: String(item.name ?? ""),
          categoryLabel: item.categoryLabel ? String(item.categoryLabel) : "",
          imageUrl: String(item.imageUrl ?? ""),
        }));
        return { items: items.filter((item) => item.productId > 0 && item.qty >= 1) };
      },
    },
  ),
);

export function cartCount(items: CartItem[]) {
  return items.reduce((sum, item) => sum + Math.max(0, item.qty), 0);
}

export { cartTotal, lineUnitPrice, toOrderDraft, validateLine };
