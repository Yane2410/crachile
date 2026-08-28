import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { adminPatchProduct } from "@/lib/cra/fns";

type Product = { id: string; name: string; category: string; isFavorite?: boolean; sortOrder?: number; available?: boolean };

type Props = { products: Product[]; onChanged?: () => void };

export function AdminFavorites({ products, onChanged }: Props) {
  const [saving, setSaving] = useState<string | null>(null);
  const favorites = useMemo(() => products.filter((p) => p.isFavorite).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)), [products]);
  const candidates = useMemo(() => products.filter((p) => p.category !== "extras"), [products]);

  async function toggle(product: Product, checked: boolean) {
    if (checked && favorites.length >= 3) {
      toast.error("CRA permite hasta 3 Favoritos activos");
      return;
    }
    setSaving(product.id);
    try {
      const nextOrder = checked ? Math.max(0, ...favorites.map((p) => p.sortOrder ?? 0)) + 1 : product.sortOrder ?? 0;
      await adminPatchProduct(product.id, { isFavorite: checked, sortOrder: checked ? nextOrder : 0 });
      toast.success(checked ? "Agregado a Favoritos CRA" : "Quitado de Favoritos CRA");
      onChanged?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar el favorito");
    } finally {
      setSaving(null);
    }
  }

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= favorites.length) return;
    const ordered = [...favorites];
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    setSaving("order");
    try {
      await Promise.all(ordered.map((p, i) => adminPatchProduct(p.id, { isFavorite: true, sortOrder: i + 1 })));
      toast.success("Orden de Favoritos actualizado");
      onChanged?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el orden");
    } finally {
      setSaving(null);
    }
  }

  return (
    <section className="space-y-5 rounded-2xl border bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-xl font-bold">❤️ Favoritos CRA</h2>
        <p className="text-sm text-muted-foreground">Elige hasta 3 productos y controla el orden que verá el cliente.</p>
      </div>
      <div className="space-y-2">
        {favorites.length === 0 && <p className="rounded-xl bg-muted/40 p-4 text-sm">Aún no tienes Favoritos CRA activos.</p>}
        {favorites.map((product, index) => (
          <div key={product.id} className="flex items-center gap-3 rounded-xl border p-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted font-bold">{index + 1}</span>
            <div className="min-w-0 flex-1"><div className="font-semibold truncate">{product.name}</div><div className="text-xs text-muted-foreground">{product.category}</div></div>
            <Button variant="outline" size="sm" onClick={() => move(index, -1)} disabled={index === 0 || saving === "order"}>↑</Button>
            <Button variant="outline" size="sm" onClick={() => move(index, 1)} disabled={index === favorites.length - 1 || saving === "order"}>↓</Button>
            <Switch checked onCheckedChange={(checked) => toggle(product, checked)} disabled={saving === product.id} />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <h3 className="font-semibold">Productos disponibles</h3>
        {candidates.map((product) => {
          const active = Boolean(product.isFavorite);
          return <div key={product.id} className="flex items-center gap-3 rounded-xl border p-3"><div className="min-w-0 flex-1"><div className="font-medium truncate">{product.name}</div><div className="text-xs text-muted-foreground">{product.category}</div></div><Switch checked={active} onCheckedChange={(checked) => toggle(product, checked)} disabled={saving === product.id || (!active && favorites.length >= 3)} /></div>;
        })}
      </div>
    </section>
  );
}
