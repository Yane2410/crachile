#!/usr/bin/env node
/** Fail the build early when production-critical Vercel variables are missing. */

const isVercel = process.env.VERCEL === "1";
const isProduction = process.env.NODE_ENV === "production";
if (!isVercel && !isProduction) {
  console.log("[preflight] local build — Vercel production checks skipped.");
  process.exit(0);
}

const required = [
  "DATABASE_URL",
  "BETTER_AUTH_SECRET",
  "CRA_ADMIN_PIN",
  "BETTER_AUTH_URL",
];

const missing = required.filter((key) => !process.env[key]?.trim());

// CRA's public ordering flow does not require Grok OAuth. The admin area
// remains protected by its server-side session/PIN checks, so Grok credentials
// are intentionally not required for the production build.

if (missing.length) {
  console.error("[preflight] Deployment configuration is incomplete.");
  console.error(`[preflight] Missing: ${missing.join(", ")}`);
  process.exit(1);
}

if (process.env.CRA_ADMIN_PIN.length < 4 || process.env.CRA_ADMIN_PIN.length > 32) {
  console.error("[preflight] CRA_ADMIN_PIN must be between 4 and 32 characters.");
  process.exit(1);
}

console.log("[preflight] Vercel production environment looks configured.");
