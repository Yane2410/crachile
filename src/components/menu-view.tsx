import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ChefHat,
  Clock,
  CupSoda,
  Heart,
  MapPin,
  Minus,
  Plus,
  Sandwich,
  ShoppingBag,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { CraMark, CraWordmark } from "@/components/logo";
import { QtyStepper } from "@/components/qty-stepper";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Textarea } from "@/components/ui/textarea";
import { cartCount, cartTotal, useCart } from "@/lib/cart-store";
import { formatCLP } from "@/lib/format";
import { priceCustomEmpanada, priceCustomFajita } from "@/lib/pricing";
import type {
  Catalog,
  CategoryId,
  Ingredient,
  Product,
  PublicSettings,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const CAT_ICON = {
  empanadas: ChefHat,
  fajitas: Sandwich,
  papas: UtensilsCrossed,
  bebidas: CupSoda,
} as const;

export function MenuView({ catalog }: { catalog: Catalog }) {
  const items = useCart((s) => s.items);
  const [active, setActive] = useState<CategoryId>("empanadas");
  const [picked, setPicked] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const count = cartCount(items);
  const total = cartTotal(items);

  const visibleCats = catalog.categories.filter((c) => c.available);
  const visibleProducts = catalog.products.filter(
    (p) =>
      p.available &&
      catalog.categories.find((c) => c.id === p.categoryId)?.available,
  );

  return (
    <div className="min-h-dvh bg-bg pb-28">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-bg/90 backdrop-blur-md">
        <div className="mx-auto flex h-[4.25rem] max-w-5xl items-center justify-between px-4">
          <CraWordmark />
          <Button
            variant="secondary"
            size="icon"
            aria-label="Ver pedido"
            onClick={() => setCartOpen(true)}
            className="relative"
          >
            <ShoppingBag className="size-5" />
            {count > 0 ? (
              <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground tabular-nums">
                {count}
              </span>
            ) : null}
          </Button>
        </div>
      </header>

      <Hero settings={catalog.settings} />

      <nav className="sticky top-[4.25rem] z-20 border-b border-border/70 bg-bg/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl gap-2 overflow-x-auto px-4 py-3">
          {visibleCats.map((cat) => {
            const Icon = CAT_ICON[cat.id];
            const on = active === cat.id;
            return (
              <a
                key={cat.id}
                href={`#${cat.id}`}
                onClick={() => setActive(cat.id)}
                className={cn(
                  "inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors duration-[var(--motion-quick)] ease-[var(--ease-out)]",
                  on
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface text-fg shadow-[var(--shadow-border)]",
                )}
              >
                <Icon className="size-4" />
                {cat.name}
              </a>
            );
          })}
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {visibleCats.map((cat) => {
          const products = visibleProducts.filter((p) => p.categoryId === cat.id);
          const groups = groupBySub(products);
          return (
            <section key={cat.id} id={cat.id} className="mb-12 scroll-mt-40">
              <div className="mb-5">
                <h2 className="font-display text-3xl font-semibold text-fg">
                  {cat.name}
                </h2>
                <p className="mt-1 text-sm text-muted">{cat.tagline}</p>
              </div>
              {groups.map((group) => (
                <div key={group.label ?? "all"} className="mb-6">
                  {group.label ? (
                    <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-muted">
                      {group.label}
                    </h3>
                  ) : null}
                  <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                    {group.products.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        settings={catalog.settings}
                        onPick={() => setPicked(product)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </section>
          );
        })}
      </main>

      <footer className="mx-auto max-w-5xl px-4 pb-8 text-sm text-muted">
        <div className="rounded-[var(--radius-xl)] bg-surface px-5 py-6 shadow-[var(--shadow-border)]">
          <CraMark className="mx-auto mb-3 h-16 w-auto" />
          <p className="text-center font-display text-xl font-semibold text-fg">
            {catalog.settings.restaurantName}
          </p>
          <p className="mt-1 text-center">{catalog.settings.tagline}</p>
          <p className="mt-3 flex items-start justify-center gap-2">
            <MapPin className="mt-0.5 size-4 shrink-0" />
            {catalog.settings.city}
          </p>
          {catalog.settings.hours ? (
            <p className="mt-1 flex items-center justify-center gap-2">
              <Clock className="size-4 shrink-0" />
              {catalog.settings.hours}
            </p>
          ) : null}
          <Link
            to="/admin"
            className="mt-5 block text-center text-xs font-semibold text-muted underline-offset-4 hover:text-fg hover:underline"
          >
            Panel de la cocina
          </Link>
        </div>
      </footer>

      {count > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-30 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button
            className="mx-auto flex h-14 w-full max-w-md justify-between px-5 text-base shadow-[var(--shadow-lift)]"
            onClick={() => setCartOpen(true)}
          >
            <span className="flex items-center gap-2">
              <ShoppingBag className="size-5" />
              Ver pedido · {count}
            </span>
            <span className="tabular-nums">{formatCLP(total)}</span>
          </Button>
        </div>
      ) : null}

      <CustomizeDrawer
        product={picked}
        catalog={catalog}
        onClose={() => setPicked(null)}
      />
      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
    </div>
  );
}

function Hero({ settings }: { settings: PublicSettings }) {
  return (
    <section className="relative mx-auto max-w-5xl overflow-hidden sm:px-4 sm:pt-4">
      <div className="relative aspect-[16/10] sm:aspect-[21/9] sm:rounded-[var(--radius-xl)]">
        <img
          src="/menu/hero.jpg"
          alt="Fajita, empanadas venezolanas y salsa CRA"
          className="size-full object-cover sm:rounded-[var(--radius-xl)]"
        />
        <div className="absolute inset-0 bg-linear-to-t from-fg/85 via-fg/20 to-fg/5 sm:rounded-[var(--radius-xl)]" />
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary-foreground/80">
            Menú digital · Talca
          </p>
          <h1 className="mt-1 font-display text-4xl font-semibold text-primary-foreground sm:text-5xl">
            {settings.restaurantName}
          </h1>
          <p className="mt-2 max-w-md text-sm text-primary-foreground/90">
            {settings.tagline}. Eliges, personalizas y el pedido llega completo
            por WhatsApp.
          </p>
        </div>
      </div>
    </section>
  );
}

function groupBySub(products: Product[]) {
  const order: string[] = [];
  const map = new Map<string, Product[]>();
  for (const p of products) {
    const key = p.subcategory ?? "";
    if (!map.has(key)) {
      map.set(key, []);
      order.push(key);
    }
    map.get(key)!.push(p);
  }
  return order.map((key) => ({
    label: key || null,
    products: map.get(key)!,
  }));
}

function ProductCard({
  product,
  settings,
  onPick,
}: {
  product: Product;
  settings: PublicSettings;
  onPick: () => void;
}) {
  const priceLabel = product.isCustom
    ? product.customKind === "empanada"
      ? `Desde ${formatCLP(settings.empanada1)}`
      : `Desde ${formatCLP(settings.fajitaBase)}`
    : formatCLP(product.price);

  return (
    <button
      type="button"
      onClick={onPick}
      className="group flex overflow-hidden rounded-[var(--radius-lg)] bg-surface text-left shadow-[var(--shadow-border)] transition-[transform,box-shadow] duration-[var(--motion-fast)] ease-[var(--ease-out)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] sm:flex-col"
    >
      <div className="relative aspect-square w-[7.25rem] shrink-0 overflow-hidden bg-surface-2 sm:aspect-[4/3] sm:w-full">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt=""
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <CraMark className="size-12 opacity-50 sm:size-14" />
          </div>
        )}
        {product.isCustom ? (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-surface/95 px-2 py-0.5 text-[10px] font-bold text-heart sm:left-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-xs">
            <Heart className="size-3 fill-heart sm:size-3.5" />
            A tu gusto
          </span>
        ) : null}
        <span className="absolute bottom-2 right-2 rounded-full bg-surface/95 px-2 py-0.5 text-xs font-bold tabular-nums text-heart shadow-[var(--shadow-border)] sm:bottom-3 sm:right-3 sm:px-2.5 sm:py-1 sm:text-sm">
          {priceLabel}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 p-3 sm:gap-2 sm:p-3.5">
        <h3 className="font-display text-base font-semibold leading-snug text-fg sm:text-lg">
          {product.name}
        </h3>
        <p className="line-clamp-2 text-xs text-muted sm:text-sm">
          {product.description}
        </p>
        <span className="mt-1 inline-flex h-9 w-fit items-center rounded-full bg-primary px-3.5 text-xs font-semibold text-primary-foreground sm:mt-auto sm:h-10 sm:text-sm">
          Agregar
        </span>
      </div>
    </button>
  );
}

function CustomizeDrawer({
  product,
  catalog,
  onClose,
}: {
  product: Product | null;
  catalog: Catalog;
  onClose: () => void;
}) {
  return (
    <Drawer
      open={!!product}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DrawerContent>
        {product ? (
          <CustomizeBody
            key={product.id}
            product={product}
            catalog={catalog}
            onClose={onClose}
          />
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}

function CustomizeBody({
  product,
  catalog,
  onClose,
}: {
  product: Product;
  catalog: Catalog;
  onClose: () => void;
}) {
  const addItem = useCart((s) => s.addItem);
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const max = product.customKind === "empanada" ? 3 : 8;

  const pool = catalog.ingredients.filter((i) => {
    if (!i.available) return false;
    if (product.customKind === "empanada") return i.empanadaOk;
    if (product.customKind === "fajita") return i.fajitaOk;
    return false;
  });

  const unitPrice = useMemo(() => {
    if (product.customKind === "empanada") {
      return priceCustomEmpanada(selected, catalog.ingredients, catalog.settings);
    }
    if (product.customKind === "fajita") {
      return priceCustomFajita(selected, catalog.ingredients, catalog.settings);
    }
    return product.price;
  }, [product, selected, catalog.ingredients, catalog.settings]);

  const canAdd = product.isCustom ? selected.length >= 1 && unitPrice > 0 : true;
  const categoryLabel =
    catalog.categories.find((c) => c.id === product.categoryId)?.name ?? "";

  function toggle(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= max) {
        toast.message(`Máximo ${max} ingredientes`);
        return prev;
      }
      return [...prev, id];
    });
  }

  function add() {
    if (!canAdd) {
      toast.message("Elige al menos un ingrediente");
      return;
    }
    const extras = selected
      .map((id) => catalog.ingredients.find((i) => i.id === id)?.name)
      .filter((n): n is string => !!n);
    addItem({
      productId: product.id,
      name: product.name,
      categoryLabel,
      unitPrice,
      qty,
      extras,
      note: note.trim(),
      imageUrl: product.imageUrl,
    });
    toast.success("Agregado al pedido");
    onClose();
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-start justify-between gap-3 px-5 pt-4">
        <div>
          <DrawerTitle className="font-display text-2xl font-semibold text-fg">
            {product.name}
          </DrawerTitle>
          <DrawerDescription className="mt-1 text-sm text-muted">
            {product.description}
          </DrawerDescription>
        </div>
        <DrawerClose asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Cerrar">
            <X className="size-5" />
          </Button>
        </DrawerClose>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt=""
            className="mb-4 aspect-[16/9] w-full rounded-[var(--radius-md)] object-cover"
          />
        ) : null}

        {product.isCustom ? (
          <IngredientPicker
            ingredients={pool}
            selected={selected}
            max={max}
            kind={product.customKind}
            settings={catalog.settings}
            onToggle={toggle}
          />
        ) : null}

        <label className="mt-4 block text-sm font-semibold text-fg">
          Nota para la cocina
          <Textarea
            className="mt-2"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Sin cebolla, extra salsa, etc."
            maxLength={140}
          />
        </label>
      </div>

      <div className="flex items-center gap-3 border-t border-border bg-surface px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <QtyStepper value={qty} onChange={setQty} />
        <Button className="h-12 flex-1" onClick={add} disabled={!canAdd}>
          Agregar · {formatCLP(unitPrice * qty)}
        </Button>
      </div>
    </div>
  );
}

function IngredientPicker({
  ingredients,
  selected,
  max,
  kind,
  settings,
  onToggle,
}: {
  ingredients: Ingredient[];
  selected: string[];
  max: number;
  kind: Product["customKind"];
  settings: PublicSettings;
  onToggle: (id: string) => void;
}) {
  return (
    <div>
      <div className="mb-3 flex items-end justify-between gap-3">
        <p className="text-sm font-semibold text-fg">
          Ingredientes{" "}
          <span className="font-medium text-muted">
            {selected.length}/{max}
          </span>
        </p>
        {kind === "empanada" ? (
          <p className="text-xs text-muted">
            {formatCLP(settings.empanada1)} / {formatCLP(settings.empanada2)} /{" "}
            {formatCLP(settings.empanada3)} + {formatCLP(settings.empanadaPremium)}{" "}
            mechada o llanero
          </p>
        ) : (
          <p className="text-xs text-muted">
            Base {formatCLP(settings.fajitaBase)} + cada extra
          </p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {ingredients.map((ing) => {
          const on = selected.includes(ing.id);
          return (
            <button
              key={ing.id}
              type="button"
              onClick={() => onToggle(ing.id)}
              className={cn(
                "flex min-h-11 items-center justify-between gap-2 rounded-[var(--radius-md)] px-3 py-2 text-left text-sm font-semibold transition-colors",
                on
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface-2 text-fg",
              )}
            >
              <span>
                {ing.name}
                {ing.premium ? (
                  <span
                    className={cn(
                      "ml-1 text-[10px]",
                      on ? "text-primary-foreground/80" : "text-heart",
                    )}
                  >
                    +{formatCLP(settings.empanadaPremium)}
                  </span>
                ) : null}
              </span>
              {kind === "fajita" ? (
                <span className="text-xs tabular-nums opacity-80">
                  +{formatCLP(ing.fajitaPrice)}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CartDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const items = useCart((s) => s.items);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const total = cartTotal(items);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="flex items-start justify-between px-5 pt-4">
          <div>
            <DrawerTitle className="font-display text-2xl font-semibold">
              Tu pedido
            </DrawerTitle>
            <DrawerDescription className="text-sm text-muted">
              Revisa y continúa para enviarlo completo por WhatsApp.
            </DrawerDescription>
          </div>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Cerrar">
              <X className="size-5" />
            </Button>
          </DrawerClose>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">
              El pedido está vacío. Elige algo rico arriba.
            </p>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => (
                <li
                  key={item.lineId}
                  className="flex gap-3 rounded-[var(--radius-md)] bg-surface p-3 shadow-[var(--shadow-border)]"
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="size-16 shrink-0 rounded-[var(--radius-sm)] object-cover"
                    />
                  ) : (
                    <div className="flex size-16 items-center justify-center rounded-[var(--radius-sm)] bg-surface-2">
                      <CraMark className="size-8" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold leading-snug">{item.name}</p>
                      <span className="text-sm font-bold tabular-nums text-heart">
                        {formatCLP(item.unitPrice * item.qty)}
                      </span>
                    </div>
                    {item.extras.length ? (
                      <p className="mt-0.5 text-xs text-muted">
                        {item.extras.join(" · ")}
                      </p>
                    ) : null}
                    {item.note ? (
                      <p className="text-xs italic text-muted">{item.note}</p>
                    ) : null}
                    <div className="mt-2 flex items-center justify-between">
                      <div className="inline-flex items-center gap-1 rounded-full bg-surface-2 p-0.5">
                        <button
                          type="button"
                          className="flex size-8 items-center justify-center"
                          aria-label="Quitar uno"
                          onClick={() => setQty(item.lineId, item.qty - 1)}
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold tabular-nums">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          className="flex size-8 items-center justify-center"
                          aria-label="Agregar uno"
                          onClick={() => setQty(item.lineId, item.qty + 1)}
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        className="text-xs font-semibold text-muted hover:text-fg"
                        onClick={() => remove(item.lineId)}
                      >
                        Sacar
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-border bg-surface px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="text-muted">Total</span>
            <span className="font-display text-2xl font-semibold tabular-nums">
              {formatCLP(total)}
            </span>
          </div>
          <Button
            className="h-12 w-full"
            disabled={items.length === 0}
            asChild={items.length > 0}
          >
            {items.length > 0 ? (
              <Link to="/pedido">Continuar pedido</Link>
            ) : (
              <span>Continuar pedido</span>
            )}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
