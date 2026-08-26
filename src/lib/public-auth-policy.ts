/**
 * CRA public ordering policy.
 *
 * Customers do not need an account or Grok OAuth to browse the menu or submit
 * an order. Administrative operations must continue to enforce their own
 * server-side authorization checks.
 */
export const PUBLIC_AUTH_ENABLED = false;
export const ADMIN_AUTH_REQUIRED = true;
