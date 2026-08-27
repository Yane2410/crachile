import { LIMITS } from "./limits";

export function sanitizeLine(value: string, max: number) {
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

export function sanitizeMultiline(value: string, max: number) {
  return value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim().slice(0, max);
}

export function sanitizeImage(value: string) {
  const url = value.trim();
  if (url.startsWith("/menu/") && url.length < 120 && !url.includes("..")) return url;
  if (url.startsWith("data:image/jpeg;base64,") && url.length <= LIMITS.imageBytes) return url;
  if (url.startsWith("data:image/png;base64,") && url.length <= LIMITS.imageBytes) return url;
  throw new Error("La imagen no es válida.");
}
