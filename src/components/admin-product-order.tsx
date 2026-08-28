import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Check, GripVertical, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cra/cn";
import type { Product } from "@/lib/cra/types";

export function ProductOrderControls({ products, pending, onMove, onSave }: { products: Product[]; pending?: boolean; onMove?: (from: number, to: number) => void; onSave: (products: Product[]) => void }) {
  const source = useMemo(() => [...products].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id), [products]);
  const [draft, setDraft] = useState<Product[] | null>(null);
  const list = draft ?? source;
  useEffect(() => { if (!draft) return; const sourceIds = source.map((p) => p.id).join(","); const draftIds = draft.map((p) => p.id).join(","); if (sourceIds === draftIds) setDraft(null); }, [source, draft]);
  const dirty = draft !== null;
  function move(from: number, to: number) {
    if (to < 0 || to >= list.length || pending) return;
    const next = [...list];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setDraft(next);
    onMove?.(from, to);
  }
  function cancel() { setDraft(null); }
  function save() { if (!dirty || pending) return; onSave(list.map((product, index) => ({ ...product, sortOrder: index + 1 }))); }
  return <section className="rounded-[var(--radius-lg)] bg-surface p-4 shadow-[var(--shadow-border)]">
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
      <div><div className="flex items-center gap-2"><p className="font-semibold">Orden de productos</p>{dirty ? <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">Cambios pendientes</span> : null}</div><p className="mt-0.5 text-xs text-muted">Así aparecerán dentro de esta categoría en el menú público.</p></div>
      {dirty ? <div className="flex gap-2"><Button type="button" size="sm" variant="ghost" onClick={cancel} disabled={pending}><RotateCcw className="size-4" />Cancelar</Button><Button type="button" size="sm" disabled={pending} onClick={save}>{pending ? "Guardando…" : <><Check className="size-4" />Guardar orden</>}</Button></div> : null}
    </div>
    {list.length === 0 ? <p className="rounded-[var(--radius-md)] bg-surface-2 px-3 py-4 text-sm text-muted">No hay productos en esta categoría.</p> : <div className="space-y-1.5">{list.map((product, index) => <div key={product.id} className={cn("flex items-center gap-2 rounded-[var(--radius-md)] bg-surface-2 px-2 py-2.5", dirty && "ring-1 ring-primary/10")}>
      <GripVertical className="size-4 shrink-0 text-muted" aria-hidden="true" /><span className="w-6 shrink-0 text-center text-xs font-bold text-muted">{index + 1}</span><span className="min-w-0 flex-1 truncate text-sm font-semibold">{product.name}</span>
      <Button type="button" variant="ghost" size="icon" aria-label={`Subir ${product.name}`} disabled={index === 0 || pending} onClick={() => move(index, index - 1)}><ArrowUp className="size-4" /></Button>
      <Button type="button" variant="ghost" size="icon" aria-label={`Bajar ${product.name}`} disabled={index === list.length - 1 || pending} onClick={() => move(index, index + 1)}><ArrowDown className="size-4" /></Button>
    </div>)}</div>}
  </section>;
}
