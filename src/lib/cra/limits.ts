/** Server-enforced bounds. Commercial cart limits stay the same. */
export const LIMITS = {
  qtyMin: 1,
  qtyMax: 20,
  maxLines: 40,
  maxNote: 140,
  maxName: 80,
  maxPhone: 20,
  maxAddress: 160,
  maxObs: 240,
  empanadaMax: 3,
  fajitaMax: 8,
  payloadBytes: 24_000,
  imageBytes: 400_000,
  pinMin: 4,
  pinMax: 32,
  productName: 80,
  productDescription: 800,
  settingsText: 160,
  orderPerMinute: 20,
} as const;

/** Production bootstrap PIN comes from the deployment environment. */
export function getInitialAdminPin(): string {
  const pin = process.env.CRA_ADMIN_PIN?.trim();
  if (!pin) {
    throw new Error(
      "CRA_ADMIN_PIN is required to initialize the CRA admin panel. Configure it in the deployment environment.",
    );
  }
  return pin;
}
