import { Router, type Request, type Response } from "express";
import Stripe from "stripe";
import crypto from "node:crypto";
import { logger } from "../lib/logger";
import { presignR2GetUrl } from "../lib/r2Presign";
import {
  DEFAULT_MAX_DEVICES,
  ensureLicenseSchema,
  licensePool as pool,
  newLicenseKey,
  normalizeEmail,
  PRODUCT_ID,
  sendLicenseEmail,
} from "../lib/licenses";

/**
 * GOTF LIVE AI sales (see GOTF-sales-plan.md):
 *  POST /api/software/checkout          -> Stripe Checkout (one-time, metadata.flow = "software")
 *  GET  /api/software/session?session_id -> success page: license key + download link
 *  GET  /api/software/download/:token   -> 302 to a 1-hour signed Cloudflare R2 link
 * The Stripe webhook (stripe.ts) calls issueLicenseForSession() for flow === "software".
 */

const router = Router();
const MAX_DOWNLOADS = 20;

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key);
}

function r2Config() {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } = process.env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) return null;
  return { accountId: R2_ACCOUNT_ID, accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY, bucket: R2_BUCKET };
}

router.post("/software/checkout", async (req: Request, res: Response): Promise<void> => {
  try {
    const priceId = process.env.GOTF_PRICE_ID;
    if (!priceId) {
      res.status(503).json({ error: "Продаж ще не налаштовано" });
      return;
    }
    const baseUrl = req.headers.origin || `https://${req.headers.host}`;
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_creation: "always",
      metadata: { flow: "software", product: PRODUCT_ID },
      success_url: `${baseUrl}/gotf-live-ai?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/gotf-live-ai?payment=cancelled`,
    });
    res.json({ url: session.url });
  } catch (error: any) {
    logger.error({ msg: "software checkout error", error: error?.message });
    res.status(500).json({ error: "Не вдалося створити оплату" });
  }
});

export interface IssuedLicense {
  key: string;
  email: string;
  status: string;
  max_devices: number;
  download_token: string;
  created: boolean;
}

/**
 * Idempotent per Stripe session: the webhook and the success page may both call it.
 * Only the call that actually inserts the row sends the e-mail.
 */
export async function issueLicenseForSession(
  session: Pick<Stripe.Checkout.Session, "id" | "customer_details" | "customer_email">,
): Promise<IssuedLicense> {
  await ensureLicenseSchema();
  const email =
    normalizeEmail(session.customer_details?.email) ?? normalizeEmail(session.customer_email) ?? "";
  if (!email) logger.warn({ msg: "software session has no buyer email", sessionId: session.id });

  const inserted = await pool.query(
    `INSERT INTO licenses (key, email, product, max_devices, stripe_session, download_token)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (stripe_session) DO NOTHING
     RETURNING key, email, status, max_devices, download_token`,
    [newLicenseKey(), email, PRODUCT_ID, DEFAULT_MAX_DEVICES, session.id, crypto.randomBytes(24).toString("base64url")],
  );
  if (inserted.rowCount) {
    const lic = inserted.rows[0];
    logger.info({ msg: "GOTF license issued", sessionId: session.id });
    try {
      const sent = await sendLicenseEmail(lic);
      if (!sent) logger.warn({ msg: "license e-mail skipped (SMTP not configured or no email)", sessionId: session.id });
    } catch (error: any) {
      logger.error({ msg: "license e-mail failed", sessionId: session.id, error: error?.message });
    }
    return { ...lic, created: true };
  }
  const existing = await pool.query(
    `SELECT key, email, status, max_devices, download_token FROM licenses WHERE stripe_session = $1`,
    [session.id],
  );
  return { ...existing.rows[0], created: false };
}

router.get("/software/session", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.query.session_id || "");
    if (!/^cs_[A-Za-z0-9_]+$/.test(id)) {
      res.status(400).json({ error: "bad session" });
      return;
    }
    const session = await getStripe().checkout.sessions.retrieve(id);
    if (session.metadata?.flow !== "software") {
      res.status(404).json({ error: "not a software purchase" });
      return;
    }
    if (session.payment_status !== "paid") {
      res.json({ status: session.payment_status });
      return;
    }
    const lic = await issueLicenseForSession(session);
    res.json({
      status: "paid",
      licenseKey: lic.key,
      email: lic.email,
      maxDevices: lic.max_devices,
      downloadUrl: `/api/software/download/${lic.download_token}`,
    });
  } catch (error: any) {
    logger.error({ msg: "software session verify failed", error: error?.message });
    res.status(500).json({ error: "verify failed" });
  }
});

router.get("/software/download/:token", async (req: Request, res: Response): Promise<void> => {
  try {
    await ensureLicenseSchema();
    const result = await pool.query(
      `UPDATE licenses SET download_count = download_count + 1
       WHERE download_token = $1 AND status = 'active' AND download_count < $2
       RETURNING key`,
      [String(req.params.token), MAX_DOWNLOADS],
    );
    if (!result.rowCount) {
      res.status(404).send("Посилання недійсне або вичерпано. Напишіть нам: gatheringofthefallen@gmail.com");
      return;
    }
    const r2 = r2Config();
    if (!r2) {
      const fallback = process.env.GOTF_DOWNLOAD_URL;
      if (fallback) {
        res.redirect(302, fallback);
        return;
      }
      res.status(503).send("Завантаження тимчасово недоступне");
      return;
    }
    const url = presignR2GetUrl({
      ...r2,
      key: process.env.GOTF_SETUP_OBJECT_KEY || "GOTF-LIVE-AI-Setup.exe",
      expiresIn: 3600,
      responseContentDisposition: 'attachment; filename="GOTF-LIVE-AI-Setup.exe"',
    });
    res.redirect(302, url);
  } catch (error: any) {
    logger.error({ msg: "software download failed", error: error?.message });
    res.status(500).send("Помилка завантаження");
  }
});

export default router;
