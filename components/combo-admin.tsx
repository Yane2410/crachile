import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FieldLabel, TextArea, TextField } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { adminCreateCombo, adminDeleteCombo, adminPatchCombo, getAdminCombos } from "@/lib/cra/fns";
import type { CategoryId, Combo } from "@/lib/cra/types";

const ruleCategories: Array<{ id: Exclude<CategoryId, "combos">; label: string }> = [
  { id: "empanadas", label: "Empanadas" },
  { id: "fajitas", label: "Fajitas" },
  { id: "papas", label: "Papas" },
  { id: "bebidas", label: "Bebidas" },
];
const blankRule = () => ({ categoryId: "empanadas" as const, quantity: 2, label: "Elige tus productos" });

function BenefitFields({ type, value, onType, onValue }: { type: Combo["priceMode"]; value: string; onType: (v: Combo["priceMode"]) => void; onValue: (v: string) => void }) {
  const labels = {
    amount: { title: "Descuento fijo", help: "Resta un monto fijo al precio normal del combo.", field: "Monto del descuento (CLP)", example: "Ej.: 800" },
    percent: { title: "Descuento porcentual", help: "Resta un porcentaje al precio normal del combo.", field: "Porcentaje de descuento", example: "Ej.: 10" },
    fixed: { title: "Precio final", help: "Define directamente cuánto pagará el cliente.", field: "Precio final (CLP)", example: "Ej.: 7500" },
  } as const;
  const current = labels[type];
  return (
    <section className="space-y-3 rounded-[var(--radius-md)] border border-primary/20 bg-primary/5 p-4">
      <div>
        <p className="font-semibold">💰 Beneficio del combo</p>
        <p className="mt-1 text-xs text-muted">Elige cómo se calcula el beneficio. No es necesario fijar siempre un precio final.</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <button type="button" onClick={() => onType("amount")} className={`rounded-[var(--radius-md)] border px-3 py-3 text-left text-sm font-semibold ${type === "amount" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface"}`}>
          <span className="block">Descuento fijo</span><span className="mt-1 block text-xs font-normal opacity-80">$800</span>
        </button>
        <button type="button" onClick={() => onType("percent")} className={`rounded-[var(--radius-md)] border px-3 py-3 text-left text-sm font-semibold ${type === "percent" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface"}`}>
          <span className="block">Descuento %</span><span className="mt-1 block text-xs font-normal opacity-80">10%</span>
        </button>
        <button type="button" onClick={() => onType("fixed")} className={`rounded-[var(--radius-md)] border px-3 py-3 text-left text-sm font-semibold ${type === "fixed" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface"}`}>
          <span className="block">Precio final</span><span className="mt-1 block text-xs font-normal opacity-80">$7.500</span>
        </button>
      </div>
      <div className="space-y-1">
        <FieldLabel>{current.field}</FieldLabel>
        <TextField inputMode="numeric" value={value} onChange={(e) => onValue(e.target.value.replace(/\D/g, ""))} placeholder={current.example.replace("Ej.: ", "")} />
        <p className="text-xs text-muted">{current.help}</p>
      </div>
    </section>
  );
}

