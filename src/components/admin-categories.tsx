import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import type { Category } from "@/lib/cra/types";

type Props = { categories: Category[]; onChanged?: () => void; onMove?: (categoryId: Category["id"], direction: -1 | 1) => Promise<void> };

export function AdminCategories({ categories, onChanged, onMove }: Props) {
  const [saving, setSaving] = useState<string | null>(null);
  const ordered = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);

  async function move(id: Category["id"], direction: -1 | 1) {
    if (!onMove) return;
    const index = ordered.findIndex((c) => c.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= ordered.length) return;
    setSaving(id);
    try { await onMove(id, direction); toast.success("Orden de categorías actualizado"); onChanged?.(); }
    catch (error) { toast.error(error instanceof Error ? error.message : "No se pudo cambiar el orden"); }
    finally { setSaving(null); }
  }

  return <section className="space-y-5 rounded-2xl border bg-white p-5 shadow-sm">
    <div><h2 className="text-xl font-bold">🗂️ Categorías y orden</h2><p className="text-sm text-muted-foreground">Controla qué secciones aparecen y en qué orden las verá el cliente.</p></div>
    <div className="space-y-2">
      {ordered.map((category, index) => <div key={category.id} className="flex items-center gap-3 rounded-xl border p-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted font-bold">{index + 1}</span>
        <div className="min-w-0 flex-1"><div className="font-semibold">{category.name}</div><div className="text-xs text-muted-foreground">{category.tagline}</div></div>
        <Button variant="outline" size="sm" disabled={index === 0 || saving === category.id} onClick={() => move(category.id, -1)}>↑</Button>
        <Button variant="outline" size="sm" disabled={index === ordered.length - 1 || saving === category.id} onClick={() => move(category.id, 1)}>↓</Button>
        <Switch checked={category.available} disabled={saving === category.id} onCheckedChange={() => toast.info("La visibilidad se conecta al guardado de categorías")}/>
      </div>)}
    </div>
  </section>;
}
