import type { NextFunction, Request, Response } from "express";
import { clerkClient, getAuth } from "@clerk/express";
import crypto from "node:crypto";
import { Pool } from "pg";
import {
  sendTrustedDeviceCleanupAlertEmail,
  sendTrustedDeviceReplacementEmail,
} from "../lib/email";
import { logger } from "../lib/logger";
import { OWNER_DEVICE_REPLACEMENT_BURST_WINDOW_HOURS } from "../lib/ownerDeviceSecurity";

const OWNER_DEVICE_COOKIE = "gtf_owner_device";
const DEVICE_COOKIE_MAX_AGE = 1000 * 60 * 60 * 24 * 365;
// Keep trusted-device registration and replacement history for one year. Cleanup
// runs opportunistically after successful owner-device operations so the table
// stays bounded without relying on a separate scheduler.
const OWNER_DEVICE_SECURITY_EVENT_RETENTION_DAYS = 365;
const OWNER_DEVICE_CLEANUP_FAILURE_THRESHOLD = 3;
export const TRUSTED_DEVICE_CLEANUP_DEGRADED_MESSAGE =
  "Trusted-device security event cleanup is failing repeatedly. Check database connectivity and the owner-device security events table health.";
const TRUSTED_DEVICE_CLEANUP_HEALTH_KEY = "owner_device_security_events";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

let cleanupHealthStateReady: Promise<void> | null = null;

declare global {
  namespace Express {
    interface Request {
      ownerEmail?: string;
    }
  }
}

async function getOwnerEmail(req: Request, userId: string): Promise<string | null> {
  try {
    const user = await clerkClient.users.getUser(userId);
    const primaryEmail = user.primaryEmailAddress?.emailAddress;
    if (primaryEmail) return primaryEmail.trim().toLowerCase();
  } catch {
    // Fall back to the verified session claims if Clerk's user lookup is unavailable.
  }

  const claims = getAuth(req).sessionClaims as Record<string, unknown> | null | undefined;
  const email = claims?.email ?? claims?.email_address ?? claims?.primary_email_address;
  return typeof email === "string" ? email.trim().toLowerCase() : null;
}

function signDeviceToken(token: string): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET must be set for owner access");
  return crypto.createHmac("sha256", secret).update(token).digest("hex");
}

function hashDeviceToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function getDeviceCookie(req: Request): string | undefined {
  return req.headers.cookie
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${OWNER_DEVICE_COOKIE}=`))
    ?.slice(OWNER_DEVICE_COOKIE.length + 1);
}

function isValidDeviceCookie(value: string | undefined): boolean {
  if (!value) return false;
  const [token, signature] = value.split(".");
  if (!token || !signature) return false;
  const expected = signDeviceToken(token);
  return signature.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

function setDeviceCookie(res: Response, token: string): void {
  const signed = `${token}.${signDeviceToken(token)}`;
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${OWNER_DEVICE_COOKIE}=${signed}; Max-Age=${DEVICE_COOKIE_MAX_AGE / 1000}; Path=/; HttpOnly; SameSite=Lax${secure}`,
  );
}

async function ensureCleanupHealthState(): Promise<void> {
  if (!cleanupHealthStateReady) {
    cleanupHealthStateReady = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS trusted_device_cleanup_health (
          health_key TEXT PRIMARY KEY,
          consecutive_failures INTEGER NOT NULL DEFAULT 0,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await pool.query(
        `INSERT INTO trusted_device_cleanup_health (health_key)
         VALUES ($1)
         ON CONFLICT (health_key) DO NOTHING`,
        [TRUSTED_DEVICE_CLEANUP_HEALTH_KEY],
      );
    })();
  }

  try {
    await cleanupHealthStateReady;
  } catch (error) {
    cleanupHealthStateReady = null;
    throw error;
  }
}

async function recordCleanupFailure(): Promise<number | null> {
  try {
    await ensureCleanupHealthState();
    const result = await pool.query(
      `UPDATE trusted_device_cleanup_health
       SET consecutive_failures = consecutive_failures + 1,
           updated_at = NOW()
       WHERE health_key = $1
       RETURNING consecutive_failures`,
      [TRUSTED_DEVICE_CLEANUP_HEALTH_KEY],
    );
    return Number(result.rows[0]?.consecutive_failures ?? 0);
  } catch (error) {
    logger.error({
      msg: "Trusted device security event cleanup health state unavailable",
      error,
    });
    return null;
  }
}

