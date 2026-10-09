import { Router, type Request, type Response } from "express";
import crypto from "node:crypto";
import { requireOwner } from "../middleware/ownerAuth";
import { logger } from "../lib/logger";
import {
  ensureLicenseSchema,
  hashIp,
  licensePool as pool,
  normalizeEmail,
  normalizeLicenseKey,
  resetPageUrl,
  sendResetEmail,
  sha256Hex,
} from "../lib/licenses";
import { getPublicKeyRawBase64, signLicenseToken } from "../lib/licenseSigning";

/**
 * GOTF LIVE AI license server. Licenses are tied to the buyer e-mail, not hardware.
 *
 *  POST /api/license/activate        {email, key, device_id, device_name?} -> signed token
 *  POST /api/license/deactivate      {email, key, device_id}
 *  POST /api/license/reset/request   {email}  -> e-mails a one-time link (30 min)
 *  GET  /api/license/reset/confirm?token=     -> checks the link (does NOT consume it)
 *  POST /api/license/reset/confirm   {token}  -> deactivates all devices of that e-mail
 *  GET  /api/license/public-key               -> Ed25519 public key (raw, base64)
 *  GET  /api/owner/license-stats              -> owner-only statistics
 */

const router = Router();

export const RESET_TOKEN_TTL_MINUTES = 30;
export const RESET_LIMIT_PER_EMAIL_PER_DAY = 3;
export const RESET_LIMIT_PER_IP_PER_HOUR = 10;
const ACTIVATE_LIMIT_PER_IP = 60;
const ACTIVATE_WINDOW_MS = 10 * 60_000;

const GENERIC_NOT_FOUND = "Ключ або пошту не знайдено. Перевірте, що вводите пошту, з якої купували.";

function clientIp(req: Request): string {
  return (req.ip || req.socket.remoteAddress || "unknown").replace(/^::ffff:/, "");
}

const activateHits = new Map<string, { start: number; count: number }>();
function allowActivate(ip: string, now = Date.now()): boolean {
  const cur = activateHits.get(ip);
  if (!cur || now - cur.start >= ACTIVATE_WINDOW_MS) {
    activateHits.set(ip, { start: now, count: 1 });
    if (activateHits.size > 10_000) {
      for (const [k, v] of activateHits) if (now - v.start >= ACTIVATE_WINDOW_MS) activateHits.delete(k);
    }
    return true;
  }
  cur.count += 1;
  return cur.count <= ACTIVATE_LIMIT_PER_IP;
}

/** Test hook. */
export function _resetActivateRateLimit() {
  activateHits.clear();
}

function deviceId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const id = value.trim();
  return id.length >= 8 && id.length <= 128 && /^[\x21-\x7e]+$/.test(id) ? id : null;
}

function deviceName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const name = value.trim().slice(0, 100);
  return name || null;
}

