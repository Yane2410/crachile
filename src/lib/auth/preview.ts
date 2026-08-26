/**
 * Shared LIVE-PREVIEW OAuth configuration (server-only).
 *
 * Secrets are intentionally NOT stored in source control. The preview broker
 * credentials must be supplied by the local/deployment environment.
 */

/** Shared preview client id. Override with GROK_PREVIEW_CLIENT_ID when needed. */
export const PREVIEW_CLIENT_ID = process.env.GROK_PREVIEW_CLIENT_ID?.trim() || "grok_preview";

/** Preview client secret must be supplied through the environment. */
export function getPreviewClientSecret(): string {
  const secret = process.env.GROK_PREVIEW_CLIENT_SECRET?.trim();
  if (!secret) {
    throw new Error(
      "GROK_PREVIEW_CLIENT_SECRET is required when using the live-preview OAuth client.",
    );
  }
  return secret;
}

/** The shared auth broker issuer (OIDC discovery lives under it). */
export const GROK_ISSUER_DEFAULT = "https://auth.grok.me";

/** Hosts whose preview callbacks may be trusted by Better Auth. */
export const PREVIEW_ALLOWED_HOSTS = ["*.grok-sandbox.com"] as const;
