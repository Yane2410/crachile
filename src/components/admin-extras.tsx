import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { TextField, TextArea } from "@/components/ui/field";
import { adminCreateProduct, adminDeleteProduct, adminPatchProduct } from "@/lib/cra/fns";

type Extra = { id: string; name: string; description?: string; price: number; available?: boolean; category: string };

type Props = { extras: Extra[]; onChanged?: () => void };

export function AdminExtras({ extras, onChanged }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);

  async function createExtra() {
    const parsed = Number(price);
    if (!name.trim()) return toast.error("Escribe el nombre del extra");
    if (!Number.isFinite(parsed) || parsed < 0) return toast.error("Ingresa un precio válido");
    setSaving(true);
    try {
      await adminCreateProduct({ name: name.trim(), description: description.trim(), price: parsed, category: "extras", available: true });
      setName(""); setDescription(""); setPrice("");
      toast.success("Extra creado");
      onChanged?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo crear el extra");
    } finally { setSaving(false); }
  }

  async function removeExtra(extra: Extra) {
    if (!window.confirm(`¿Eliminar ${extra.name}?`)) return;
    try {
      await adminDeleteProduct(extra.id);
      toast.success("Extra eliminado");
      onChanged?.();
    } catch (error) { toast.error(error instanceof Error ? error.message : "No se pudo eliminar"); }
  }

  async function toggle(extra: Extra, available: boolean) {
    try {
      await adminPatchProduct(extra.id, { available });
      toast.success(available ? "Extra disponible" : "Extra agotado");
      onChanged?.();
    } catch (error) { toast.error(error instanceof Error ? error.message : "No se pudo actualizar"); }
  }

  return <section className="space-y-5 rounded-2xl border bg-white p-5 shadow-sm">
    <div><h2 className="text-xl font-bold">➕ Extras</h2><p className="text-sm text-muted-foreground">Administra adicionales como salsas, queso y otros complementos.</p></div>
    <div className="grid gap-3 md:grid-cols-2">
      <TextField label="Nombre" value={name} onChange={(e) => setName(e.target.value)} placeholder="Salsa de ajo" />
      <TextField label="Precio" type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="500" />
      <div className="md:col-span-2"><TextArea label="Descripción" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Porción extra de salsa de ajo" /></div>
      <Button onClick={createExtra} disabled={saving}>{saving ? "Guardando…" : "Crear extra"}</Button>
    </div>
    <div className="space-y-2">
      {extras.length === 0 && <p className="rounded-xl bg-muted/40 p-4 text-sm">Todavía no hay extras creados.</p>}
      {extras.map((extra) => <div key={extra.id} className="flex items-center gap-3 rounded-xl border p-3"><div className="min-w-0 flex-1"><div className="font-semibold truncate">{extra.name}</div><div className="text-sm">${extra.price.toLocaleString("es-CL")}</div>{extra.description && <div className="text-xs text-muted-foreground truncate">{extra.description}</div>}</div><Switch checked={extra.available !== false} onCheckedChange={(checked) => toggle(extra, checked)} /><Button variant="destructive" size="sm" onClick={() => removeExtra(extra)}>Eliminar</Button></div>)}
    </div>
  </section>;
}
