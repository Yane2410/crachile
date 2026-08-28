import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { FieldLabel, TextArea, TextField } from "@/components/ui/field";
import { adminCreateProduct, adminDeleteProduct, adminPatchProduct } from "@/lib/cra/fns";
import type { Product } from "@/lib/cra/types";

type Props = { extras: Product[]; onChanged?: () => void };

export function AdminExtras({ extras, onChanged }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);

  async function createExtra() {
    const parsed = Number(price);
    if (!name.trim()) return toast.error("Escribe el nombre del extra");
    if (!Number.isFinite(parsed) || parsed <= 0) return toast.error("El precio debe ser mayor que cero");
    setSaving(true);
    try {
      await adminCreateProduct({ data: { name: name.trim(), description: description.trim(), price: parsed, categoryId: "extras" } });
      setName(""); setDescription(""); setPrice("");
      toast.success("Extra creado");
      onChanged?.();
    } catch (error) { toast.error(error instanceof Error ? error.message : "No se pudo crear el extra"); }
    finally { setSaving(false); }
  }

  async function removeExtra(extra: Product) {
    if (!window.confirm(`¿Eliminar ${extra.name}? Esta acción no se puede deshacer.`)) return;
    try {
      await adminDeleteProduct({ data: { id: extra.id } });
      toast.success("Extra eliminado");
      onChanged?.();
    } catch (error) { toast.error(error instanceof Error ? error.message : "No se pudo eliminar"); }
  }

  async function toggle(extra: Product, available: boolean) {
    try {
      await adminPatchProduct({ data: { id: extra.id, available } });
      toast.success(available ? "Extra disponible" : "Extra agotado");
      onChanged?.();
    } catch (error) { toast.error(error instanceof Error ? error.message : "No se pudo actualizar"); }
  }

  return <section className="space-y-5 rounded-2xl border bg-white p-5 shadow-sm">
    <div><h2 className="text-xl font-bold">➕ Extras</h2><p className="text-sm text-muted-foreground">Administra adicionales como salsa de ajo, queso extra y otros complementos.</p></div>
    <div className="grid gap-3 md:grid-cols-2">
      <div className="space-y-1"><FieldLabel>Nombre</FieldLabel><TextField value={name} onChange={(e) => setName(e.target.value)} placeholder="Salsa de ajo" /></div>
      <div className="space-y-1"><FieldLabel>Precio (CLP)</FieldLabel><TextField type="number" min="1" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="500" /></div>
      <div className="space-y-1 md:col-span-2"><FieldLabel>Descripción</FieldLabel><TextArea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Porción extra de salsa de ajo" /></div>
      <Button type="button" onClick={() => void createExtra()} disabled={saving}>{saving ? "Guardando…" : "Crear extra"}</Button>
    </div>
    <div className="space-y-2">
      {extras.length === 0 && <p className="rounded-xl bg-muted/40 p-4 text-sm">Todavía no hay extras creados.</p>}
      {extras.map((extra) => <div key={extra.id} className="flex items-center gap-3 rounded-xl border p-3"><div className="min-w-0 flex-1"><div className="font-semibold truncate">{extra.name}</div><div className="text-sm">{extra.price.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 })}</div>{extra.description && <div className="text-xs text-muted-foreground truncate">{extra.description}</div>}</div><span className="text-xs text-muted-foreground">{extra.available ? "Disponible" : "Oculto"}</span><Switch checked={extra.available} onCheckedChange={(checked) => void toggle(extra, checked)} /><Button type="button" variant="destructive" size="sm" onClick={() => void removeExtra(extra)}>Eliminar</Button></div>)}
    </div>
  </section>;
}