// ---------------------------------------------------------------- activate
router.post("/license/activate", async (req: Request, res: Response): Promise<void> => {
  if (!allowActivate(clientIp(req))) {
    res.status(429).json({ error: "Забагато спроб. Спробуйте за кілька хвилин.", code: "rate_limited" });
    return;
  }
  const email = normalizeEmail(req.body?.email);
  const key = normalizeLicenseKey(req.body?.key);
  const device = deviceId(req.body?.device_id);
  if (!email || !key || !device) {
    res.status(400).json({ error: "Потрібні email, key і device_id", code: "bad_request" });
    return;
  }
  const name = deviceName(req.body?.device_name);

  let client;
  try {
    await ensureLicenseSchema();
    client = await pool.connect();
    await client.query("BEGIN");
    // Row lock serialises concurrent activations of the same key (device limit race).
    const lic = await client.query(
      `SELECT key, email, status, max_devices FROM licenses WHERE key = $1 FOR UPDATE`,
      [key],
    );
    const license = lic.rows[0];
    if (!license || license.email.toLowerCase() !== email) {
      await client.query("ROLLBACK");
      res.status(404).json({ error: GENERIC_NOT_FOUND, code: "not_found" });
      return;
    }
    if (license.status !== "active") {
      await client.query("ROLLBACK");
      res.status(403).json({ error: "Цю ліцензію відкликано. Напишіть нам: gatheringofthefallen@gmail.com", code: "revoked" });
      return;
    }

    const existing = await client.query(
      `SELECT id, deactivated_at FROM activations WHERE license_key = $1 AND device_id = $2`,
      [key, device],
    );
    let outcome: "refreshed" | "activated";
    if (existing.rows[0] && !existing.rows[0].deactivated_at) {
      await client.query(
        `UPDATE activations SET last_seen = NOW(), device_name = COALESCE($2, device_name) WHERE id = $1`,
        [existing.rows[0].id, name],
      );
      outcome = "refreshed";
    } else {
      const active = await client.query(
        `SELECT COUNT(*)::int AS n FROM activations WHERE license_key = $1 AND deactivated_at IS NULL`,
        [key],
      );
      if (active.rows[0].n >= license.max_devices) {
        await client.query("ROLLBACK");
        res.status(409).json({
          error: `Ключ уже активовано на ${license.max_devices} комп'ютерах. Деактивуйте його на старому комп'ютері (Налаштування → Деактивувати ключ) або скиньте всі активації тут: ${resetPageUrl()}`,
          code: "device_limit",
          max_devices: license.max_devices,
          reset_url: resetPageUrl(),
        });
        return;
      }
      await client.query(
        `INSERT INTO activations (license_key, device_id, device_name)
         VALUES ($1, $2, $3)
         ON CONFLICT (license_key, device_id) DO UPDATE
         SET deactivated_at = NULL, activated_at = NOW(), last_seen = NOW(),
             device_name = COALESCE(EXCLUDED.device_name, activations.device_name)`,
        [key, device, name],
      );
      outcome = "activated";
    }
    const { token, payload } = signLicenseToken({ key, email, device_id: device });
    await client.query("COMMIT");
    res.json({ ok: true, status: outcome, token, payload, max_devices: license.max_devices });
  } catch (error: any) {
    await client?.query("ROLLBACK").catch(() => undefined);
    logger.error({ msg: "license activate failed", error: error?.message });
    res.status(500).json({ error: "Сервер ліцензій тимчасово недоступний", code: "server_error" });
  } finally {
    client?.release();
  }
});

// ---------------------------------------------------------------- deactivate
router.post("/license/deactivate", async (req: Request, res: Response): Promise<void> => {
  if (!allowActivate(clientIp(req))) {
    res.status(429).json({ error: "Забагато спроб. Спробуйте за кілька хвилин.", code: "rate_limited" });
    return;
  }
  const email = normalizeEmail(req.body?.email);
  const key = normalizeLicenseKey(req.body?.key);
  const device = deviceId(req.body?.device_id);
  if (!email || !key || !device) {
    res.status(400).json({ error: "Потрібні email, key і device_id", code: "bad_request" });
    return;
  }
  try {
    await ensureLicenseSchema();
    const lic = await pool.query(`SELECT email FROM licenses WHERE key = $1`, [key]);
    if (!lic.rows[0] || lic.rows[0].email.toLowerCase() !== email) {
      res.status(404).json({ error: GENERIC_NOT_FOUND, code: "not_found" });
      return;
    }
    const result = await pool.query(
      `UPDATE activations SET deactivated_at = NOW()
       WHERE license_key = $1 AND device_id = $2 AND deactivated_at IS NULL`,
      [key, device],
    );
    res.json({ ok: true, deactivated: (result.rowCount ?? 0) > 0 });
  } catch (error: any) {
    logger.error({ msg: "license deactivate failed", error: error?.message });
    res.status(500).json({ error: "Сервер ліцензій тимчасово недоступний", code: "server_error" });
  }
});

