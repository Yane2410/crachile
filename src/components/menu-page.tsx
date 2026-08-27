import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, Clock, MapPin, Minus, Plus, ShoppingBag, UtensilsCrossed, X } from "lucide-react";
import { toast } from "sonner";
import { BrandLockup, BrandLogo } from "@/components/brand";
import { PublicCombos } from "@/components/public-combos";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { QtyStepper, TextArea } from "@/components/ui/field";
import { cartCount, cartTotal, lineUnitPrice, useCart, validateLine } from "@/lib/cra/cart-store";
import { cn } from "@/lib/cra/cn";
import { mozzarellaDelta } from "@/lib/cra/pricing";
import { formatClp } from "@/lib/cra/sanitize";
import type { Catalog, Ingredient, Product } from "@/lib/cra/types";

const FAVORITES = ["Mechada + Plátano + Llanero", "Pabellón", "Fajita Rezar"];

function featuredProducts(products: Product[]) {
  const picked = FAVORITES.map((name) => products.find((p) => p.name === name)).filter((p): p is Product => !!p);
  if (picked.length >= 3) return picked.slice(0, 3);
  const rest = [...products]
    .filter((p) => !p.isCustom && !picked.some((x) => x.id === p.id))
    .sort((a, b) => b.price - a.price);
  return [...picked, ...rest].slice(0, 3);
}

function groupBySub(products: Product[]) {
  const order: string[] = [];
  const map = new Map<string, Product[]>();
  for (const product of products) {
    const key = product.subcategory ?? "";
    if (!map.has(key)) {
      map.set(key, []);
      order.push(key);
    }
    map.get(key)!.push(product);
  }
  return order.map((key) => ({ label: key || null, products: map.get(key)! }));
}

function badges(product: Product, featured: boolean) {
  const list: string[] = [];
  if (product.subcategory === "CRA") list.push("De la casa");
  if (featured) list.push("Más pedido");
  if (product.isCustom) list.push("A tu gusto");
  return [...new Set(list)];
}

function Photo({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className="flex size-full items-center justify-center bg-surface-2">
        <UtensilsCrossed className="size-12 opacity-40" />
      </div>
    );
  }
  return (
    <img src={src} alt={alt} loading="lazy" decoding="async" className="size-full object-cover" onError={() => setFailed(true)} />
  );
}

function SectionHead({ title, kicker }: { title: string; kicker?: string }) {
  return (
    <div className="mb-4">
      <h2 className="font-display text-3xl font-semibold text-title">{title}</h2>
      {kicker ? <p className="mt-1 text-sm text-muted">{kicker}</p> : null}
    </div>
  );
}

function Hero({ settings }: { settings: Catalog["settings"] }) {
  const prep = `Preparación: ${settings.prepMin}–${settings.prepMax} min`;
  const hours = settings.hours || "Lunes a domingo · 09:00–16:00";
  const coverage = settings.coverage || "Nororiente, Talca";
  return (
    <section className="relative mx-auto max-w-menu lg:px-4 lg:pt-5">
      <div className="relative h-hero-mobile min-h-56 overflow-hidden lg:grid lg:h-auto lg:min-h-0 lg:grid-cols-[1.15fr_0.85fr] lg:rounded-[var(--radius-xl)] lg:bg-surface lg:shadow-[var(--shadow-border)]">
        <div className="relative h-full min-h-56 overflow-hidden lg:min-h-80 lg:rounded-[var(--radius-xl)]">
          <img src="/menu/hero.jpg" alt="Fajita, empanadas venezolanas y salsa CRA" className="size-full object-cover lg:rounded-[var(--radius-xl)]" />
          <div className="absolute inset-0 bg-linear-to-t from-title/80 via-title/15 to-transparent lg:hidden" />
          <div className="absolute inset-x-0 bottom-0 p-4 lg:hidden">
            <p className="text-sm font-medium text-primary-foreground">Fusión venezolana · {coverage} · Pedido por WhatsApp</p>
            <p className="mt-1 text-xs text-primary-foreground/85">Horario: {hours}</p>
            <p className="mt-0.5 text-xs text-primary-foreground/85">{prep}</p>
          </div>
        </div>
        <div className="hidden flex-col justify-center px-8 py-10 lg:flex">
          <p className="text-xs font-semibold uppercase tracking-kicker text-muted">Carta digital</p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-title">{settings.restaurantName}</h1>
          <p className="mt-3 text-base text-fg">Fusión venezolana · Pedido por WhatsApp</p>
          <p className="mt-5 flex items-center gap-2 text-sm text-muted"><Clock className="size-4" />Horario: {hours}</p>
          <p className="mt-2 text-sm text-muted">{prep}</p>
          <p className="mt-2 flex items-center gap-2 text-sm text-muted"><MapPin className="size-4" />{coverage}</p>
        </div>
      </div>
    </section>
  );
}