async function recordCleanupSuccess(): Promise<void> {
  try {
    await ensureCleanupHealthState();
    const result = await pool.query(
      `WITH previous AS (
         SELECT consecutive_failures AS previous_failure_count
         FROM trusted_device_cleanup_health
         WHERE health_key = $1
         FOR UPDATE
       )
       UPDATE trusted_device_cleanup_health AS health
       SET consecutive_failures = 0,
           updated_at = NOW()
       FROM previous
       WHERE health.health_key = $1
       RETURNING previous.previous_failure_count`,
      [TRUSTED_DEVICE_CLEANUP_HEALTH_KEY],
    );
    const previousFailureCount = Number(
      result.rows[0]?.previous_failure_count ?? 0,
    );
    if (previousFailureCount >= OWNER_DEVICE_CLEANUP_FAILURE_THRESHOLD) {
      logger.info({
        msg: "Trusted device security event cleanup recovered",
        previousFailureCount,
      });
    }
  } catch (error) {
    logger.error({
      msg: "Trusted device security event cleanup health state unavailable",
      error,
    });
  }
}

async function pruneOwnerDeviceSecurityEvents(email: string): Promise<void> {
  try {
    await pool.query(
      `DELETE FROM owner_device_security_events
       WHERE email = $1
         AND created_at < NOW() - ($2 * INTERVAL '1 day')`,
      [email, OWNER_DEVICE_SECURITY_EVENT_RETENTION_DAYS],
    );
  } catch (error) {
    const failureCount = await recordCleanupFailure();
    logger.warn({
      msg: "Trusted device security event cleanup failed",
      failureCount: failureCount ?? "unknown",
      failureThreshold: OWNER_DEVICE_CLEANUP_FAILURE_THRESHOLD,
      error,
    });
    if (failureCount === null) return;
    if (failureCount === OWNER_DEVICE_CLEANUP_FAILURE_THRESHOLD) {
      logger.error({
        msg: "Trusted device security event cleanup repeatedly failing",
        failureCount,
        failureThreshold: OWNER_DEVICE_CLEANUP_FAILURE_THRESHOLD,
        action:
          "Check database connectivity and the owner-device security events table",
        error,
      });
      void sendTrustedDeviceCleanupAlertEmail().catch((alertError) => {
        logger.error({
          msg: "Trusted device security event cleanup alert delivery failed",
          error: alertError,
        });
      });
    }
    return;
  }
  await recordCleanupSuccess();
}

export async function getTrustedDeviceCleanupHealth(): Promise<{
  status: "ok" | "degraded";
  message?: string;
}> {
  try {
    await ensureCleanupHealthState();
    const result = await pool.query(
      `SELECT consecutive_failures
       FROM trusted_device_cleanup_health
       WHERE health_key = $1`,
      [TRUSTED_DEVICE_CLEANUP_HEALTH_KEY],
    );
    const failureCount = Number(result.rows[0]?.consecutive_failures ?? 0);
    return failureCount >= OWNER_DEVICE_CLEANUP_FAILURE_THRESHOLD
      ? { status: "degraded", message: TRUSTED_DEVICE_CLEANUP_DEGRADED_MESSAGE }
      : { status: "ok" };
  } catch (error) {
    logger.error({
      msg: "Trusted device security event cleanup health state unavailable",
      error,
    });
    return {
      status: "degraded",
      message: TRUSTED_DEVICE_CLEANUP_DEGRADED_MESSAGE,
    };
  }
}

export async function getRecentOwnerDeviceReplacementCount(email: string): Promise<number> {
  const result = await pool.query(
    `SELECT COUNT(*)::int AS replacement_count
     FROM owner_device_security_events
     WHERE email = $1
       AND event_type = 'replaced'
       AND created_at >= NOW() - ($2 * INTERVAL '1 hour')`,
    [email, OWNER_DEVICE_REPLACEMENT_BURST_WINDOW_HOURS],
  );
  return Number(result.rows[0]?.replacement_count ?? 0);
}

