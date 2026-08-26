const CONTROL = /[\u0000-\u001F\u007F]/g;
const TAGS = /<\/?[a-z][^>]*>/gi;
const MARKDOWN = /[*`]/g;

export function sanitizeLine(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value
    .replace(CONTROL, "")
    .replace(TAGS, "")
    .replace(MARKDOWN, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

export function sanitizeMultiline(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value
    .replace(CONTROL, "")
    .replace(TAGS, "")
    .replace(MARKDOWN, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, max);
}

export function digitsOnly(value: unknown, max = 20): string {
  if (typeof value !== "string" && typeof value !== "number") return "";
  return String(value).replace(/\D/g, "").slice(0, max);
}

export function normalizeWhatsapp(value: unknown): string {
  let t = digitsOnly(value, 15);
  if (t.length === 9 && t.startsWith("9")) t = `56${t}`;
  if (t.length === 8) t = `569${t}`;
  return t;
}

export function formatPhoneDisplay(value: string): string {
  const t = digitsOnly(value, 15);
  if (t.startsWith("56") && t.length === 11) {
    return `+56 9 ${t.slice(3, 7)} ${t.slice(7)}`;
  }
  if (t.length === 9 && t.startsWith("9")) {
    return `+56 9 ${t.slice(1, 5)} ${t.slice(5)}`;
  }
  return value.trim();
}

export function formatClp(value: number): string {
  if (!Number.isFinite(value)) return "$0";
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

export function formatStamp(date = new Date()): string {
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

export function jsonSize(value: unknown): number {
  try {
    return JSON.stringify(value)?.length ?? 0;
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}
