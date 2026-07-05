import { createHmac, timingSafeEqual } from "crypto";

// Chrome eklentisi için stateless HMAC token: userId.expiry.imza
// INTERNAL_API_SECRET ile imzalanır — DB kaydı gerektirmez.

const SECRET = process.env.INTERNAL_API_SECRET ?? "";

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

export function createExtensionToken(userId: string, days = 90): string {
  const expiry = Date.now() + days * 24 * 60 * 60 * 1000;
  const payload = `${userId}.${expiry}`;
  return `${Buffer.from(payload).toString("base64url")}.${sign(payload)}`;
}

export function verifyExtensionToken(token: string): { userId: string } | null {
  if (!SECRET || !token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  try {
    const payload = Buffer.from(parts[0], "base64url").toString("utf8");
    const expected = sign(payload);
    const got = parts[1];
    if (expected.length !== got.length) return null;
    if (!timingSafeEqual(Buffer.from(expected), Buffer.from(got))) return null;
    const [userId, expiryStr] = payload.split(".");
    if (!userId || !expiryStr) return null;
    if (Date.now() > parseInt(expiryStr, 10)) return null;
    return { userId };
  } catch {
    return null;
  }
}