async function ensureOwnerDevice(req: Request, res: Response, email: string): Promise<boolean> {
  const existing = await pool.query(
    "SELECT token_hash FROM owner_devices WHERE email = $1 LIMIT 1",
    [email],
  );
  const cookie = getDeviceCookie(req);

  if (existing.rows[0]) {
    const [token] = cookie?.split(".") ?? [];
    const valid = Boolean(
      token &&
      isValidDeviceCookie(cookie) &&
      hashDeviceToken(token) === existing.rows[0].token_hash,
    );
    if (valid) await pruneOwnerDeviceSecurityEvents(email);
    return valid;
  }

  const token = crypto.randomBytes(24).toString("hex");
  const inserted = await pool.query(
    `WITH registered_device AS (
       INSERT INTO owner_devices (email, token_hash)
       VALUES ($1, $2)
       ON CONFLICT (email) DO NOTHING
       RETURNING email
     )
     INSERT INTO owner_device_security_events (email, event_type)
     SELECT email, 'registered' FROM registered_device
     RETURNING created_at`,
    [email, hashDeviceToken(token)],
  );
  if (inserted.rowCount !== 1) return false;

  setDeviceCookie(res, token);
  await pruneOwnerDeviceSecurityEvents(email);
  return true;
}

async function getVerifiedOwnerEmail(req: Request, res: Response): Promise<string | null> {
  const auth = getAuth(req);
  if (!auth.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  const ownerEmail = process.env.OWNER_EMAIL?.trim().toLowerCase();
  let email: string | null = null;
  try {
    email = await getOwnerEmail(req, auth.userId);
  } catch {
    res.status(403).json({ error: "Unable to verify owner access" });
    return null;
  }
  if (!ownerEmail || !email || email !== ownerEmail) {
    res.status(403).json({ error: "Owner access required" });
    return null;
  }

  return email;
}

export async function requireOwnerIdentity(req: Request, res: Response, next: NextFunction): Promise<void> {
  const email = await getVerifiedOwnerEmail(req, res);
  if (!email) return;
  req.ownerEmail = email;
  next();
}

export async function recoverOwnerDevice(req: Request, res: Response): Promise<void> {
  if (!req.ownerEmail) {
    res.status(500).json({ error: "Owner recovery is unavailable" });
    return;
  }
  if (req.body?.confirm !== true) {
    res.status(400).json({ error: "Recovery confirmation required" });
    return;
  }

  const token = crypto.randomBytes(24).toString("hex");
  let replacedAt: Date;
  try {
    const replacement = await pool.query(
      `WITH replaced_device AS (
         INSERT INTO owner_devices (email, token_hash)
         VALUES ($1, $2)
         ON CONFLICT (email) DO UPDATE
         SET token_hash = EXCLUDED.token_hash, created_at = NOW()
         RETURNING email, created_at
       ),
       recorded_event AS (
         INSERT INTO owner_device_security_events (email, event_type, created_at)
         SELECT email, 'replaced', created_at FROM replaced_device
       )
       SELECT created_at FROM replaced_device`,
      [req.ownerEmail, hashDeviceToken(token)],
    );
    replacedAt = new Date(replacement.rows[0].created_at);
  } catch {
    res.status(503).json({ error: "Unable to reset trusted device" });
    return;
  }
  let replacementCount = 1;
  try {
    replacementCount = Math.max(1, await getRecentOwnerDeviceReplacementCount(req.ownerEmail));
  } catch (error) {
    logger.warn({
      msg: "Trusted device replacement frequency check failed",
      ownerEmail: req.ownerEmail,
      error,
    });
  }
  await pruneOwnerDeviceSecurityEvents(req.ownerEmail);
  setDeviceCookie(res, token);
  res.status(204).end();

  void sendTrustedDeviceReplacementEmail({
    ownerEmail: req.ownerEmail,
    replacedAt,
    replacementCount,
  })
    .catch((error) => {
      logger.error({
      msg: "Trusted device replacement notification failed",
      ownerEmail: req.ownerEmail,
      replacedAt: replacedAt.toISOString(),
      error,
      });
    });
}

export async function requireOwner(req: Request, res: Response, next: NextFunction): Promise<void> {
  const email = await getVerifiedOwnerEmail(req, res);
  if (!email) return;

  try {
    // Device registration is informational only. Owner access is determined by
    // the verified Clerk email; a missing or stale device cookie must not hide
    // the owner dashboard or turn an available database into a 503.
    await ensureOwnerDevice(req, res, email);
  } catch (error) {
    logger.warn({
      msg: "Trusted device registration unavailable; continuing with owner access",
      error,
    });
  }
  req.ownerEmail = email;
  next();
}