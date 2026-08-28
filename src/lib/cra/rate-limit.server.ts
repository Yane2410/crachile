import { getRequestIP } from "@tanstack/react-start/server";

type Bucket = { times: number[] };

const store: Map<string, Bucket> =
  (globalThis as typeof globalThis & { __craRate__?: Map<string, Bucket> }).__craRate__ ??
  ((globalThis as typeof globalThis & { __craRate__?: Map<string, Bucket> }).__craRate__ = new Map());

function clientKey() {
  try {
    return getRequestIP({ xForwardedFor: true }) || "anon";
  } catch {
    return "anon";
  }
}

function memoryRateLimit(name: string, max: number, windowMs: number): boolean {
  const key = `${name}:${clientKey()}`;
  const now = Date.now();
  const bucket = store.get(key) ?? { times: [] };
  bucket.times = bucket.times.filter((stamp: number) => now - stamp < windowMs);
  if (bucket.times.length >= max) {
    store.set(key, bucket);
    return false;
  }
  bucket.times.push(now);
  store.set(key, bucket);
  return true;
}

/**
 * Per-IP sliding window. Prefers the shared Postgres table so Vercel instances
 * cannot be bypassed by spraying requests across isolates. Falls back to
 * in-process memory if the database is briefly unavailable.
 */
export async function rateLimit(name: string, max: number, windowMs: number): Promise<boolean> {
  const ip = clientKey().replace(/[^a-zA-Z0-9:._-]/g, "").slice(0, 64) || "anon";
  const bucket = `${name}:${ip}`.slice(0, 120);
  try {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const cutoff = new Date(Date.now() - windowMs).toISOString();
    const pruneBefore = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    await sql`delete from cra_rate_events where created_at < ${pruneBefore}::timestamptz`;
    await sql`insert into cra_rate_events (bucket) values (${bucket})`;
    const rows = await sql<{ n: number }>`
      select count(*)::int as n
      from cra_rate_events
      where bucket = ${bucket} and created_at > ${cutoff}::timestamptz
    `;
    return (rows[0]?.n ?? 0) <= max;
  } catch (error) {
    console.error("[cra] rate-limit db fallback", error instanceof Error ? error.message : "error");
    return memoryRateLimit(name, max, windowMs);
  }
}
