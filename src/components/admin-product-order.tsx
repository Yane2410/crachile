import { useState } from "react";
import { ArrowDown, ArrowUp, Check, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cra/cn";
import type { Product } from "@/lib/cra/types";

export function ProductOrderControls({ products, pending, onMove, onSave }: { products: Product[]; pending?: boolean; onMove: (from: number, to: number) => void; onSave: (products: Product[]) => void }) {
  const [draft, setDraft] = useState<Product[] | null>(null);
  const list = draft ?? products;
  const dirty = draft !== null;
  function move(from: number, to: number) {
    if (to < 0 || to >= list.length) return;
    const next = [...list];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setDraft(next);
    onMove(from, to);
  }
  return <section className="rounded-[var(--radius-lg)] bg-surface p-3 shadow-[var(--shadow-border)]">
    <div className="mb-3 flex items-center justify-between gap-3">
      <div><p className="font-semibold">Orden de productos</p><p className="text-xs text-muted">Así aparecerán en el menú público.</p></div>
      {dirty ? <div className="flex gap-2"><Button type="button" size="sm" variant="ghost" onClick={() => setDraft(null)}>Cancelar</Button><Button type="button" size="sm" disabled={pending} onClick={() => { onSave(list); setDraft(null); }}><Check className="size-4" />Guardar orden</Button></div> : null}
    </div>
    <div className="space-y-1">{list.map((product, index) => <div key={product.id} className={cn("flex items-center gap-2 rounded-[var(--radius-md)] bg-surface-2 px-2 py-2")}>
      <GripVertical className="size-4 shrink-0 text-muted" />
      <span className="w-6 shrink-0 text-center text-xs font-bold text-muted">{index + 1}</span>
      <span className="min-w-0 flex-1 truncate text-sm font-semibold">{product.name}</span>
      <Button type="button" variant="ghost" size="icon" aria-label={`Subir ${product.name}`} disabled={index === 0 || pending} onClick={() => move(index, index - 1)}><ArrowUp className="size-4" /></Button>
      <Button type="button" variant="ghost" size="icon" aria-label={`Bajar ${product.name}`} disabled={index === list.length - 1 || pending} onClick={() => move(index, index + 1)}><ArrowDown className="size-4" /></Button>
    </div>)}</div>
  </section>;
}
