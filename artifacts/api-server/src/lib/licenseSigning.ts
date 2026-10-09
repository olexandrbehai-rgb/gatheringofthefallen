import crypto from "node:crypto";

/**
 * Ed25519 signing for GOTF LIVE AI activation tokens.
 *
 * Token format (ASCII):  GOTF1.<base64url(JSON payload)>.<base64url(signature)>
 * The signature covers the ASCII bytes of the middle part (base64url payload).
 * The desktop app verifies it offline with the PUBLIC key printed by
 * `node artifacts/api-server/scripts/gen-license-keypair.mjs`.
 *
 * LICENSE_SIGNING_KEY (env, base64) accepts either:
 *  - the PKCS#8 DER private key (what the script prints), or
 *  - a raw 32-byte Ed25519 seed.
 */

export const TOKEN_PREFIX = "GOTF1";
export const TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;

// PKCS#8 header for a raw Ed25519 private seed (RFC 8410).
const ED25519_PKCS8_PREFIX = Buffer.from("302e020100300506032b657004220420", "hex");

export interface LicenseTokenPayload {
  v: 1;
  key: string;
  email: string;
  device_id: string;
  issued: number; // unix seconds
  expires: number; // unix seconds
}

let cachedKey: { source: string; key: crypto.KeyObject } | null = null;

export function getSigningKey(): crypto.KeyObject {
  const raw = process.env.LICENSE_SIGNING_KEY?.trim();
  if (!raw) throw new Error("LICENSE_SIGNING_KEY is not set");
  if (cachedKey?.source === raw) return cachedKey.key;
  const bytes = Buffer.from(raw, "base64");
  const der = bytes.length === 32 ? Buffer.concat([ED25519_PKCS8_PREFIX, bytes]) : bytes;
  const key = crypto.createPrivateKey({ key: der, format: "der", type: "pkcs8" });
  if (key.asymmetricKeyType !== "ed25519") {
    throw new Error("LICENSE_SIGNING_KEY must be an Ed25519 private key");
  }
  cachedKey = { source: raw, key };
  return key;
}

/** Raw 32-byte public key, base64 — the format the desktop app embeds. */
export function getPublicKeyRawBase64(): string {
  const pub = crypto.createPublicKey(getSigningKey());
  const jwk = pub.export({ format: "jwk" }) as { x: string };
  return Buffer.from(jwk.x, "base64url").toString("base64");
}

export function signLicenseToken(
  fields: Omit<LicenseTokenPayload, "v" | "issued" | "expires">,
  now = new Date(),
): { token: string; payload: LicenseTokenPayload } {
  const issued = Math.floor(now.getTime() / 1000);
  const payload: LicenseTokenPayload = {
    v: 1,
    key: fields.key,
    email: fields.email,
    device_id: fields.device_id,
    issued,
    expires: issued + TOKEN_TTL_SECONDS,
  };
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = crypto.sign(null, Buffer.from(body, "ascii"), getSigningKey());
  return { token: `${TOKEN_PREFIX}.${body}.${signature.toString("base64url")}`, payload };
}

/** Verification helper (used by tests; mirrors what the desktop app must do). */
export function verifyLicenseToken(token: string, publicKeyRawBase64: string): LicenseTokenPayload | null {
  const [prefix, body, sig] = token.split(".");
  if (prefix !== TOKEN_PREFIX || !body || !sig) return null;
  const pub = crypto.createPublicKey({
    key: { kty: "OKP", crv: "Ed25519", x: Buffer.from(publicKeyRawBase64, "base64").toString("base64url") },
    format: "jwk",
  });
  const ok = crypto.verify(null, Buffer.from(body, "ascii"), pub, Buffer.from(sig, "base64url"));
  if (!ok) return null;
  return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as LicenseTokenPayload;
}