function ProductCard({ product, settings, catalogProducts, onPick, featured = false, lead = false }: { product: Product; settings: Catalog["settings"]; catalogProducts: Product[]; onPick: () => void; featured?: boolean; lead?: boolean }) {
  const soldOut = !product.available;
  const price = product.isCustom ? product.customKind === "empanada" ? `Desde ${formatClp(settings.empanada1)}` : `Desde ${formatClp(settings.fajitaBase)}` : formatClp(product.price);
  const tags = badges(product, featured);
  const extra = mozzarellaDelta(product, catalogProducts);
  return (
    <article className={cn("flex flex-col overflow-hidden rounded-[var(--radius-lg)] bg-surface shadow-[var(--shadow-border)]", lead && "sm:col-span-2 sm:flex-row lg:col-span-2", soldOut && "opacity-55")}>
      <button type="button" onClick={onPick} disabled={soldOut} className={cn("relative block w-full overflow-hidden bg-surface-2 text-left", lead ? "aspect-photo sm:aspect-auto sm:w-1/2 sm:self-stretch" : "aspect-photo")}>
        <Photo src={product.imageUrl} alt={product.name} />
        {soldOut ? <span className="absolute inset-0 flex items-center justify-center"><span className="rotate-[-8deg] rounded-sm border-2 border-title px-3 py-1 font-display text-lg font-semibold uppercase tracking-wide text-title">Agotado</span></span> : null}
        {tags.length && !soldOut ? <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1">{tags.map((tag) => <span key={tag} className="rounded-full bg-surface/95 px-2 py-0.5 text-xs font-semibold text-title shadow-[var(--shadow-border)]">{tag}</span>)}</div> : null}
      </button>
      <div className="flex min-w-0 flex-1 flex-col p-3.5">
        <h3 className="font-display text-lg font-semibold leading-snug text-title">{product.name}</h3>
        <p className="mt-1 line-clamp-1 text-sm text-muted">{product.description}</p>
        {extra ? <p className="mt-0.5 text-xs text-muted">+{formatClp(extra.delta)} por mozzarella</p> : null}
        <div className="mt-3 flex items-center justify-between gap-3"><span className="text-base font-semibold tabular-nums text-title">{price}</span><button type="button" onClick={onPick} disabled={soldOut} className="press-add inline-flex h-10 items-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50">Agregar</button></div>
      </div>
    </article>
  );
}

function nextSuggestion(catalog: Catalog, items: { productId: number }[]) {
  const taken = new Set(items.map((i) => i.productId));
  const cats = new Set(items.map((i) => catalog.products.find((p) => p.id === i.productId)?.categoryId).filter(Boolean));
  const pick = (cat: string) => catalog.products.filter((p) => p.available && p.categoryId === cat && !taken.has(p.id) && !p.isCustom).sort((a, b) => a.price - b.price)[0];
  if (cats.has("bebidas")) { if (cats.has("papas")) return cats.has("fajitas") ? null : pick("fajitas"); return pick("papas"); }
  return pick("bebidas");
}

function Upsell({ catalog, onPick, onDismiss }: { catalog: Catalog; onPick: (p: Product) => void; onDismiss: () => void }) {
  const items = useCart((s) => s.items);
  const product = nextSuggestion(catalog, items);
  if (!product) return null;
  return <div className="mx-auto mb-2 flex w-full max-w-md items-center gap-2 rounded-[var(--radius-md)] bg-surface-2 px-3 py-2 text-xs text-fg"><p className="min-w-0 flex-1">¿Le ponemos algo más? Te faltan {formatClp(product.price)} para <span className="font-semibold">{product.name}</span></p><button type="button" className="shrink-0 font-semibold text-heart" onClick={() => onPick(product)}>Agregar</button><button type="button" aria-label="Cerrar sugerencia" onClick={onDismiss}><X className="size-4" /></button></div>;
}

function IngredientGrid({ title, hint, ingredients, selected, kind, settings, onToggle }: { title: string; hint: string; ingredients: Ingredient[]; selected: string[]; kind: "empanada" | "fajita" | null; settings: Catalog["settings"]; onToggle: (id: string) => void }) {
  return <div><p className="text-sm font-semibold text-title">{title}</p><p className="mt-1 text-xs text-muted">{hint}</p><div className="mt-3 grid grid-cols-2 gap-2">{ingredients.map((ing) => { const on = selected.includes(ing.id); return <button key={ing.id} type="button" onClick={() => onToggle(ing.id)} className={cn("flex min-h-11 items-center justify-between gap-2 rounded-[var(--radius-md)] px-3 py-2 text-left text-sm font-medium transition-colors duration-[var(--motion-quick)]", on ? "bg-title text-surface" : "bg-surface text-fg shadow-[var(--shadow-border)]")}><span>{ing.name}{ing.premium ? <span className={cn("ml-1 text-xs", on ? "text-surface/80" : "text-heart")}>+{formatClp(settings.empanadaPremium)}</span> : null}</span>{kind === "fajita" ? <span className="text-xs tabular-nums opacity-80">+{formatClp(ing.fajitaPrice)}</span> : null}</button>; })}</div></div>;
}

function CustomSteps({ step }: { step: number }) { return <ol className="mx-5 mt-3 flex items-center gap-2">{["Base", "Extras", "Revisar"].map((label, i) => { const n = i + 1; const active = step === n; return <li key={label} className="flex min-w-0 flex-1 items-center gap-2"><span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums", active || step > n ? "bg-title text-surface" : "bg-surface-2 text-muted")}>{n}</span><span className={cn("truncate text-xs font-medium", active ? "text-title" : "text-muted")}>{label}</span>{i < 2 ? <span className="h-px flex-1 bg-border" /> : null}</li>; })}</ol>; }

function ProductSheet({ product, catalog, onClose }: { product: Product; catalog: Catalog; onClose: () => void }) {
  const addItem = useCart((s) => s.addItem); const [qty, setQty] = useState(1); const [note, setNote] = useState(""); const [selected, setSelected] = useState<string[]>([]); const [step, setStep] = useState(1); const max = product.customKind === "empanada" ? 3 : 8;
  const pool = catalog.ingredients.filter((ing) => ing.available ? (product.customKind === "empanada" ? ing.empanadaOk : product.customKind === "fajita" && ing.fajitaOk) : false);
  const proteins = pool.filter((ing) => ing.kind === "protein"); const extras = pool.filter((ing) => ing.kind !== "protein");
  const priced = useMemo(() => validateLine(catalog, { productId: product.id, extraIds: product.isCustom ? selected : [], qty: 1, note }), [product, selected, catalog, note]);
  const unit = priced.ok && priced.line ? priced.line.unitPrice : 0; const canAdd = priced.ok;
  function toggle(id: string) { setSelected((curr) => { if (curr.includes(id)) return curr.filter((x) => x !== id); if (curr.length >= max) { toast.message(`Máximo ${max} ingredientes`); return curr; } return [...curr, id]; }); }
  function add() { const result = validateLine(catalog, { productId: product.id, extraIds: product.isCustom ? selected : [], qty, note }); if (!result.ok || !result.line) { toast.message(result.ok ? "No se pudo agregar." : result.error); return; } addItem({ productId: result.line.productId, name: result.line.name, categoryLabel: result.line.categoryLabel, extraIds: result.line.extraIds, extras: result.line.extras, note: result.line.note, qty: result.line.qty, imageUrl: result.line.imageUrl }); toast.success("Agregado al pedido"); onClose(); }
  return <div className="flex min-h-0 flex-1 flex-col"><div className="flex items-start justify-between gap-3 px-5 pt-4"><div><DrawerTitle className="font-display text-2xl font-semibold text-title">{product.name}</DrawerTitle><DrawerDescription className="mt-1 line-clamp-2 text-sm text-muted">{product.description}</DrawerDescription></div><DrawerClose asChild><Button variant="ghost" size="icon-sm" aria-label="Cerrar"><X className="size-5" /></Button></DrawerClose></div>{product.isCustom ? <CustomSteps step={step} /> : null}<div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{product.isCustom ? <div className="animate-fade">{step === 1 ? <IngredientGrid title="Base" hint={product.customKind === "empanada" ? `Hasta ${max} en total. 1 · ${formatClp(catalog.settings.empanada1)} / 2 · ${formatClp(catalog.settings.empanada2)} / 3 · ${formatClp(catalog.settings.empanada3)}` : `Base ${formatClp(catalog.settings.fajitaBase)}. Elige proteína y sigue a extras.`} ingredients={proteins} selected={selected} kind={product.customKind} settings={catalog.settings} onToggle={toggle} /> : null}{step === 2 ? <IngredientGrid title="Extras" hint={product.customKind === "empanada" ? `Quesos y vegetales. Máximo ${max} ingredientes en total.` : "Suma vegetales, quesos y extras. Incluye salsa CRA."} ingredients={extras} selected={selected} kind={product.customKind} settings={catalog.settings} onToggle={toggle} /> : null}{step === 3 ? <div className="space-y-4">{product.imageUrl ? <div className="overflow-hidden rounded-[var(--radius-md)]"><div className="aspect-photo"><Photo src={product.imageUrl} alt={product.name} /></div></div> : null}<div><p className="text-sm font-semibold text-title">Tu receta</p>{selected.length ? <p className="mt-1 text-sm text-fg">{selected.map((id) => catalog.ingredients.find((i) => i.id === id)?.name).filter(Boolean).join(" · ")}</p> : <p className="mt-1 text-sm text-muted">Aún no eliges ingredientes.</p>}</div><div className="flex items-center justify-between"><span className="text-sm text-muted">Cantidad</span><QtyStepper value={qty} onChange={setQty} /></div><div className="flex items-center justify-between"><span className="text-sm text-muted">Precio</span><span className="font-display text-2xl font-semibold tabular-nums text-title">{formatClp(unit * qty)}</span></div><label className="block text-sm font-semibold text-title">Nota para la cocina<TextArea className="mt-2" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Sin cebolla, extra salsa, etc." maxLength={140} /></label></div> : null}</div> : <><>{product.imageUrl ? <div className="mb-4 overflow-hidden rounded-[var(--radius-md)]"><div className="aspect-photo"><Photo src={product.imageUrl} alt={product.name} /></div></div> : null}</><label className="block text-sm font-semibold text-title">Nota para la cocina<TextArea className="mt-2" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Sin cebolla, extra salsa, etc." maxLength={140} /></TextArea></label></> }</div><div className="flex items-center gap-3 border-t border-border bg-surface px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{product.isCustom ? <>{step > 1 ? <Button variant="secondary" size="icon" aria-label="Atrás" onClick={() => setStep((s) => (s === 3 ? 2 : 1))}><ChevronLeft className="size-5" /></Button> : null}{step < 3 ? <Button className="h-12 flex-1 press-add" onClick={() => setStep((s) => (s === 1 ? 2 : 3))}>Siguiente</Button> : <Button className="h-12 flex-1 press-add" onClick={add} disabled={!canAdd}>Agregar · {formatClp(unit * qty)}</Button>}</> : <><QtyStepper value={qty} onChange={setQty} /><Button className="h-12 flex-1 press-add" onClick={add}>Agregar · {formatClp(unit * qty)}</Button></>}</div></div>;
}

function CartDrawer({ open, onOpenChange, catalog }: { open: boolean; onOpenChange: (v: boolean) => void; catalog: Catalog }) {
  const items = useCart((s) => s.items); const setQty = useCart((s) => s.setQty); const remove = useCart((s) => s.remove); const total = cartTotal(items, catalog);
  return <Drawer open={open} onOpenChange={onOpenChange}><DrawerContent className="bg-bg"><div className="flex items-start justify-between px-5 pt-4"><div><DrawerTitle className="font-display text-2xl font-semibold text-title">Tu pedido</DrawerTitle><DrawerDescription className="text-sm text-muted">Revisa y envíalo completo por WhatsApp.</DrawerDescription></div><DrawerClose asChild><Button variant="ghost" size="icon-sm" aria-label="Cerrar"><X className="size-5" /></Button></DrawerClose></div><div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{items.length === 0 ? <p className="py-10 text-center text-sm text-muted">El pedido está vacío. Elige algo rico arriba.</p> : <ul className="space-y-3">{items.map((item) => { const unit = lineUnitPrice(item, catalog); const line = unit * item.qty; return <li key={item.lineId} className="flex gap-3 rounded-[var(--radius-md)] bg-surface p-3 shadow-[var(--shadow-border)]">{item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="size-16 shrink-0 rounded-[var(--radius-sm)] object-cover" /> : <div className="flex size-16 items-center justify-center rounded-[var(--radius-sm)] bg-surface-2"><UtensilsCrossed className="size-8" /></div>}<div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><p className="font-semibold leading-snug text-title">{item.name}</p><span className="text-sm font-semibold tabular-nums text-title">{formatClp(line)}</span></div><p className="text-xs text-muted tabular-nums">{item.qty} × {formatClp(unit)}</p>{item.extras.length ? <p className="mt-0.5 text-xs text-muted">{item.extras.join(" · ")}</p> : null}{item.note ? <p className="text-xs italic text-muted">{item.note}</p> : null}<div className="mt-2 flex items-center justify-between"><div className="inline-flex items-center gap-1 rounded-full bg-surface-2 p-0.5"><button type="button" className="flex size-8 items-center justify-center" aria-label="Quitar uno" onClick={() => setQty(item.lineId, item.qty - 1)}><Minus className="size-3.5" /></button><span className="w-6 text-center text-sm font-semibold tabular-nums">{item.qty}</span><button type="button" className="flex size-8 items-center justify-center" aria-label="Agregar uno" onClick={() => setQty(item.lineId, item.qty + 1)}><Plus className="size-3.5" /></button></div><button type="button" className="text-xs font-semibold text-muted hover:text-fg" onClick={() => remove(item.lineId)}>Sacar</button></div></div></li>; })}</ul>}</div><div className="border-t border-border bg-surface px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]"><div className="mb-3 flex items-center justify-between text-sm"><span className="text-muted">Total</span><span className="font-display text-2xl font-semibold tabular-nums text-title">{formatClp(total)}</span></div><Button className="h-12 w-full press-add" disabled={items.length === 0} asChild={items.length > 0}>{items.length > 0 ? <Link to="/pedido">Continuar por WhatsApp</Link> : <span>Continuar por WhatsApp</span>}</Button></div></DrawerContent></Drawer>;
}

export function MenuPage({ catalog }: { catalog: Catalog }) {
  const items = useCart((s) => s.items); const [active, setActive] = useState("empanadas"); const [picked, setPicked] = useState<Product | null>(null); const [cartOpen, setCartOpen] = useState(false); const [hideUpsell, setHideUpsell] = useState(false); const [badgeKey, setBadgeKey] = useState(0); const prevCount = useRef(0); const count = cartCount(items); const total = cartTotal(items, catalog); const categories = catalog.categories.filter((c) => c.available); const catKey = categories.map((c) => c.id).join(","); const products = catalog.products.filter((p) => catalog.categories.some((c) => c.id === p.categoryId && c.available)); const featured = featuredProducts(products); const featuredIds = new Set(featured.map((p) => p.id));
  useEffect(() => { if (count > prevCount.current) setBadgeKey((n) => n + 1); prevCount.current = count; }, [count]);
  useEffect(() => { const nodes = categories.map((c) => document.getElementById(c.id)).filter((n): n is HTMLElement => !!n); if (!nodes.length) return; const observer = new IntersectionObserver((entries) => { const top = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]?.target.id; if (top) setActive(top); }, { rootMargin: "-28% 0px -58% 0px", threshold: [0.12, 0.28, 0.5] }); nodes.forEach((n) => observer.observe(n); return () => observer.disconnect(); }, [catKey]);
  function go(id: string) { setActive(id); document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }); }
  return <div className="min-h-dvh bg-bg pb-28"><header className="sticky top-0 z-30 border-b border-border/80 bg-bg/95"><div className="mx-auto flex h-14 max-w-menu items-center justify-between px-4"><BrandLockup compact /><button type="button" aria-label="Ver pedido" onClick={() => setCartOpen(true)} className="relative flex size-11 items-center justify-center rounded-full bg-surface text-title shadow-[var(--shadow-border)] press-add"><ShoppingBag className="size-5" />{count > 0 ? <span key={badgeKey} className="badge-pop absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-primary text-xs font-bold tabular-nums text-primary-foreground">{count}</span> : null}</button></div></header><Hero settings={catalog.settings} /><PublicCombos /><nav className="sticky top-14 z-20 border-b border-border/80 bg-bg/95"><div className="mx-auto flex max-w-menu chips-scroll gap-2 overflow-x-auto px-4 py-2.5">{categories.map((cat) => { const on = active === cat.id; return <a key={cat.id} href={`#${cat.id}`} onClick={(e) => { e.preventDefault(); go(cat.id); }} className={cn("inline-flex h-10 shrink-0 items-center rounded-full px-4 text-sm font-medium transition-colors duration-[var(--motion-fade)] ease-[var(--ease-out)]", on ? "bg-title text-surface" : "bg-surface text-fg shadow-[var(--shadow-border)]")}>{cat.name}</a>; })}<span className="w-2 shrink-0" aria-hidden /></div></nav><main className="mx-auto max-w-menu px-4 py-7">{featured.length > 0 ? <section className="mb-10"><SectionHead title="Favoritos CRA" kicker="¿Primera vez? Parte por aquí" /><div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 chips-scroll md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">{featured.map((product) => <div key={product.id} className="w-featured shrink-0 snap-start md:w-auto"><ProductCard product={product} settings={catalog.settings} catalogProducts={products} featured onPick={() => product.available && setPicked(product)} /></div>)}</div></section> : null}{categories.map((cat) => { const list = products.filter((p) => p.categoryId === cat.id); const groups = groupBySub(list); let leadUsed = false; const many = list.length > 1; return <section key={cat.id} id={cat.id} className="mb-12 scroll-mt-menu animate-fade"><SectionHead title={cat.name} kicker={cat.tagline} />{groups.map((group) => <div key={group.label ?? "all"} className="mb-6">{group.label ? <h3 className="mb-3 font-sans text-xs font-semibold uppercase tracking-kicker text-muted">{group.label}</h3> : null}<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">{group.products.map((product) => { const lead = many && !leadUsed; leadUsed = true; return <ProductCard key={product.id} product={product} settings={catalog.settings} catalogProducts={products} lead={lead} featured={featuredIds.has(product.id)} onPick={() => product.available && setPicked(product)} />; })}</div></div>)}</section>; })}</main><footer className="mx-auto max-w-menu px-4 pb-8 text-sm text-muted"><div className="rounded-[var(--radius-xl)] bg-surface px-5 py-7 shadow-[var(--shadow-border)]"><BrandLogo className="mb-3 max-w-52" /><p className="text-center font-display text-2xl font-semibold text-title">{catalog.settings.restaurantName}</p><p className="mt-1 text-center">{catalog.settings.tagline}</p><p className="mt-3 flex items-start justify-center gap-2"><MapPin className="mt-0.5 size-4 shrink-0" />{catalog.settings.coverage || catalog.settings.city}</p>{catalog.settings.hours ? <p className="mt-1 flex items-center justify-center gap-2"><Clock className="size-4 shrink-0" />Horario: {catalog.settings.hours}</p> : null}<p className="mt-1 text-center text-xs">Preparación: {catalog.settings.prepMin}–{catalog.settings.prepMax} min</p>{catalog.settings.deliveryNote ? <p className="mt-2 text-center text-xs">{catalog.settings.deliveryNote}</p> : null}<Link to="/admin" className="mt-5 block text-center text-xs font-medium text-muted underline-offset-4 hover:text-fg hover:underline">Panel de la cocina</Link></div></footer><div className={cn("fixed inset-x-0 bottom-0 z-30 border-t border-border/80 bg-surface/95 px-4 pt-2.5 pb-[max(0.7rem,env(safe-area-inset-bottom))] transition-transform duration-[var(--motion-fast)] ease-[var(--ease-out)]", (picked || cartOpen) && "pointer-events-none translate-y-full")}>{count > 0 && !hideUpsell && !picked && !cartOpen ? <Upsell catalog={catalog} onPick={(p) => setPicked(p)} onDismiss={() => setHideUpsell(true)} /> : null}<button type="button" onClick={() => setCartOpen(true)} className="mx-auto flex h-12 w-full max-w-md items-center justify-between rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-lift)] press-add"><span>Ver pedido</span><span className="tabular-nums">{formatClp(total)}</span><span>WhatsApp</span></button></div><Drawer open={!!picked} onOpenChange={(open) => !open && setPicked(null)}><DrawerContent className="bg-bg">{picked ? <ProductSheet key={picked.id} product={picked} catalog={catalog} onClose={() => setPicked(null)} /> : null}</DrawerContent></Drawer><CartDrawer open={cartOpen} onOpenChange={setCartOpen} catalog={catalog} /></div>;
}
