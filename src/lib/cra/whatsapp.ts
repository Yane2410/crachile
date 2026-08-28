import { formatClp, formatPhoneDisplay, formatStamp, normalizeWhatsapp, sanitizeLine } from "./sanitize.ts";
import type { Catalog, CustomerInfo, ValidatedLine } from "./types.ts";

const PAYMENT: Record<CustomerInfo["payment"], string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
};

export function buildWhatsappMessage(lines: ValidatedLine[], info: CustomerInfo, settings: Catalog["settings"]) {
  const name = sanitizeLine(info.name, 80);
  const address = sanitizeLine(info.address, 160);
  const notes = sanitizeLine(info.notes, 240);
  const zone = sanitizeLine(settings.coverage || settings.city, 120);
  const parts = [
    `*${sanitizeLine(settings.restaurantName, 80).toUpperCase()}*`,
    "Pedido desde el menú digital",
    formatStamp(),
    "",
    "*Cliente*",
    `Nombre: ${name}`,
    `Teléfono: ${formatPhoneDisplay(info.phone)}`,
    `Dirección: ${address}`,
  ];
  if (zone) parts.push(`Zona: ${zone}`);
  parts.push(`Pago: ${PAYMENT[info.payment] ?? "Efectivo"}`);
  if (notes) parts.push(`Observaciones: ${notes}`);
  if (info.payment === "transferencia") {
    const transfer = [settings.transferBank, settings.transferName, settings.transferRut, settings.transferAccount]
      .map((v) => sanitizeLine(v, 80))
      .filter(Boolean);
    if (transfer.length) {
      parts.push("", "*Datos para transferir*", ...transfer.map((v) => ` ${v}`));
    }
  }
  const count = lines.reduce((sum, line) => sum + line.qty, 0);
  parts.push("", `*Pedido (${count} ${count === 1 ? "ítem" : "ítems"})*`);
  let total = 0;
  lines.forEach((line, index) => {
    const title = [line.categoryLabel, line.name].filter(Boolean).join(" · ");
    const lineTotal = line.lineTotal;
    total += lineTotal;
    parts.push(`${index + 1}. ${sanitizeLine(title, 120)}`);
    if (line.comboItems?.length) {
      parts.push(...line.comboItems.map((item) => {
        const itemTitle = [item.categoryLabel, item.name].filter(Boolean).join(" · ");
        const itemExtras = item.extras.length ? ` · ${item.extras.map((e) => sanitizeLine(e, 40)).join(", ")}` : "";
        return `   • ${sanitizeLine(itemTitle, 120)}${itemExtras}`;
      }));
      if (line.comboDiscount && line.comboDiscount > 0) {
        parts.push(`   Descuento combo: −${formatClp(line.comboDiscount)}`);
      }
    } else if (line.extras.length) {
      parts.push(`   Ingredientes: ${line.extras.map((e) => sanitizeLine(e, 40)).join(", ")}`);
    }
    if (line.note) parts.push(`   Nota: ${sanitizeLine(line.note, 140)}`);
    parts.push(`   ${line.qty} × ${formatClp(line.unitPrice)} = ${formatClp(lineTotal)}`);
  });
  if (settings.deliveryNote) {
    parts.push("", `Delivery: ${sanitizeLine(settings.deliveryNote, 160)}`);
  }
  parts.push("", `*TOTAL A PAGAR: ${formatClp(total)}*`, "", "_Cuando confirmes, la cocina empieza a preparar._");
  return parts.join("\n");
}

export function whatsappUrl(phone: string, message: string) {
  const n = normalizeWhatsapp(phone);
  const text = encodeURIComponent(message);
  return n.length >= 11 ? `https://wa.me/${n}?text=${text}` : `https://wa.me/?text=${text}`;
}

export function hasWhatsapp(phone: string) {
  return normalizeWhatsapp(phone).length >= 11;
}
