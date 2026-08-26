import type { CartItem, PaymentMethod, PublicSettings } from "./types";
import { cartCount, cartTotal } from "./cart-store";
import { formatCLP, formatOrderWhen, formatPhoneCL, toWhatsAppDigits } from "./format";

export type CheckoutInfo = {
  name: string;
  phone: string;
  address: string;
  payment: PaymentMethod;
  notes: string;
};

const PAY: Record<PaymentMethod, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
};

export function buildOrderMessage(
  items: CartItem[],
  info: CheckoutInfo,
  settings: PublicSettings,
): string {
  const when = formatOrderWhen();
  const lines: string[] = [
    `*${settings.restaurantName.toUpperCase()}*`,
    "Pedido desde el menú digital",
    when,
    "",
    "*Cliente*",
    `• Nombre: ${info.name.trim()}`,
    `• Teléfono: ${formatPhoneCL(info.phone)}`,
    `• Dirección: ${info.address.trim()}`,
  ];
  if (settings.city) lines.push(`• Zona: ${settings.city}`);
  lines.push(`• Pago: ${PAY[info.payment]}`);
  if (info.notes.trim()) lines.push(`• Observaciones: ${info.notes.trim()}`);

  if (info.payment === "transferencia") {
    const bits = [
      settings.transferBank,
      settings.transferName,
      settings.transferRut,
      settings.transferAccount,
    ].filter(Boolean);
    if (bits.length) {
      lines.push("", "*Datos para transferir*",  ...bits.map((b) => `• ${b}`));
    }
  }

  const count = cartCount(items);
  lines.push("", `*Pedido (${count} ${count === 1 ? "ítem" : "ítems"})*`);
  items.forEach((item, i) => {
    const title = [item.categoryLabel, item.name].filter(Boolean).join(" · ");
    lines.push(`${i + 1}. ${title}`);
    if (item.extras.length) {
      lines.push(`   Ingredientes: ${item.extras.join(", ")}`);
    }
    if (item.note) lines.push(`   Nota: ${item.note}`);
    lines.push(
      `   ${item.qty} × ${formatCLP(item.unitPrice)} = ${formatCLP(item.unitPrice * item.qty)}`,
    );
  });
  lines.push(
    "",
    `*TOTAL A PAGAR: ${formatCLP(cartTotal(items))}*`,
    "",
    "_Cuando confirmes, la cocina empieza a preparar._",
  );
  return lines.join("\n");
}

export function whatsappUrl(phone: string, message: string): string {
  const digits = toWhatsAppDigits(phone);
  const text = encodeURIComponent(message);
  if (digits.length >= 11) return `https://wa.me/${digits}?text=${text}`;
  return `https://wa.me/?text=${text}`;
}

export function hasKitchenWhatsApp(phone: string): boolean {
  return toWhatsAppDigits(phone).length >= 11;
}