// ---------------------------------------------------------------- reset via site form
router.post("/license/reset/request", async (req: Request, res: Response): Promise<void> => {
  const email = normalizeEmail(req.body?.email);
  if (!email) {
    res.status(400).json({ error: "Введіть коректну пошту" });
    return;
  }
  const ipHash = hashIp(clientIp(req));
  const log = (outcome: string, extra?: { tokenHash: string }) =>
    pool.query(
      `INSERT INTO reset_requests (email, ip_hash, outcome, token_hash, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        email,
        ipHash,
        outcome,
        extra?.tokenHash ?? null,
        extra ? new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60_000) : null,
      ],
    );
  try {
    await ensureLicenseSchema();
    const limits = await pool.query(
      `SELECT
         (SELECT COUNT(*)::int FROM reset_requests WHERE email = $1 AND created > NOW() - INTERVAL '1 day') AS per_email,
         (SELECT COUNT(*)::int FROM reset_requests WHERE ip_hash = $2 AND created > NOW() - INTERVAL '1 hour') AS per_ip`,
      [email, ipHash],
    );
    const { per_email, per_ip } = limits.rows[0];
    if (per_ip >= RESET_LIMIT_PER_IP_PER_HOUR) {
      await log("rate_limited_ip");
      res.status(429).json({ error: "Забагато запитів з цієї мережі. Спробуйте за годину." });
      return;
    }
    if (per_email >= RESET_LIMIT_PER_EMAIL_PER_DAY) {
      await log("rate_limited_email");
      res.status(429).json({ error: "Для цієї пошти вже було 3 запити за добу. Спробуйте завтра або напишіть нам." });
      return;
    }

    const lic = await pool.query(`SELECT 1 FROM licenses WHERE lower(email) = $1 LIMIT 1`, [email]);
    if (!lic.rowCount) {
      await log("no_license");
    } else {
      const token = crypto.randomBytes(32).toString("base64url");
      await log("sent", { tokenHash: sha256Hex(token) });
      try {
        const sent = await sendResetEmail(email, token);
        if (!sent) throw new Error("SMTP not configured");
      } catch (error: any) {
        logger.error({ msg: "reset e-mail failed", error: error?.message });
        await pool.query(`UPDATE reset_requests SET outcome = 'email_failed' WHERE token_hash = $1`, [sha256Hex(token)]);
        res.status(502).json({ error: "Не вдалося надіслати лист. Спробуйте пізніше." });
        return;
      }
    }
    // Same answer whether or not the e-mail has a license (no account enumeration).
    res.json({
      ok: true,
      message: "Якщо на цю пошту є ліцензія, ми надіслали лист із посиланням. Воно діє 30 хвилин.",
    });
  } catch (error: any) {
    logger.error({ msg: "reset request failed", error: error?.message });
    res.status(500).json({ error: "Сервер тимчасово недоступний" });
  }
});

function readToken(value: unknown): string | null {
  return typeof value === "string" && /^[A-Za-z0-9_-]{20,100}$/.test(value) ? value : null;
}

function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  return `${user.slice(0, 2)}${"*".repeat(Math.max(1, user.length - 2))}@${domain}`;
}

// GET only validates (mail scanners prefetch links; they must not trigger a reset).
router.get("/license/reset/confirm", async (req: Request, res: Response): Promise<void> => {
  const token = readToken(req.query.token);
  if (!token) {
    res.status(400).json({ valid: false, error: "Неправильне посилання" });
    return;
  }
  try {
    await ensureLicenseSchema();
    const row = await pool.query(
      `SELECT email FROM reset_requests
       WHERE token_hash = $1 AND outcome = 'sent' AND used_at IS NULL AND expires_at > NOW()`,
      [sha256Hex(token)],
    );
    if (!row.rows[0]) {
      res.status(410).json({ valid: false, error: "Посилання застаріло або вже використане. Надішліть новий запит." });
      return;
    }
    res.json({ valid: true, email: maskEmail(row.rows[0].email) });
  } catch (error: any) {
    logger.error({ msg: "reset confirm check failed", error: error?.message });
    res.status(500).json({ valid: false, error: "Сервер тимчасово недоступний" });
  }
});

router.post("/license/reset/confirm", async (req: Request, res: Response): Promise<void> => {
  const token = readToken(req.body?.token);
  if (!token) {
    res.status(400).json({ error: "Неправильне посилання" });
    return;
  }
  let client;
  try {
    await ensureLicenseSchema();
    client = await pool.connect();
    await client.query("BEGIN");
    const claimed = await client.query(
      `UPDATE reset_requests SET used_at = NOW(), outcome = 'confirmed'
       WHERE token_hash = $1 AND outcome = 'sent' AND used_at IS NULL AND expires_at > NOW()
       RETURNING id, email`,
      [sha256Hex(token)],
    );
    if (!claimed.rows[0]) {
      await client.query("ROLLBACK");
      res.status(410).json({ error: "Посилання застаріло або вже використане. Надішліть новий запит." });
      return;
    }
    const { id, email } = claimed.rows[0];
    const deactivated = await client.query(
      `UPDATE activations SET deactivated_at = NOW()
       WHERE deactivated_at IS NULL
         AND license_key IN (SELECT key FROM licenses WHERE lower(email) = $1)`,
      [email],
    );
    const count = deactivated.rowCount ?? 0;
    await client.query(`UPDATE reset_requests SET deactivated_count = $2 WHERE id = $1`, [id, count]);
    const keys = await client.query(
      `SELECT key, max_devices FROM licenses WHERE lower(email) = $1 AND status = 'active' ORDER BY created`,
      [email],
    );
    await client.query("COMMIT");
    // The user proved control of the mailbox, so it is safe to show the keys again.
    res.json({ ok: true, deactivated: count, licenses: keys.rows.map((r) => ({ key: r.key, max_devices: r.max_devices })) });
  } catch (error: any) {
    await client?.query("ROLLBACK").catch(() => undefined);
    logger.error({ msg: "reset confirm failed", error: error?.message });
    res.status(500).json({ error: "Сервер тимчасово недоступний" });
  } finally {
    client?.release();
  }
});

router.get("/license/public-key", (_req: Request, res: Response): void => {
  try {
    res.json({ algorithm: "Ed25519", publicKey: getPublicKeyRawBase64() });
  } catch {
    res.status(503).json({ error: "Signing key not configured" });
  }
});

// ---------------------------------------------------------------- owner stats
router.get("/owner/license-stats", requireOwner, async (req: Request, res: Response): Promise<void> => {
  const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 365);
  try {
    await ensureLicenseSchema();
    const [licenses, activations, resetsTotal, daily, weekly, topEmails, topLicenses] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE status = 'active')::int AS active,
                COUNT(*) FILTER (WHERE created > NOW() - INTERVAL '7 days')::int AS last_7d,
                COUNT(*) FILTER (WHERE created > NOW() - ($1 * INTERVAL '1 day'))::int AS in_range
         FROM licenses`,
        [days],
      ),
      pool.query(
        `SELECT COUNT(*) FILTER (WHERE deactivated_at IS NULL)::int AS active_devices,
                COUNT(*)::int AS total_devices_ever,
                COUNT(*) FILTER (WHERE deactivated_at IS NOT NULL)::int AS deactivated,
                COUNT(*) FILTER (WHERE last_seen > NOW() - INTERVAL '7 days' AND deactivated_at IS NULL)::int AS seen_7d
         FROM activations`,
      ),
      pool.query(
        `SELECT outcome, COUNT(*)::int AS count FROM reset_requests
         WHERE created > NOW() - ($1 * INTERVAL '1 day') GROUP BY outcome ORDER BY count DESC`,
        [days],
      ),
      pool.query(
        `WITH d AS (
           SELECT generate_series(date_trunc('day', NOW()) - (($1 - 1) * INTERVAL '1 day'), date_trunc('day', NOW()), INTERVAL '1 day') AS day
         )
         SELECT to_char(d.day, 'YYYY-MM-DD') AS day,
           (SELECT COUNT(*)::int FROM licenses l WHERE date_trunc('day', l.created) = d.day) AS licenses,
           (SELECT COUNT(*)::int FROM activations a WHERE date_trunc('day', a.activated_at) = d.day) AS activations,
           (SELECT COUNT(*)::int FROM reset_requests r WHERE date_trunc('day', r.created) = d.day) AS reset_requests,
           (SELECT COUNT(*)::int FROM reset_requests r WHERE date_trunc('day', r.used_at) = d.day) AS resets_confirmed
         FROM d ORDER BY d.day`,
        [days],
      ),
      pool.query(
        `SELECT to_char(date_trunc('week', created), 'YYYY-MM-DD') AS week,
                COUNT(*)::int AS reset_requests,
                COUNT(*) FILTER (WHERE outcome = 'confirmed')::int AS resets_confirmed
         FROM reset_requests WHERE created > NOW() - INTERVAL '12 weeks'
         GROUP BY 1 ORDER BY 1`,
      ),
      pool.query(
        `SELECT email, COUNT(*)::int AS requests,
                COUNT(*) FILTER (WHERE outcome = 'confirmed')::int AS confirmed,
                MAX(created) AS last_request
         FROM reset_requests WHERE created > NOW() - INTERVAL '90 days'
         GROUP BY email HAVING COUNT(*) > 1 ORDER BY requests DESC, last_request DESC LIMIT 10`,
      ),
      pool.query(
        `SELECT l.email, l.key, COUNT(a.id)::int AS devices_ever,
                COUNT(a.id) FILTER (WHERE a.deactivated_at IS NULL)::int AS active_devices
         FROM licenses l JOIN activations a ON a.license_key = l.key
         GROUP BY l.email, l.key HAVING COUNT(a.id) > l.max_devices
         ORDER BY devices_ever DESC LIMIT 10`,
      ),
    ]);
    res.json({
      rangeDays: days,
      licenses: licenses.rows[0],
      activations: activations.rows[0],
      resets: {
        byOutcome: resetsTotal.rows,
        daily: daily.rows,
        weekly: weekly.rows,
      },
      topRepeatEmails: topEmails.rows,
      topDeviceChurn: topLicenses.rows,
    });
  } catch (error: any) {
    logger.error({ msg: "license stats failed", error: error?.message });
    res.status(500).json({ error: "Не вдалося завантажити статистику ліцензій" });
  }
});

export default router;
