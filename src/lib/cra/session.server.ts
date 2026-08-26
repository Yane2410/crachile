import { createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";
import { DEFAULT_PIN, LIMITS } from "./limits";

const COOKIE = "cra_admin";
const MAX_AGE = 60 * 60 * 12;

function scryptAsync(password: string, salt: string) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, 32, { N: 16384, r: 8, p: 1 }, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

export async function hashPin(pin: string, salt = randomBytes(16).toString("hex")) {
  const key = await scryptAsync(pin, salt);
  return `scrypt$${salt}$${key.toString("hex")}`;
}

export async function verifyPin(pin: string, stored: string) {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const salt = parts[1] ?? "";
  const expected = Buffer.from(parts[2] ?? "", "hex");
  if (!salt || expected.length !== 32) return false;
  const actual = await scryptAsync(pin, salt);
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

export async function defaultPinHash() {
  return hashPin(DEFAULT_PIN);
}

export function newSessionSecret() {
  return randomBytes(32).toString("hex");
}

function sign(secret: string, payload: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function issueSession(secret: string) {
  const exp = Date.now() + MAX_AGE * 1000;
  const payload = Buffer.from(JSON.stringify({ v: 1, exp }), "utf8").toString("base64url");
  const token = `${payload}.${sign(secret, payload)}`;
  setCookie(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
}

export function clearSession() {
  deleteCookie(COOKIE, { path: "/" });
}

export function readSession(secret: string): boolean {
  const token = getCookie(COOKIE);
  if (!token) return false;
  const [payload, mac] = token.split(".");
  if (!payload || !mac) return false;
  if (!safeEqual(mac, sign(secret, payload))) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { exp?: number };
    return typeof data.exp === "number" && data.exp > Date.now();
  } catch {
    return false;
  }
}

export function pinLooksValid(pin: unknown): pin is string {
  return typeof pin === "string" && pin.length >= LIMITS.pinMin && pin.length <= LIMITS.pinMax;
}
