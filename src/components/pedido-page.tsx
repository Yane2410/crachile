import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Copy, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { BrandLockup } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { FieldLabel, TextArea, TextField } from "@/components/ui/field";
import { cartTotal, lineUnitPrice, toOrderDraft, useCart } from "@/lib/cra/cart-store";
import { cn } from "@/lib/cra/cn";
import { createOrder } from "@/lib/cra/fns";
import { formatClp, normalizeWhatsapp } from "@/lib/cra/sanitize";
import { buildWhatsappMessage, hasWhatsapp, whatsappUrl } from "@/lib/cra/whatsapp";
import { validateOrder } from "@/lib/cra/pricing";
import type { Catalog, CustomerInfo, PaymentMethod } from "@/lib/cra/types";

const PAYMENTS: { id: PaymentMethod; label: string; hint: string }[] = [
  { id: "efectivo", label: "Efectivo", hint: "Pagas al recibir" },
  { id: "transferencia", label: "Transferencia", hint: "Te pasamos los datos" },
];

export function PedidoPage({ catalog }: { catalog: Catalog }) {
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);
  const [info, setInfo] = useState<CustomerInfo>({
    name: "",
    phone: "",
    address: "",
    payment: "efectivo",
    notes: "",
  });
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const draft = toOrderDraft(items, catalog);
  const priced = validateOrder(catalog, draft);
  const total = priced.ok ? priced.total : 0;
  const preview = priced.ok ? buildWhatsappMessage(priced.lines, info, catalog.settings) : "";
  const kitchenPhone = normalizeWhatsapp(catalog.settings.whatsapp);
  const ready =
    info.name.trim().length >= 2 &&
    info.phone.replace(/\D/g, "").length >= 8 &&
    info.address.trim().length >= 6 &&
    priced.ok;

  async function submit(mode: "wa" | "copy") {
    if (!ready) {
      toast.message(priced.ok ? "Completa nombre, teléfono y dirección." : priced.error);
      return;
    }
    setBusy(true);
    try {
      const result = await createOrder({ data: { items: draft, info } });
      if (!result.ok) {
        toast.message(result.error);
        return;
      }
      if (mode === "copy") {
        await navigator.clipboard.writeText(result.message);
        toast.success("Pedido copiado. Pégalo en WhatsApp.");
      } else {
        window.open(whatsappUrl(result.whatsapp, result.message), "_blank", "noopener,noreferrer");
      }
      setDone(true);
    } catch {
      toast.message("No se pudo armar el pedido. Inténtalo de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  if (items.length === 0 && !done) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-4 py-6">
        <BrandLockup />
        <p className="mt-10 text-center text-muted">Aún no hay nada en el pedido.</p>
        <Button asChild className="mt-6">
          <Link to="/">Volver al menú</Link>
        </Button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-4 py-6">
        <BrandLockup />
        <h1 className="mt-10 font-display text-3xl font-semibold">Pedido listo</h1>
        <p className="mt-3 text-muted">
          WhatsApp se abre con el pedido completo: tus datos, cada plato, extras, notas y el total. Revisa y envíalo a la cocina.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Button variant="whatsapp" onClick={() => void submit("wa")}>
            <MessageCircle className="size-4" />
            Abrir de nuevo
          </Button>
          <Button variant="secondary" onClick={() => void submit("copy")}>
            <Copy className="size-4" />
            Copiar mensaje
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              clear();
              setDone(false);
            }}
            asChild
          >
            <Link to="/">Hacer otro pedido</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 py-6 pb-32">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild aria-label="Volver">
          <Link to="/">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <BrandLockup compact />
      </div>
      <h1 className="mt-6 font-display text-3xl font-semibold">Tu pedido</h1>
      <p className="mt-1 text-sm text-muted">
        Completa tus datos. El mensaje llega completo a WhatsApp: platos, extras, dirección, pago y total.
      </p>
      <ul className="mt-6 space-y-2">
        {items.map((item, index) => {
          const unit = lineUnitPrice(item, catalog);
          const validatedLine = priced.ok ? priced.lines[index] : null;
          const comboOriginalUnit = validatedLine?.comboItems?.reduce((sum, comboItem) => sum + comboItem.unitPrice * comboItem.qty, 0) ?? null;
          const originalUnit = comboOriginalUnit != null ? comboOriginalUnit : unit;
          const finalTotal = unit * item.qty;
          const originalTotal = originalUnit * item.qty;
          const savings = Math.max(0, originalTotal - finalTotal);
          const isDiscountedCombo = Boolean(item.comboId && originalTotal > finalTotal);
          return (
            <li key={item.lineId} className="flex items-start gap-3 rounded-[var(--radius-md)] bg-surface p-2.5 shadow-[var(--shadow-border)]">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="size-14 shrink-0 rounded-[var(--radius-sm)] object-cover" />
              ) : null}
              <span className="min-w-0 flex-1">
                <span className="block font-semibold leading-snug">
                  {item.qty} {item.categoryLabel ? `${item.categoryLabel} · ` : ""}
                  {item.name}
                </span>
                {item.comboSelections?.length ? (
                  <span className="mt-1 block text-xs text-muted">
                    {item.comboSelections.map((selection) => catalog.products.find((product) => product.id === selection.productId)?.name ?? "Producto").join(" · ")}
                  </span>
                ) : null}
                {item.extras.length ? <span className="block text-xs text-muted">{item.extras.join(" · ")}</span> : null}
                {item.note ? <span className="block text-xs italic text-muted">{item.note}</span> : null}
                {isDiscountedCombo ? (
                  <span className="mt-1.5 block text-xs font-medium text-heart">
                    Ahorras {formatClp(savings)}
                  </span>
                ) : null}
              </span>
              <span className="shrink-0 text-right">
                {isDiscountedCombo ? (
                  <span className="block text-xs text-muted tabular-nums line-through">{formatClp(originalTotal)}</span>
                ) : null}
                <span className="block text-sm font-semibold tabular-nums">{formatClp(finalTotal)}</span>
                <span className="block text-xs text-muted tabular-nums">
                  {item.qty} × {formatClp(unit)}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 flex justify-between font-display text-2xl font-semibold">
        <span>Total</span>
        <span className="tabular-nums">{formatClp(total)}</span>
      </p>
      {catalog.settings.deliveryNote ? <p className="mt-1 text-xs text-muted">{catalog.settings.deliveryNote}</p> : null}
      <form
        className="mt-8 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void submit("wa");
        }}
      >
        <div className="space-y-1.5">
          <FieldLabel>Nombre</FieldLabel>
          <TextField value={info.name} onChange={(e) => setInfo({ ...info, name: e.target.value })} autoComplete="name" required maxLength={80} />
        </div>
        <div className="space-y-1.5">
          <FieldLabel>Teléfono</FieldLabel>
          <TextField
            value={info.phone}
            onChange={(e) => setInfo({ ...info, phone: e.target.value })}
            inputMode="tel"
            autoComplete="tel"
            placeholder="9 1234 5678"
            required
            maxLength={20}
          />
        </div>
        <div className="space-y-1.5">
          <FieldLabel>Dirección de entrega</FieldLabel>
          <TextField
            value={info.address}
            onChange={(e) => setInfo({ ...info, address: e.target.value })}
            autoComplete="street-address"
            placeholder="Calle, número, villa o referencia"
            required
            maxLength={160}
          />
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Forma de pago</legend>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENTS.map((opt) => (
              <label
                key={opt.id}
                className={cn(
                  "flex min-h-16 cursor-pointer flex-col justify-center rounded-[var(--radius-md)] px-3 py-2",
                  info.payment === opt.id ? "bg-title text-surface" : "bg-surface text-fg shadow-[var(--shadow-border)]",
                )}
              >
                <input
                  type="radio"
                  name="payment"
                  className="sr-only"
                  checked={info.payment === opt.id}
                  onChange={() => setInfo({ ...info, payment: opt.id })}
                />
                <span className="text-sm font-semibold">{opt.label}</span>
                <span className={cn("text-xs", info.payment === opt.id ? "text-surface/80" : "text-muted")}>{opt.hint}</span>
              </label>
            ))}
          </div>
        </fieldset>
        {info.payment === "transferencia" && catalog.settings.transferBank ? (
          <div className="rounded-[var(--radius-md)] bg-surface-2 px-3 py-3 text-sm">
            <p className="font-semibold">Datos para transferir</p>
            <p>{catalog.settings.transferBank}</p>
            <p>{catalog.settings.transferName}</p>
            <p>{catalog.settings.transferRut}</p>
            <p>{catalog.settings.transferAccount}</p>
          </div>
        ) : null}
        <div className="space-y-1.5">
          <FieldLabel>Observaciones</FieldLabel>
          <TextArea
            value={info.notes}
            onChange={(e) => setInfo({ ...info, notes: e.target.value })}
            placeholder="Timbre, depto, sin cilantro…"
            maxLength={240}
          />
        </div>
        <details className="rounded-[var(--radius-md)] bg-surface px-3 py-2 shadow-[var(--shadow-border)]">
          <summary className="cursor-pointer text-sm font-semibold">Ver el mensaje que llega a WhatsApp</summary>
          <pre suppressHydrationWarning className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-muted">
            {preview}
          </pre>
        </details>
        {priced.ok ? null : <p className="text-sm text-heart">{priced.error}</p>}
        {hasWhatsapp(kitchenPhone) ? null : (
          <p className="text-xs text-muted">
            La cocina aún no cargó su número. WhatsApp se abre con el pedido completo listo para enviar.
          </p>
        )}
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-bg/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto flex max-w-lg gap-2">
            <Button type="button" variant="secondary" className="h-12" onClick={() => void submit("copy")} disabled={busy}>
              <Copy className="size-4" />
              Copiar
            </Button>
            <Button type="submit" variant="whatsapp" className="h-12 flex-1" disabled={busy}>
              <MessageCircle className="size-4" />
              Enviar pedido
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
