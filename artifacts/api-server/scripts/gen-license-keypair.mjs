#!/usr/bin/env node
// Generates the Ed25519 keypair for GOTF LIVE AI activation tokens.
//   node artifacts/api-server/scripts/gen-license-keypair.mjs
// - LICENSE_SIGNING_KEY (PRIVATE, base64 PKCS#8 DER) -> Render env var only. Never commit it.
// - Public key (raw 32 bytes, base64)              -> embed in the desktop app.
import crypto from "node:crypto";

const { privateKey, publicKey } = crypto.generateKeyPairSync("ed25519");
const privB64 = privateKey.export({ format: "der", type: "pkcs8" }).toString("base64");
const pubRaw = Buffer.from(publicKey.export({ format: "jwk" }).x, "base64url").toString("base64");
const pubPem = publicKey.export({ format: "pem", type: "spki" });

console.log("=== PRIVATE (Render env var, keep secret) ===");
console.log(`LICENSE_SIGNING_KEY=${privB64}`);
console.log("");
console.log("=== PUBLIC (embed in GOTF LIVE AI app) ===");
console.log(`raw base64: ${pubRaw}`);
console.log(pubPem.trim());
console.log("");
console.log("Python (cryptography) verification example:");
console.log(`  from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
  import base64, json
  PUB = Ed25519PublicKey.from_public_bytes(base64.b64decode("${pubRaw}"))
  def verify(token):
      prefix, body, sig = token.split(".")
      assert prefix == "GOTF1"
      pad = lambda s: s + "=" * (-len(s) % 4)
      PUB.verify(base64.urlsafe_b64decode(pad(sig)), body.encode("ascii"))  # raises InvalidSignature
      return json.loads(base64.urlsafe_b64decode(pad(body)))`);
