import crypto from "node:crypto";
import nodemailer from "nodemailer";
import { Pool } from "pg";

/**
 * Shared storage + helpers for GOTF LIVE AI licenses.
 * Licenses are tied to the buyer EMAIL (not hardware). Tables are created
 * lazily with CREATE TABLE IF NOT EXISTS, like the rest of this API.
 */

export const licensePool = new Pool({ connectionString: process.env.DATABASE_URL });

export const DEFAULT_MAX_DEVICES = 2;
export const PRODUCT_ID = "gotf-live-ai";
const DEFAULT_SITE = "https://gathering-of-the-fallen-frankfurt.onrender.com";

export function siteUrl(): string {
  return (process.env.PUBLIC_SITE_URL || DEFAULT_SITE).replace(/\/+$/, "");
}

export function resetPageUrl(): string {
  return `${siteUrl()}/gotf-live-ai/reset`;
}

let schemaReady: Promise<void> | null = null;

export function ensureLicenseSchema(): Promise<void> {
  schemaReady ??= (async () => {
    await licensePool.query(`
      CREATE TABLE IF NOT EXISTS licenses (
        key TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        product TEXT NOT NULL DEFAULT 'gotf-live-ai',
        status TEXT NOT NULL DEFAULT 'active',
        max_devices INT NOT NULL DEFAULT ${DEFAULT_MAX_DEVICES},
        stripe_session TEXT UNIQUE,
        download_token TEXT NOT NULL UNIQUE,
        download_count INT NOT NULL DEFAULT 0,
        created TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`);
    await licensePool.query(`CREATE INDEX IF NOT EXISTS licenses_email_idx ON licenses (lower(email))`);
    await licensePool.query(`
      CREATE TABLE IF NOT EXISTS activations (
        id SERIAL PRIMARY KEY,
        license_key TEXT NOT NULL REFERENCES licenses(key) ON DELETE CASCADE,
        device_id TEXT NOT NULL,
        device_name TEXT,
        activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deactivated_at TIMESTAMPTZ,
        UNIQUE (license_key, device_id)
      )`);
    await licensePool.query(`
      CREATE TABLE IF NOT EXISTS reset_requests (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL,
        created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        ip_hash TEXT,
        outcome TEXT NOT NULL,
        token_hash TEXT UNIQUE,
        expires_at TIMESTAMPTZ,
        used_at TIMESTAMPTZ,
        deactivated_count INT
      )`);
    await licensePool.query(`CREATE INDEX IF NOT EXISTS reset_requests_email_idx ON reset_requests (email, created)`);
    await licensePool.query(`CREATE INDEX IF NOT EXISTS reset_requests_ip_idx ON reset_requests (ip_hash, created)`);
  })().catch((error) => {
    schemaReady = null;
    throw error;
  });
  return schemaReady;
}

export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (email.length < 3 || email.length > 254) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

const KEY_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 32 chars, no 0/O/1/I
export const LICENSE_KEY_RE = /^GOTF(-[A-HJ-NP-Z2-9]{4}){4}$/;

/** GOTF-XXXX-XXXX-XXXX-XXXX (80 bits of entropy, unbiased since 256 % 32 == 0). */
export function newLicenseKey(): string {
  const s = Array.from(crypto.randomBytes(16), (b) => KEY_ALPHABET[b % KEY_ALPHABET.length]).join("");
  return `GOTF-${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}`;
}

export function normalizeLicenseKey(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const key = value.trim().toUpperCase();
  return LICENSE_KEY_RE.test(key) ? key : null;
}

export function sha256Hex(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function hashIp(ip: string): string {
  const salt = process.env.LICENSE_IP_SALT || "gotf-license-ip";
  return crypto.createHmac("sha256", salt).update(ip).digest("hex").slice(0, 32);
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function transport() {
  const user = process.env.SMTP_EMAIL;
  const pass = process.env.SMTP_PASSWORD;
  if (!user || !pass) return null;
  return { user, t: nodemailer.createTransport({ service: "gmail", auth: { user, pass } }) };
}

const WRAP = (inner: string) => `
  <div style="font-family:'Courier New',monospace;background:#0a0a0a;color:#ddd;padding:24px;border:1px solid #0ff;max-width:640px;">
    <h2 style="color:#0ff;text-transform:uppercase;letter-spacing:2px;border-bottom:1px solid #333;padding-bottom:12px;">GOTF LIVE AI</h2>
    ${inner}
    <p style="color:#555;font-size:11px;margin-top:24px;text-align:center;">Gathering Of The Fallen</p>
  </div>`;

export async function sendLicenseEmail(lic: { email: string; key: string; download_token: string; max_devices: number }): Promise<boolean> {
  const mail = transport();
  if (!mail || !lic.email) return false;
  const download = `${siteUrl()}/api/software/download/${lic.download_token}`;
  await mail.t.sendMail({
    from: `"GOTF LIVE AI" <${mail.user}>`,
    to: lic.email,
    subject: "GOTF LIVE AI — ваш ліцензійний ключ і посилання на завантаження",
    text: [
      "Дякуємо за покупку GOTF LIVE AI!",
      "",
      `Ліцензійний ключ: ${lic.key}`,
      `Пошта для активації: ${lic.email}`,
      `Завантажити інсталятор: ${download}`,
      "",
      `Ключ працює на ${lic.max_devices} комп'ютерах одночасно. Перед перевстановленням Windows натисніть у програмі «Налаштування → Деактивувати ключ».`,
      `Якщо забули — скиньте активації тут: ${resetPageUrl()}`,
    ].join("\n"),
    html: WRAP(`
      <p>Дякуємо за покупку!</p>
      <p>Ліцензійний ключ:<br><b style="font-size:18px;color:#fff;letter-spacing:1px;">${escapeHtml(lic.key)}</b></p>
      <p>Пошта для активації: <b>${escapeHtml(lic.email)}</b></p>
      <p><a style="color:#0ff" href="${download}">Завантажити GOTF-LIVE-AI-Setup.exe</a></p>
      <p style="color:#999;font-size:12px;">Ключ працює на ${lic.max_devices} комп'ютерах одночасно. Перед перевстановленням Windows натисніть у програмі «Налаштування → Деактивувати ключ». Якщо забули — <a style="color:#0ff" href="${resetPageUrl()}">скиньте активації на сайті</a>.</p>`),
  });
  return true;
}

export async function sendResetEmail(email: string, token: string): Promise<boolean> {
  const mail = transport();
  if (!mail) return false;
  const link = `${resetPageUrl()}?token=${encodeURIComponent(token)}`;
  await mail.t.sendMail({
    from: `"GOTF LIVE AI" <${mail.user}>`,
    to: email,
    subject: "GOTF LIVE AI — підтвердіть скидання активацій",
    text: [
      "Ви (або хтось від вашого імені) попросили скинути активації GOTF LIVE AI.",
      `Підтвердити: ${link}`,
      "Посилання діє 30 хвилин і спрацьовує один раз. Якщо це були не ви — просто проігноруйте лист.",
    ].join("\n"),
    html: WRAP(`
      <p>Ви попросили скинути активації GOTF LIVE AI на всіх комп'ютерах.</p>
      <p><a style="color:#0ff;font-size:16px" href="${link}">Підтвердити скидання</a></p>
      <p style="color:#999;font-size:12px;">Посилання діє 30 хвилин і спрацьовує один раз. Якщо це були не ви — просто проігноруйте лист.</p>`),
  });
  return true;
}
