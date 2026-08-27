import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Gift, Tag, UtensilsCrossed } from "lucide-react";
import { getCombos } from "@/lib/cra/fns";
import { formatClp } from "@/lib/cra/sanitize";
import type { Combo } from "@/lib/cra/types";

function benefitLabel(combo: Combo) {
  if (combo.benefitType === "percent") return `${combo.benefitValue}% de descuento`;
  if (combo.benefitType === "fixed") return `${formatClp(combo.benefitValue)} de descuento`;
  return `Precio combo ${formatClp(combo.benefitValue)}`;
}

function ComboPhoto({ combo }: { combo: Combo }) {
  if (!combo.imageUrl) return <div className="flex size-full items-center justify-center bg-surface-2"><UtensilsCrossed className="size-10 opacity-35" /></div>;
  return <img src={combo.imageUrl} alt={combo.name} loading="lazy" decoding="async" className="size-full object-cover" />;
}

export function PublicCombos() {
  const { data: combos = [] } = useQuery({ queryKey: ["public-combos"], queryFn: () => getCombos() });
  if (!combos.length) return null;
  const carousel = combos.length > 1;
  return (
    <section className="border-b border-border/80 bg-surface-2 px-4 py-7">
      <div className="mx-auto max-w-menu">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div><p className="text-xs font-semibold uppercase tracking-kicker text-heart">Especiales CRA</p><h2 className="mt-1 font-display text-3xl font-semibold text-title">Combos</h2><p className="mt-1 text-sm text-muted">Más por menos, sin complicar tu pedido</p></div>
          <Gift className="size-7 shrink-0 text-heart" />
        </div>
        <div className="relative">
          {carousel && <button type="button" aria-label="Ver combos anteriores" onClick={() => document.getElementById("cra-combos-carousel")?.scrollBy({ left: -360, behavior: "smooth" })} className="absolute left-1 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-surface p-2 shadow-md lg:inline-flex"><ChevronLeft className="size-5" /></button>}
          <div id="cra-combos-carousel" className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {combos.map((combo) => (
              <article key={combo.id} className="w-[min(88vw,360px)] shrink-0 snap-start overflow-hidden rounded-[var(--radius-lg)] bg-surface shadow-[var(--shadow-border)] sm:w-[360px]">
                <div className="aspect-photo overflow-hidden bg-surface-2"><ComboPhoto combo={combo} /></div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3"><h3 className="font-display text-xl font-semibold leading-snug text-title">{combo.name}</h3><span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-heart/10 px-2 py-1 text-xs font-semibold text-heart"><Tag className="size-3" /> {benefitLabel(combo)}</span></div>
                  <p className="mt-2 text-sm text-muted">{combo.description}</p>
                  {combo.rules.length ? <p className="mt-3 text-xs text-muted">{combo.rules.map((rule) => `${rule.quantity} ${rule.categoryId}`).join(" · ")}</p> : null}
                  <p className="mt-3 text-xs font-medium text-muted">Combo disponible en la carta</p>
                </div>
              </article>
            ))}
          </div>
          {carousel && <button type="button" aria-label="Ver más combos" onClick={() => document.getElementById("cra-combos-carousel")?.scrollBy({ left: 360, behavior: "smooth" })} className="absolute right-1 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-surface p-2 shadow-md lg:inline-flex"><ChevronRight className="size-5" /></button>}
        </div>
      </div>
    </section>
  );
}