function RuleEditor({ rules, onChange }: { rules: Array<{ categoryId: Exclude<CategoryId, "combos">; quantity: number; label: string }>; onChange: (v: Array<{ categoryId: Exclude<CategoryId, "combos">; quantity: number; label: string }>) => void }) {
  return (
    <section className="space-y-3 rounded-[var(--radius-md)] border border-border bg-surface-2 p-4">
      <div className="flex items-center justify-between gap-2">
        <div><p className="font-semibold">🧩 Reglas del combo</p><p className="mt-1 text-xs text-muted">Define qué categorías y cuántos productos puede escoger el cliente.</p></div>
        <Button type="button" variant="secondary" size="sm" onClick={() => onChange([...rules, blankRule()])}><Plus className="size-4" />Regla</Button>
      </div>
      <div className="space-y-2">
        {rules.map((r, i) => (
          <div key={i} className="grid gap-2 rounded-[var(--radius-md)] bg-surface p-3 sm:grid-cols-[minmax(0,1fr)_90px_minmax(0,1fr)_auto] sm:items-end">
            <div className="space-y-1"><FieldLabel className="text-xs">Categoría</FieldLabel><select className="h-10 w-full rounded-[var(--radius-md)] bg-bg px-2 text-sm" value={r.categoryId} onChange={(e) => onChange(rules.map((x, j) => j === i ? { ...x, categoryId: e.target.value as Exclude<CategoryId, "combos"> } : x))}>{ruleCategories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select></div>
            <div className="space-y-1"><FieldLabel className="text-xs">Cantidad</FieldLabel><TextField inputMode="numeric" value={String(r.quantity)} onChange={(e) => onChange(rules.map((x, j) => j === i ? { ...x, quantity: Math.max(1, Number(e.target.value.replace(/\D/g, "")) || 1) } : x))} /></div>
            <div className="space-y-1"><FieldLabel className="text-xs">Texto para cliente</FieldLabel><TextField value={r.label} onChange={(e) => onChange(rules.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} /></div>
            {rules.length > 1 ? <Button type="button" variant="ghost" size="icon" onClick={() => onChange(rules.filter((_, j) => j !== i))} aria-label="Eliminar regla"><Trash2 className="size-4" /></Button> : <span />}
          </div>
        ))}
      </div>
    </section>
  );
}

function ComboForm({ combo, onDone }: { combo?: Combo; onDone: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState(combo?.name ?? "");
  const [description, setDescription] = useState(combo?.description ?? "");
  const [priceMode, setPriceMode] = useState<Combo["priceMode"]>(combo?.priceMode ?? "amount");
  const [priceValue, setPriceValue] = useState(String(combo?.priceValue ?? 800));
  const [imageUrl, setImageUrl] = useState(combo?.imageUrl ?? "");
  const [rules, setRules] = useState(combo?.rules.map((r) => ({ categoryId: r.categoryId, quantity: r.quantity, label: r.label })) ?? [blankRule()]);
  const [available, setAvailable] = useState(combo?.available ?? false);
  const [saving, setSaving] = useState(false);

  async function photo(file?: File) {
    if (!file) return;
    try {
      const b = await createImageBitmap(file); const s = Math.min(1, 900 / Math.max(b.width, b.height)); const c = document.createElement("canvas"); c.width = Math.round(b.width * s); c.height = Math.round(b.height * s); c.getContext("2d")?.drawImage(b, 0, 0, c.width, c.height);
      let q = 0.78; let d = c.toDataURL("image/jpeg", q); while (d.length > 400000 && q > 0.35) { q -= 0.08; d = c.toDataURL("image/jpeg", q); } if (d.length > 400000) throw new Error("La imagen sigue siendo muy pesada."); setImageUrl(d);
    } catch (e) { toast.error(e instanceof Error ? e.message : "No se pudo procesar la foto."); }
  }

  async function save() {
    setSaving(true);
    try {
      const data = { name, description, priceMode, priceValue: Number(priceValue) || 0, imageUrl, available, rules };
      if (combo) await adminPatchCombo({ data: { id: combo.id, ...data } }); else await adminCreateCombo({ data });
      await qc.invalidateQueries({ queryKey: ["admin-combos"] }); toast.success(combo ? "Combo actualizado" : "Combo creado"); onDone();
    } catch (e) { toast.error(e instanceof Error ? e.message : "No se pudo guardar el combo."); } finally { setSaving(false); }
  }

  return (
    <div className="space-y-4 rounded-[var(--radius-lg)] bg-surface p-4 shadow-[var(--shadow-border)]">
      <div className="flex gap-3">
        <label className="relative size-28 shrink-0 cursor-pointer overflow-hidden rounded-[var(--radius-md)] bg-surface-2">{imageUrl ? <img src={imageUrl} alt="" className="size-full object-cover" /> : <span className="flex size-full flex-col items-center justify-center gap-1 text-muted"><ImagePlus className="size-6" /><span className="text-[10px] font-bold uppercase">Foto</span></span>}<span className="absolute inset-x-0 bottom-0 bg-fg/60 py-1 text-center text-[10px] font-bold text-primary-foreground">{imageUrl ? "Cambiar foto" : "Subir foto"}</span><input type="file" accept="image/*" className="absolute inset-0 opacity-0" onChange={(e) => void photo(e.target.files?.[0])} /></label>
        <div className="min-w-0 flex-1 space-y-2"><div className="space-y-1"><FieldLabel>Nombre del combo</FieldLabel><TextField value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej.: Combo CRA" required /></div><div className="space-y-1"><FieldLabel>Descripción</FieldLabel><TextArea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Qué incluye el combo" /></div></div>
      </div>
      <RuleEditor rules={rules} onChange={setRules} />
      <BenefitFields type={priceMode} value={priceValue} onType={setPriceMode} onValue={setPriceValue} />
      <div className="flex items-center justify-between rounded-[var(--radius-md)] bg-surface-2 p-3"><div><p className="text-sm font-semibold">Publicación</p><p className="text-xs text-muted">Activa esto solo cuando quieras mostrar el combo en el menú.</p></div><div className="flex items-center gap-2"><Switch checked={available} onCheckedChange={setAvailable} /><span className="text-xs text-muted">{available ? "Activo" : "Inactivo"}</span></div></div>
      <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onDone}>Cancelar</Button><Button type="button" disabled={saving || !name.trim()} onClick={() => void save()}>{saving ? "Guardando…" : combo ? "Guardar cambios" : "Crear combo"}</Button></div>
    </div>
  );
}

function ComboCard({ combo }: { combo: Combo }) {
  const qc = useQueryClient(); const [edit, setEdit] = useState(false);
  const patch = useMutation({ mutationFn: (data: Record<string, unknown>) => adminPatchCombo({ data }), onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-combos"] }), onError: (e: Error) => toast.error(e.message) });
  const remove = useMutation({ mutationFn: (id: number) => adminDeleteCombo({ data: { id } }), onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-combos"] }), onError: (e: Error) => toast.error(e.message) });
  if (edit) return <ComboForm combo={combo} onDone={() => setEdit(false)} />;
  const benefit = combo.priceMode === "fixed" ? `Precio final $${combo.priceValue.toLocaleString("es-CL")}` : combo.priceMode === "percent" ? `${combo.priceValue}% de descuento` : `$${combo.priceValue.toLocaleString("es-CL")} de descuento`;
  return <article className="rounded-[var(--radius-lg)] bg-surface p-3 shadow-[var(--shadow-border)]"><div className="flex gap-3">{combo.imageUrl ? <img src={combo.imageUrl} alt="" className="size-28 shrink-0 rounded-[var(--radius-md)] object-cover" /> : <div className="flex size-28 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-surface-2 text-muted"><ImagePlus className="size-7" /></div>}<div className="min-w-0 flex-1"><p className="font-semibold">{combo.name}</p><p className="mt-1 text-sm text-muted">{combo.description}</p><p className="mt-2 text-xs text-muted">{combo.rules.map((r) => `${r.quantity} × ${ruleCategories.find((c) => c.id === r.categoryId)?.label}`).join(" · ")}</p><p className="mt-2 text-sm font-semibold">{benefit}</p><div className="mt-2 flex items-center justify-end gap-2"><Switch checked={combo.available} onCheckedChange={(v) => patch.mutate({ id: combo.id, available: v })} /><span className="text-xs text-muted">{combo.available ? "Activo" : "Inactivo"}</span></div></div></div><div className="mt-3 flex justify-end gap-2"><Button size="sm" variant="ghost" onClick={() => setEdit(true)}>Editar</Button><Button size="sm" variant="ghost" className="text-heart" onClick={() => remove.mutate(combo.id)}><Trash2 className="size-4" />Quitar</Button></div></article>;
}

export function ComboAdmin() {
  const q = useQuery({ queryKey: ["admin-combos"], queryFn: () => getAdminCombos() });
  const [newOpen, setNewOpen] = useState(false);
  return <div className="space-y-4">{newOpen ? <ComboForm onDone={() => setNewOpen(false)} /> : <Button variant="secondary" className="w-full" onClick={() => setNewOpen(true)}><Plus className="size-4" />Nuevo combo</Button>}{q.isLoading ? <p className="text-sm text-muted">Cargando combos…</p> : q.data?.map((c) => <ComboCard key={c.id} combo={c} />)}{q.data?.length === 0 && !newOpen ? <p className="rounded-[var(--radius-md)] bg-surface-2 p-4 text-center text-sm text-muted">Todavía no hay combos.</p> : null}</div>;
}
