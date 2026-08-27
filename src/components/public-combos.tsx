import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Gift, Tag, UtensilsCrossed, X } from "lucide-react";
import { getCatalog, getCombos } from "@/lib/cra/fns";
import { formatClp } from "@/lib/cra/sanitize";
import { useCart } from "@/lib/cra/cart-store";
import type { Combo, Product } from "@/lib/cra/types";

function benefitLabel(combo: Combo) {
  if (combo.benefitType === "percent") return `${combo.benefitValue}% de descuento`;
  if (combo.benefitType === "fixed") return `${formatClp(combo.benefitValue)} de descuento`;
  return `Precio combo ${formatClp(combo.benefitValue)}`;
}

function ComboPhoto({ combo }: { combo: Combo }) {
  if (!combo.imageUrl) return <div className="flex size-full items-center justify-center bg-surface-2"><UtensilsCrossed className="size-8 opacity-35" /></div>;
  return <img src={combo.imageUrl} alt={combo.name} loading="lazy" decoding="async" className="size-full object-cover" />;
}

function comboPricing(combo: Combo, products: Product[], selected: Record<string, number>) {
  const subtotal = Object.values(selected).reduce((sum, id) => sum + (products.find(p => p.id === id)?.price ?? 0), 0);
  if (combo.benefitType === "fixed") {
    const discount = Math.min(subtotal, Math.max(0, combo.benefitValue));
    return { subtotal, discount, total: subtotal - discount };
  }
  if (combo.benefitType === "percent") {
    const discount = Math.min(subtotal, Math.round(subtotal * Math.max(0, combo.benefitValue) / 100));
    return { subtotal, discount, total: subtotal - discount };
  }
  const total = Math.max(0, combo.benefitValue);
  return { subtotal, discount: Math.max(0, subtotal - total), total };
}

function ComboBuilder({ combo, products, onClose }: { combo: Combo; products: Product[]; onClose: () => void }) {
  const addItem = useCart(s => s.addItem);
  const [selected, setSelected] = useState<Record<string, number>>({});
  const slots = combo.rules.flatMap(rule => Array.from({ length: rule.quantity }, (_, index) => ({ key: `${rule.id}-${index}`, categoryId: rule.categoryId })));
  const complete = slots.every(slot => Boolean(selected[slot.key]));
  const selectedProducts = slots.map(slot => selected[slot.key]).filter(Boolean);
  const pricing = comboPricing(combo, products, selected);

  const choose = (key: string, productId: number) => setSelected(current => ({ ...current, [key]: productId }));
  const submit = () => {
    if (!complete || !selectedProducts.length) return;
    addItem({ lineId: undefined, productId: selectedProducts[0], extraIds: [], extras: [], note: "", qty: 1, name: combo.name, categoryLabel: "Combo", imageUrl: combo.imageUrl, comboId: combo.id, comboName: combo.name, comboSelections: selectedProducts.map(productId => ({ productId })), comboDiscount: pricing.discount });
    onClose();
  };

  return <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"><div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-surface p-5 shadow-2xl sm:rounded-3xl"><div className="mb-4 flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-kicker text-heart">Arma tu combo</p><h2 className="mt-1 font-display text-2xl font-semibold text-title">{combo.name}</h2><p className="mt-1 text-sm text-muted">Elige exactamente lo que quieres dentro del combo.</p></div><button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-full p-2 hover:bg-surface-2"><X className="size-5" /></button></div><div className="space-y-5">{slots.map((slot, index) => { const options = products.filter(p => p.categoryId === slot.categoryId && p.available && !p.isCustom); return <div key={slot.key}><label className="mb-2 block text-sm font-semibold text-title">{index + 1}. {slot.categoryId === "empanadas" ? "Empanada" : slot.categoryId === "fajitas" ? "Fajita" : slot.categoryId === "papas" ? "Papas fritas" : "Bebida"}</label><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{options.map(product => <button key={product.id} type="button" onClick={() => choose(slot.key, product.id)} className={`rounded-xl border p-3 text-left transition ${selected[slot.key] === product.id ? "border-heart bg-heart/10 ring-2 ring-heart/20" : "border-border hover:border-heart/50"}`}><span className="block text-sm font-semibold text-title">{product.name}</span><span className="mt-1 block text-xs text-muted">{formatClp(product.price)}</span></button>)}</div></div>; })}</div><div className="mt-5 rounded-2xl bg-surface-2 p-4"><div className="flex items-center justify-between"><span className="text-sm text-muted">Subtotal</span><strong className="text-sm text-title">{formatClp(pricing.subtotal)}</strong></div><div className="mt-1 flex items-center justify-between"><span className="text-sm text-muted">Beneficio combo</span><strong className="text-sm text-heart">−{formatClp(pricing.discount)}</strong></div><div className="mt-2 flex items-center justify-between border-t border-border pt-2"><span className="text-sm font-semibold text-title">Total del combo</span><strong className="text-xl text-title">{formatClp(pricing.total)}</strong></div>{complete ? <p className="mt-1 text-xs text-muted">El beneficio se volverá a validar al agregar el pedido.</p> : <p className="mt-1 text-xs text-muted">Completa todas las selecciones para continuar.</p>}</div><button type="button" disabled={!complete} onClick={submit} className="mt-4 w-full rounded-2xl bg-heart px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">Agregar combo al carrito</button></div></div>;
}

