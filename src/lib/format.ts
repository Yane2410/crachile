const clp = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

export function formatCLP(amount: number): string {
  return clp.format(Math.round(amount));
}

export function formatPhoneCL(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("56") && digits.length === 11) {
    return `+56 9 ${digits.slice(3, 7)} ${digits.slice(7)}`;
  }
  if (digits.length === 9 && digits.startsWith("9")) {
    return `+56 9 ${digits.slice(1, 5)} ${digits.slice(5)}`;
  }
  return raw.trim();
}

export function toWhatsAppDigits(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.length === 9 && digits.startsWith("9")) digits = `56${digits}`;
  if (digits.length === 8) digits = `569${digits}`;
  return digits;
}

export function formatOrderWhen(date = new Date()): string {
  return new Intl.DateTimeFormat("es-CL", {
    timeZone: "America/Santiago",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}
