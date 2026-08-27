#!/usr/bin/env node
/** Fail the build early when production-critical Vercel variables are missing. */

const isVercel = process.env.VERCEL === "1";
const isProduction = process.env.NODE_ENV === "production";
if (!isVercel && !isProduction) {
  console.log("[preflight] local build — Vercel production checks skipped.");
  process.exit(0);
}

const required = ["DATABASE_URL", "CRA_ADMIN_PIN"];
const missing = required.filter((key) => !process.env[key]?.trim());

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