export function PublicCombos() {
  const { data: combos = [] } = useQuery({ queryKey: ["public-combos"], queryFn: () => getCombos() });
  const { data: catalog } = useQuery({ queryKey: ["public-catalog-for-combos"], queryFn: () => getCatalog() });
  const [building, setBuilding] = useState<Combo | null>(null);
  if (!combos.length) return null;
  const carousel = combos.length > 1;
  const products = catalog?.products ?? [];
  return <><section className="-mx-0 border-b border-border/80 bg-surface-2 py-6"><div className="w-full"><div className="mb-3 flex items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-kicker text-heart">Especiales CRA</p><h2 className="mt-1 font-display text-2xl font-semibold text-title">Combos</h2><p className="mt-1 text-sm text-muted">Más por menos, sin complicar tu pedido</p></div><Gift className="size-6 shrink-0 text-heart" /></div><div className="relative">{carousel && <button type="button" aria-label="Ver combos anteriores" onClick={() => document.getElementById("cra-combos-carousel")?.scrollBy({ left: -300, behavior: "smooth" })} className="absolute left-1 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-surface p-1.5 shadow-md lg:inline-flex"><ChevronLeft className="size-4" /></button>}<div id="cra-combos-carousel" className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{combos.map(combo => <article key={combo.id} className="w-[min(78vw,280px)] shrink-0 snap-start overflow-hidden rounded-[var(--radius-lg)] bg-surface shadow-[var(--shadow-border)] sm:w-[280px]"><div className="aspect-photo overflow-hidden bg-surface-2"><ComboPhoto combo={combo} /></div><div className="p-3"><div className="flex items-start justify-between gap-2"><h3 className="font-display text-lg font-semibold leading-snug text-title">{combo.name}</h3><span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-heart/10 px-2 py-1 text-[11px] font-semibold text-heart"><Tag className="size-3" /> {benefitLabel(combo)}</span></div><p className="mt-1.5 text-sm text-muted">{combo.description}</p><button type="button" onClick={() => setBuilding(combo)} className="mt-3 w-full rounded-xl bg-heart px-3 py-2.5 text-sm font-bold text-white">Armar combo</button></div></article>)}</div>{carousel && <button type="button" aria-label="Ver más combos" onClick={() => document.getElementById("cra-combos-carousel")?.scrollBy({ left: 300, behavior: "smooth" })} className="absolute right-1 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-surface p-1.5 shadow-md lg:inline-flex"><ChevronRight className="size-4" /></button>}</div></div></section>{building && <ComboBuilder combo={building} products={products} onClose={() => setBuilding(null)} />}</>;
}
