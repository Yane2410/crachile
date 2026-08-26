import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Copy, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { CraWordmark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cartTotal, useCart } from "@/lib/cart-store";
import { formatCLP } from "@/lib/format";
import type { Catalog, PaymentMethod } from "@/lib/types";
import {
  buildOrderMessage,
  hasKitchenWhatsApp,
  type CheckoutInfo,
  whatsappUrl,
} from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

const PAYMENTS: Array<{ id: PaymentMethod; label: string; hint: string }> = [
  { id: "efectivo", label: "Efectivo", hint: "Pagas al recibir" },
  { id: "transferencia", label: "Transferencia", hint: "Te pasamos los datos" },
];

export function CheckoutView({ catalog }: { catalog: Catalog }) {
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);
  const [info, setInfo] = useState<CheckoutInfo>({
    name: "",
    phone: "",
    address: "",
    payment: "efectivo",
    notes: "",
  });
  const [sent, setSent] = useState(false);

  const total = cartTotal(items);
  const message = buildOrderMessage(items, info, catalog.settings);
  const kitchenWa = hasKitchenWhatsApp(catalog.settings.whatsapp);
  const wa = whatsappUrl(catalog.settings.whatsapp, message);
  const valid =
    info.name.trim().length >= 2 &&
    info.phone.replace(/\D/g, "").length >= 8 &&
    info.address.trim().length >= 6 &&
    items.length > 0;

  async function copyOrder() {
    if (!valid) {
      toast.message("Completa nombre, teléfono y dirección.");
      return;
    }
    await navigator.clipboard.writeText(message);
    toast.success("Pedido copiado. Pégalo en WhatsApp.");
    setSent(true);
  }

  function sendWhatsApp() {
    if (!valid) {
      toast.message("Completa nombre, teléfono y dirección.");
      return;
    }
    window.open(wa, "_blank", "noopener,noreferrer");
    setSent(true);
  }

  if (items.length === 0 && !sent) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-4 py-6">
        <CraWordmark />
        <p className="mt-10 text-center text-muted">
          Aún no hay nada en el pedido.
        </p>
        <Button asChild className="mt-6">
          <Link to="/">Volver al menú</Link>
        </Button>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-4 py-6">
        <CraWordmark />
        <h1 className="mt-10 font-display text-3xl font-semibold">
          Pedido listo
        </h1>
        <p className="mt-3 text-muted">
          WhatsApp se abre con el pedido completo: tus datos, cada plato,
          extras, notas y el total. Revisa y envíalo a la cocina.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Button variant="whatsapp" onClick={() => window.open(wa, "_blank")}>
            <MessageCircle className="size-4" />
            Abrir de nuevo
          </Button>
          <Button variant="secondary" onClick={() => void copyOrder()}>
            <Copy className="size-4" />
            Copiar mensaje
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              clear();
              setSent(false);
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
        <CraWordmark compact />
      </div>

      <h1 className="mt-6 font-display text-3xl font-semibold">Tu pedido</h1>
      <p className="mt-1 text-sm text-muted">
        Completa tus datos. El mensaje llega completo a WhatsApp: platos,
        extras, dirección, pago y total.
      </p>

      <ul className="mt-6 space-y-2">
        {items.map((item) => (
          <li
            key={item.lineId}
            className="flex items-start gap-3 rounded-[var(--radius-md)] bg-surface p-2.5 shadow-[var(--shadow-border)]"
          >
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt=""
                className="size-14 shrink-0 rounded-[var(--radius-sm)] object-cover"
              />
            ) : null}
            <span className="min-w-0 flex-1">
              <span className="block font-semibold leading-snug">
                {item.qty}× {item.categoryLabel ? `${item.categoryLabel} · ` : ""}
                {item.name}
              </span>
              {item.extras.length ? (
                <span className="block text-xs text-muted">
                  {item.extras.join(" · ")}
                </span>
              ) : null}
              {item.note ? (
                <span className="block text-xs italic text-muted">{item.note}</span>
              ) : null}
            </span>
            <span className="shrink-0 text-sm font-semibold tabular-nums">
              {formatCLP(item.unitPrice * item.qty)}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-4 flex justify-between font-display text-2xl font-semibold">
        <span>Total</span>
        <span className="tabular-nums">{formatCLP(total)}</span>
      </p>

      <form
        className="mt-8 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          sendWhatsApp();
        }}
      >
        <Field label="Nombre">
          <Input
            value={info.name}
            onChange={(e) => setInfo({ ...info, name: e.target.value })}
            autoComplete="name"
            required
          />
        </Field>
        <Field label="Teléfono">
          <Input
            value={info.phone}
            onChange={(e) => setInfo({ ...info, phone: e.target.value })}
            inputMode="tel"
            autoComplete="tel"
            placeholder="9 1234 5678"
            required
          />
        </Field>
        <Field label="Dirección de entrega">
          <Input
            value={info.address}
            onChange={(e) => setInfo({ ...info, address: e.target.value })}
            autoComplete="street-address"
            placeholder="Calle, número, villa o referencia"
            required
          />
        </Field>
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Forma de pago</legend>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENTS.map((p) => (
              <label
                key={p.id}
                className={cn(
                  "flex min-h-16 cursor-pointer flex-col justify-center rounded-[var(--radius-md)] px-3 py-2",
                  info.payment === p.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface text-fg shadow-[var(--shadow-border)]",
                )}
              >
                <input
                  type="radio"
                  name="payment"
                  className="sr-only"
                  checked={info.payment === p.id}
                  onChange={() => setInfo({ ...info, payment: p.id })}
                />
                <span className="text-sm font-semibold">{p.label}</span>
                <span
                  className={cn(
                    "text-xs",
                    info.payment === p.id
                      ? "text-primary-foreground/80"
                      : "text-muted",
                  )}
                >
                  {p.hint}
                </span>
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
        <Field label="Observaciones">
          <Textarea
            value={info.notes}
            onChange={(e) => setInfo({ ...info, notes: e.target.value })}
            placeholder="Timbre, depto, sin cilantro…"
          />
        </Field>

        <details className="rounded-[var(--radius-md)] bg-surface px-3 py-2 shadow-[var(--shadow-border)]">
          <summary className="cursor-pointer text-sm font-semibold">
            Ver el mensaje que llega a WhatsApp
          </summary>
          <pre
            suppressHydrationWarning
            className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-muted"
          >
            {message}
          </pre>
        </details>

        {!kitchenWa ? (
          <p className="text-xs text-muted">
            La cocina aún no cargó su número. WhatsApp se abre con el pedido
            completo listo para enviar.
          </p>
        ) : null}

        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-bg/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
          <div className="mx-auto flex max-w-lg gap-2">
            <Button
              type="button"
              variant="secondary"
              className="h-12"
              onClick={() => void copyOrder()}
            >
              <Copy className="size-4" />
              Copiar
            </Button>
            <Button type="submit" variant="whatsapp" className="h-12 flex-1">
              <MessageCircle className="size-4" />
              Enviar pedido
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
