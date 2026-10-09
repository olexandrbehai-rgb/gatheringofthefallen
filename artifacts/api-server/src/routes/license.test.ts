/**
 * Integration tests for the GOTF LIVE AI license server against a REAL Postgres.
 * Skipped unless LICENSE_TEST_DATABASE_URL is set, e.g.:
 *   LICENSE_TEST_DATABASE_URL=postgres://gotf:gotf@localhost/gotf_test pnpm --filter @workspace/api-server test
 * WARNING: drops and recreates the licenses / activations / reset_requests tables in that database.
 */
import crypto from "node:crypto";
import express, { type Express } from "express";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const TEST_DB = process.env.LICENSE_TEST_DATABASE_URL;

const mail = vi.hoisted(() => ({ sent: [] as Array<{ to: string; subject: string; text: string }> }));

vi.mock("nodemailer", () => ({
  default: {
    createTransport: () => ({
      sendMail: async (m: { to: string; subject: string; text: string }) => {
        mail.sent.push(m);
        return { messageId: "test" };
      },
    }),
  },
}));

vi.mock("../middleware/ownerAuth", () => ({
  requireOwner: (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.header("x-test-owner") === "yes") return next();
    res.status(403).json({ error: "Owner access required" });
  },
}));

const WEBHOOK_SECRET = "whsec_test_license";

