import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ProductOrderControls } from "@/components/admin-product-order";
import { adminMe, adminPatchProduct } from "@/lib/cra/fns";
import type { Catalog } from "@/lib/cra/types";

export function AdminProductOrderPanel({ catalog, onSaved }: { catalog: Catalog; onSaved?: (next: Catalog) => void }) {
  const me = useQuery({ queryKey: ["admin-me"], queryFn: () => adminMe() });
  const categories = useMemo(() => catalog.categories.filter((c) => c.id !== "combos"), [catalog.categories]);
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "empanadas");
  const products = useMemo(() => catalog.products.filter((p) => p.categoryId === categoryId).sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id), [catalog.products, categoryId]);
  const save = useMutation({ mutationFn: async (items: typeof products) => { let next = catalog; for (let i = 0; i < items.length; i++) next = await adminPatchProduct({ data: { id: items[i].id, sortOrder: i + 1 } }); return next; }, onSuccess: (next) => { onSaved?.(next); toast.success("Orden de productos guardado"); }, onError: (error: Error) => toast.error(error.message) });
  if (me.isLoading || !me.data?.ok || !categories.length) return null;
  return <section className="space-y-3 rounded-[var(--radius-lg)] bg-surface p-4 shadow-[var(--shadow-border)]"><div><h2 className="font-display text-xl font-semibold">Orden del menú</h2><p className="mt-1 text-sm text-muted">Mueve los productos para decidir el orden en que los verá el cliente.</p></div><div className="flex gap-2 overflow-x-auto">{categories.map((category) => <Button key={category.id} type="button" size="sm" variant={category.id === categoryId ? "default" : "secondary"} className="shrink-0" onClick={() => setCategoryId(category.id)}>{category.name}</Button>)}</div>{products.length ? <ProductOrderControls products={products} pending={save.isPending} onMove={() => undefined} onSave={(items) => save.mutate(items)} /> : <p className="rounded-[var(--radius-md)] bg-surface-2 p-4 text-sm text-muted">No hay productos en esta categoría.</p>}</section>;
}
