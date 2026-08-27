import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ImagePlus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { BrandLockup } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { FieldLabel, TextArea, TextField } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { adminCreateCombo, adminDeleteCombo, adminGetCombos, adminMe, adminUpdateCombo, getCatalog } from "@/lib/cra/fns";
import type { CategoryId, Combo, ComboBenefitType } from "@/lib/cra/types";

async function compressImage(file: File) {
  const bitmap = await createImageBitmap(file); const scale = Math.min(1, 900 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas"); canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("No se pudo procesar la imagen."); ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  let quality = 0.78; let data = canvas.toDataURL("image/jpeg", quality);
  while (data.length > 400_000 && quality > 0.35) { quality -= 0.08; data = canvas.toDataURL("image/jpeg", quality); }
  if (data.length > 400_000) throw new Error("La imagen sigue siendo muy pesada."); return data;
}

const selectableCategories: CategoryId[] = ["empanadas", "fajitas", "papas", "bebidas"];

function BenefitFields({ type, value, onType, onValue }: { type: ComboBenefitType; value: string; onType: (v: ComboBenefitType) => void; onValue: (v: string) => void }) {
  return <div className="space-y-2 rounded-[var(--radius-md)] bg-surface-2 p-3">
    <FieldLabel>Tipo de beneficio</FieldLabel>
    <div className="grid grid-cols-3 gap-2">
      {(["fixed", "percent", "price"] as ComboBenefitType[]).map((v) => <button key={v} type="button" onClick={() => onType(v)} className={`rounded-[var(--radius-md)] px-2 py-2 text-sm font-semibold ${type === v ? "bg-primary text-primary-foreground" : "bg-surface"}`}>{v === "fixed" ? "Descuento fijo" : v === "percent" ? "Descuento %" : "Precio final"}</button>)}
    </div>
    <div className="space-y-1"><FieldLabel>{type === "fixed" ? "Descuento (CLP)" : type === "percent" ? "Descuento (%)" : "Precio final (CLP)"}</FieldLabel><TextField inputMode="numeric" value={value} onChange={(e) => onValue(e.target.value.replace(/\D/g, ""))} placeholder="0" /></div>
  </div>;
}

function RuleEditor({ rules, onChange }: { rules: Array<{ categoryId: CategoryId; quantity: number }>; onChange: (v: Array<{ categoryId: CategoryId; quantity: number }>) => void }) {
  return <div className="space-y-2"><div className="flex items-center justify-between"><FieldLabel>Qué debe escoger el cliente</FieldLabel><Button type="button" size="sm" variant="secondary" onClick={() => onChange([...rules, { categoryId: "empanadas", quantity: 1 }])}><Plus className="size-4" />Regla</Button></div>{rules.map((rule, i) => <div key={i} className="grid grid-cols-[1fr_80px_40px] gap-2"><select className="h-11 rounded-[var(--radius-md)] bg-bg px-3 text-sm shadow-[var(--shadow-border)]" value={rule.categoryId} onChange={(e) => { const next = [...rules]; next[i] = { ...next[i], categoryId: e.target.value as CategoryId }; onChange(next); }}>{selectableCategories.map((c) => <option key={c} value={c}>{c === "empanadas" ? "Empanadas" : c === "fajitas" ? "Fajitas" : c === "papas" ? "Papas" : "Bebidas"}</option>)}</select><TextField inputMode="numeric" value={String(rule.quantity)} onChange={(e) => { const next = [...rules]; next[i] = { ...next[i], quantity: Math.max(1, Number(e.target.value.replace(/\D/g, "")) || 1) }; onChange(next); }} /><Button type="button" variant="ghost" onClick={() => onChange(rules.filter((_, x) => x !== i))} disabled={rules.length === 1}><Trash2 className="size-4" /></Button></div>)}</div>;
}

function ComboEditor({ combo, categories, onSaved, onDeleted }: { combo?: Combo; categories: { id: CategoryId; name: string }[]; onSaved: () => void; onDeleted?: () => void }) {
  const [name, setName] = useState(combo?.name ?? ""); const [description, setDescription] = useState(combo?.description ?? ""); const [imageUrl, setImageUrl] = useState(combo?.imageUrl ?? "");
  const [benefitType, setBenefitType] = useState<ComboBenefitType>(combo?.benefitType ?? "fixed"); const [benefitValue, setBenefitValue] = useState(String(combo?.benefitValue ?? 800)); const [available, setAvailable] = useState(combo?.available ?? false);
  const [rules, setRules] = useState(combo?.rules.map((r) => ({ categoryId: r.categoryId, quantity: r.quantity })) ?? [{ categoryId: "empanadas" as CategoryId, quantity: 2 }]);
  const queryClient = useQueryClient();
  const mutation = useMutation({ mutationFn: (data: Record<string, unknown>) => combo ? adminUpdateCombo({ data: { id: combo.id, ...data } }) : adminCreateCombo({ data }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-combos"] }); toast.success(combo ? "Combo actualizado" : "Combo creado"); onSaved(); }, onError: (e: Error) => toast.error(e.message) });
  const remove = useMutation({ mutationFn: () => adminDeleteCombo({ data: { id: combo?.id } }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-combos"] }); toast.success("Combo eliminado"); onDeleted?.(); }, onError: (e: Error) => toast.error(e.message) });
  async function fileChange(file?: File) { if (!file) return; try { setImageUrl(await compressImage(file)); } catch (e) { toast.error(e instanceof Error ? e.message : "No se pudo procesar la imagen."); } }
  return <form className="space-y-4 rounded-[var(--radius-lg)] bg-surface p-4 shadow-[var(--shadow-border)]" onSubmit={(e) => { e.preventDefault(); mutation.mutate({ name: name.trim(), description: description.trim(), imageUrl, benefitType, benefitValue: Number(benefitValue) || 0, available, rules }); }}>
    <div className="flex gap-3"><label className="relative size-28 shrink-0 cursor-pointer overflow-hidden rounded-[var(--radius-md)] bg-surface-2">{imageUrl ? <img src={imageUrl} alt="" className="size-full object-cover" /> : <span className="flex size-full flex-col items-center justify-center text-muted"><ImagePlus className="size-6" /><span className="text-[10px]">FOTO</span></span>}<input className="absolute inset-0 opacity-0" type="file" accept="image/*" onChange={(e) => void fileChange(e.target.files?.[0])} /></label><div className="min-w-0 flex-1 space-y-2"><div><FieldLabel>Nombre</FieldLabel><TextField value={name} onChange={(e) => setName(e.target.value)} required /></div><div><FieldLabel>Descripción</FieldLabel><TextArea value={description} onChange={(e) => setDescription(e.target.value)} /></div></div></div>
    <RuleEditor rules={rules} onChange={setRules} />
    <BenefitFields type={benefitType} value={benefitValue} onType={setBenefitType} onValue={setBenefitValue} />
    <div className="flex items-center justify-between rounded-[var(--radius-md)] bg-surface-2 p-3"><span className="text-sm font-semibold">Visible en el menú público</span><Switch checked={available} onCheckedChange={setAvailable} /></div>
    <div className="flex justify-between"><div>{combo && <Button type="button" variant="ghost" className="text-heart" onClick={() => remove.mutate()} disabled={remove.isPending}><Trash2 className="size-4" />Eliminar</Button>}</div><Button type="submit" disabled={mutation.isPending}>{combo ? "Guardar cambios" : "Crear combo"}</Button></div>
  </form>;
}

export function AdminCombosPage() {
  const me = useQuery({ queryKey: ["admin-me"], queryFn: () => adminMe() });
  const catalog = useQuery({ queryKey: ["catalog"], queryFn: () => getCatalog() });
  const combos = useQuery({ queryKey: ["admin-combos"], queryFn: () => adminGetCombos(), enabled: me.data?.ok === true });
  const [creating, setCreating] = useState(false);
  if (me.isLoading) return <div className="p-6 text-center">Cargando…</div>;
  if (!me.data?.ok) return <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4"><BrandLockup /><h1 className="mt-8 text-2xl font-semibold">Panel CRA</h1><p className="mt-2 text-sm text-muted">Debes iniciar sesión en el panel administrativo antes de gestionar combos.</p><Link className="mt-5" to="/admin"><Button>Ir al panel</Button></Link></div>;
  const categories = (catalog.data?.categories ?? []).filter((c) => selectableCategories.includes(c.id)).map((c) => ({ id: c.id, name: c.name }));
  return <main className="mx-auto min-h-dvh max-w-3xl px-4 py-6"><div className="flex items-center justify-between gap-3"><Link to="/admin"><Button variant="ghost"><ArrowLeft className="size-4" />Admin</Button></Link><h1 className="font-display text-3xl font-semibold">Combos</h1><Button variant="secondary" onClick={() => setCreating((v) => !v)}><Plus className="size-4" />Nuevo</Button></div><p className="mt-2 text-sm text-muted">Crea combos flexibles: el cliente elige los productos y CRA calcula el beneficio.</p>{creating && <div className="mt-5"><ComboEditor categories={categories} onSaved={() => setCreating(false)} /></div>}<div className="mt-5 space-y-4">{combos.data?.map((combo) => <ComboEditor key={combo.id} combo={combo} categories={categories} onSaved={() => void combos.refetch()} />)}{combos.data?.length === 0 && !creating ? <div className="rounded-[var(--radius-lg)] bg-surface p-6 text-center text-muted">Todavía no hay combos. Crea el primero.</div> : null}</div></main>;
}