describe.skipIf(!TEST_DB)("GOTF license server (real Postgres)", () => {
  let app: Express;
  let pool: import("pg").Pool;
  let issueLicenseForSession: typeof import("./software").issueLicenseForSession;
  let resetLimiter: () => void;
  let publicKey: string;
  let verify: typeof import("../lib/licenseSigning").verifyLicenseToken;
  let stripeHeader: (payload: string) => string;

  beforeAll(async () => {
    const { privateKey, publicKey: pub } = crypto.generateKeyPairSync("ed25519");
    process.env.DATABASE_URL = TEST_DB;
    process.env.LICENSE_SIGNING_KEY = privateKey.export({ format: "der", type: "pkcs8" }).toString("base64");
    process.env.SMTP_EMAIL = "shop@example.com";
    process.env.SMTP_PASSWORD = "x";
    process.env.STRIPE_SECRET_KEY = "sk_test_dummy";
    process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;
    process.env.PUBLIC_SITE_URL = "https://example.test";
    publicKey = Buffer.from((pub.export({ format: "jwk" }) as { x: string }).x, "base64url").toString("base64");

    const lib = await import("../lib/licenses");
    pool = lib.licensePool;
    await pool.query("DROP TABLE IF EXISTS activations, reset_requests, licenses CASCADE");
    await lib.ensureLicenseSchema();

    const licenseMod = await import("./license");
    const softwareMod = await import("./software");
    const stripeMod = await import("./stripe");
    const signing = await import("../lib/licenseSigning");
    issueLicenseForSession = softwareMod.issueLicenseForSession;
    resetLimiter = licenseMod._resetActivateRateLimit;
    verify = signing.verifyLicenseToken;
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe("sk_test_dummy");
    stripeHeader = (payload) => stripe.webhooks.generateTestHeaderString({ payload, secret: WEBHOOK_SECRET } as Parameters<typeof stripe.webhooks.generateTestHeaderString>[0]);

    app = express();
    app.set("trust proxy", true);
    app.use("/api/webhook/stripe", express.raw({ type: "application/json" }));
    app.use(express.json());
    app.use("/api", stripeMod.default);
    app.use("/api", softwareMod.default);
    app.use("/api", licenseMod.default);
  });

  afterAll(async () => {
    await pool?.end().catch(() => undefined);
  });

  beforeEach(() => {
    mail.sent.length = 0;
    resetLimiter?.();
  });

  async function newLicense(email: string) {
    return issueLicenseForSession({
      id: `cs_test_${crypto.randomBytes(6).toString("hex")}`,
      customer_details: { email } as any,
      customer_email: null,
    });
  }

  const activate = (body: object, ip = "203.0.113.1") =>
    request(app).post("/api/license/activate").set("X-Forwarded-For", ip).send(body);

  it("Stripe webhook (flow=software) creates a license once and e-mails the key", async () => {
    const session = {
      id: "cs_test_webhook_1",
      object: "checkout.session",
      payment_status: "paid",
      metadata: { flow: "software", product: "gotf-live-ai" },
      customer_details: { email: "Buyer@Example.com" },
      customer_email: null,
    };
    const payload = JSON.stringify({ id: "evt_1", object: "event", type: "checkout.session.completed", data: { object: session } });
    for (let i = 0; i < 2; i++) {
      const res = await request(app)
        .post("/api/webhook/stripe")
        .set("stripe-signature", stripeHeader(payload))
        .set("Content-Type", "application/json")
        .send(payload);
      expect(res.status).toBe(200);
    }
    const rows = await pool.query("SELECT * FROM licenses WHERE stripe_session = $1", [session.id]);
    expect(rows.rowCount).toBe(1);
    expect(rows.rows[0].email).toBe("buyer@example.com");
    expect(rows.rows[0].max_devices).toBe(2);
    expect(rows.rows[0].key).toMatch(/^GOTF(-[A-HJ-NP-Z2-9]{4}){4}$/);
    expect(mail.sent).toHaveLength(1); // replay does not re-send
    expect(mail.sent[0].to).toBe("buyer@example.com");
    expect(mail.sent[0].text).toContain(rows.rows[0].key);
  });

  it("activates up to max_devices, refreshes known devices, returns 409 over the limit", async () => {
    const lic = await newLicense("sasha@example.com");
    const base = { email: "SASHA@example.com ", key: lic.key.toLowerCase() };

    const a = await activate({ ...base, device_id: "device-aaaa-1111", device_name: "PC 1" });
    expect(a.status).toBe(200);
    expect(a.body.status).toBe("activated");
    const payload = verify(a.body.token, publicKey)!;
    expect(payload).toMatchObject({ key: lic.key, email: "sasha@example.com", device_id: "device-aaaa-1111" });
    expect(payload.expires - payload.issued).toBe(30 * 24 * 3600);
    // tampering breaks the signature
    const [p, , s] = a.body.token.split(".");
    const forged = Buffer.from(JSON.stringify({ ...payload, device_id: "other" })).toString("base64url");
    expect(verify(`${p}.${forged}.${s}`, publicKey)).toBeNull();

    const again = await activate({ ...base, device_id: "device-aaaa-1111" });
    expect(again.body.status).toBe("refreshed");

    expect((await activate({ ...base, device_id: "device-bbbb-2222" })).status).toBe(200);
    const over = await activate({ ...base, device_id: "device-cccc-3333" });
    expect(over.status).toBe(409);
    expect(over.body.code).toBe("device_limit");
    expect(over.body.reset_url).toBe("https://example.test/gotf-live-ai/reset");

    // wrong e-mail / unknown key -> same 404
    expect((await activate({ email: "x@example.com", key: lic.key, device_id: "device-dddd-4444" })).status).toBe(404);
    expect((await activate({ email: "sasha@example.com", key: "GOTF-AAAA-BBBB-CCCC-DDDD", device_id: "device-dddd-4444" })).status).toBe(404);
    expect((await activate({ email: "sasha@example.com", key: lic.key })).status).toBe(400);
  });

  it("concurrent activations never exceed max_devices", async () => {
    const lic = await newLicense("race@example.com");
    const results = await Promise.all(
      Array.from({ length: 6 }, (_, i) => activate({ email: "race@example.com", key: lic.key, device_id: `race-device-${i}` }, `198.51.100.${i}`)),
    );
    expect(results.filter((r) => r.status === 200)).toHaveLength(2);
    expect(results.filter((r) => r.status === 409)).toHaveLength(4);
  });

  it("deactivate frees a slot", async () => {
    const lic = await newLicense("deact@example.com");
    const base = { email: "deact@example.com", key: lic.key };
    await activate({ ...base, device_id: "deact-pc-0001" });
    await activate({ ...base, device_id: "deact-pc-0002" });
    expect((await activate({ ...base, device_id: "deact-pc-0003" })).status).toBe(409);
    const d = await request(app).post("/api/license/deactivate").send({ ...base, device_id: "deact-pc-0001" });
    expect(d.body).toEqual({ ok: true, deactivated: true });
    const d2 = await request(app).post("/api/license/deactivate").send({ ...base, device_id: "deact-pc-0001" });
    expect(d2.body).toEqual({ ok: true, deactivated: false });
    expect((await request(app).post("/api/license/deactivate").send({ ...base, email: "no@example.com", device_id: "deact-pc-0002" })).status).toBe(404);
    expect((await activate({ ...base, device_id: "deact-pc-0003" })).status).toBe(200);
  });

  it("reset via e-mail link: request -> GET check (non-consuming) -> POST confirm deactivates all", async () => {
    const lic = await newLicense("reset@example.com");
    const base = { email: "reset@example.com", key: lic.key };
    await activate({ ...base, device_id: "reset-pc-0001" });
    await activate({ ...base, device_id: "reset-pc-0002" });
    mail.sent.length = 0;

    const r = await request(app).post("/api/license/reset/request").set("X-Forwarded-For", "192.0.2.10").send({ email: "Reset@Example.com" });
    expect(r.status).toBe(200);
    expect(mail.sent).toHaveLength(1);
    const token = /token=([A-Za-z0-9_-]+)/.exec(mail.sent[0].text)![1];
    const stored = await pool.query("SELECT token_hash, outcome, ip_hash FROM reset_requests WHERE email = 'reset@example.com'");
    expect(stored.rows[0].outcome).toBe("sent");
    expect(stored.rows[0].token_hash).toBe(crypto.createHash("sha256").update(token).digest("hex"));
    expect(stored.rows[0].ip_hash).not.toContain("192.0.2.10");

    const check = await request(app).get(`/api/license/reset/confirm?token=${token}`);
    expect(check.body).toEqual({ valid: true, email: "re***@example.com" });
    const check2 = await request(app).get(`/api/license/reset/confirm?token=${token}`);
    expect(check2.body.valid).toBe(true);

    const c = await request(app).post("/api/license/reset/confirm").send({ token });
    expect(c.status).toBe(200);
    expect(c.body.deactivated).toBe(2);
    expect(c.body.licenses).toEqual([{ key: lic.key, max_devices: 2 }]);
    expect((await request(app).post("/api/license/reset/confirm").send({ token })).status).toBe(410);
    expect((await activate({ ...base, device_id: "reset-pc-0003" })).status).toBe(200);

    // unknown e-mail: same 200 answer, no mail, logged as no_license
    mail.sent.length = 0;
    const unknown = await request(app).post("/api/license/reset/request").set("X-Forwarded-For", "192.0.2.10").send({ email: "nobody@example.com" });
    expect(unknown.status).toBe(200);
    expect(unknown.body.message).toBe(r.body.message);
    expect(mail.sent).toHaveLength(0);
  });

  it("expired reset links are rejected", async () => {
    await newLicense("expired@example.com");
    await request(app).post("/api/license/reset/request").set("X-Forwarded-For", "192.0.2.20").send({ email: "expired@example.com" });
    const token = /token=([A-Za-z0-9_-]+)/.exec(mail.sent.at(-1)!.text)![1];
    await pool.query("UPDATE reset_requests SET expires_at = NOW() - INTERVAL '1 minute' WHERE email = 'expired@example.com'");
    expect((await request(app).get(`/api/license/reset/confirm?token=${token}`)).status).toBe(410);
    expect((await request(app).post("/api/license/reset/confirm").send({ token })).status).toBe(410);
  });

  it("rate limits: 3/day per e-mail, 10/hour per IP, all logged", async () => {
    await newLicense("limit@example.com");
    const statuses = [];
    for (let i = 0; i < 4; i++) {
      statuses.push((await request(app).post("/api/license/reset/request").set("X-Forwarded-For", `192.0.2.${100 + i}`).send({ email: "limit@example.com" })).status);
    }
    expect(statuses).toEqual([200, 200, 200, 429]);

    const ipStatuses = [];
    for (let i = 0; i < 11; i++) {
      ipStatuses.push((await request(app).post("/api/license/reset/request").set("X-Forwarded-For", "192.0.2.200").send({ email: `ip${i}@example.com` })).status);
    }
    expect(ipStatuses.slice(0, 10).every((s) => s === 200)).toBe(true);
    expect(ipStatuses[10]).toBe(429);

    const outcomes = await pool.query("SELECT outcome, COUNT(*)::int AS n FROM reset_requests GROUP BY outcome");
    const byOutcome = Object.fromEntries(outcomes.rows.map((r) => [r.outcome, r.n]));
    expect(byOutcome.rate_limited_email).toBe(1);
    expect(byOutcome.rate_limited_ip).toBe(1);
  });

  it("owner-only license stats", async () => {
    expect((await request(app).get("/api/owner/license-stats")).status).toBe(403);
    const res = await request(app).get("/api/owner/license-stats?days=7").set("x-test-owner", "yes");
    expect(res.status).toBe(200);
    expect(res.body.rangeDays).toBe(7);
    expect(res.body.licenses.total).toBeGreaterThanOrEqual(6);
    expect(res.body.activations.active_devices).toBeGreaterThan(0);
    expect(res.body.resets.daily).toHaveLength(7);
    expect(res.body.resets.daily.at(-1).reset_requests).toBeGreaterThan(0);
    expect(res.body.resets.weekly.length).toBeGreaterThan(0);
    expect(res.body.topRepeatEmails[0]).toMatchObject({ email: "limit@example.com", requests: 4 });
  });

  it("exposes the public key matching the signing key", async () => {
    const res = await request(app).get("/api/license/public-key");
    expect(res.body).toEqual({ algorithm: "Ed25519", publicKey });
  });
});
