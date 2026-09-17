import { Router, type Request, type Response } from "express";
import { Pool } from "pg";
import {
  getRecentOwnerDeviceReplacementCount,
  recoverOwnerDevice,
  requireOwner,
  requireOwnerIdentity,
} from "../middleware/ownerAuth";
import { logger } from "../lib/logger";
import {
  OWNER_DEVICE_REPLACEMENT_BURST_THRESHOLD,
  OWNER_DEVICE_REPLACEMENT_BURST_WINDOW_HOURS,
} from "../lib/ownerDeviceSecurity";

const router = Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const countryCache = new Map<string, { country: string; expiresAt: number }>();
const activityRateLimit = new Map<string, { windowStart: number; count: number }>();

const ACTIVITY_RATE_LIMIT = 30;
const ACTIVITY_RATE_WINDOW_MS = 60_000;
const MAX_ACTIVITY_RATE_LIMIT_CLIENTS = 10_000;

const ALLOWED_EVENTS = new Set([
  "page_viewed",
  "product_viewed",
  "cart_item_added",
  "cart_item_removed",
  "checkout_started",
  "payment_redirect_created",
  "checkout_failed",
  "external_link_clicked",
]);

function safeText(value: unknown, maxLength: number): string | null {
  return typeof value === "string" && value.length <= maxLength ? value : null;
}

function getHeaderCountry(req: Request): string | null {
  const value =
    req.headers["cf-ipcountry"] ??
    req.headers["x-country-code"] ??
    req.headers["x-vercel-ip-country"] ??
    req.headers["cloudfront-viewer-country"];
  const country = Array.isArray(value) ? value[0] : value;
  return typeof country === "string" && country.length <= 80 ? country : null;
}

function getPublicIp(req: Request): string | null {
  const forwarded = req.headers["x-forwarded-for"];
  const value = (Array.isArray(forwarded) ? forwarded[0] : forwarded)
    ?.split(",")[0]
    ?.trim()
    .replace(/^::ffff:/, "");
  if (!value || value === "::1" || value === "127.0.0.1") return null;
  if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(value)) return null;
  return value;
}

function getActivityClientKey(req: Request): string {
  const publicIp = getPublicIp(req);
  if (publicIp) return publicIp;

  const requestIp = req.ip?.replace(/^::ffff:/, "");
  return requestIp || req.socket.remoteAddress?.replace(/^::ffff:/, "") || "unknown";
}

function allowActivityRequest(req: Request, now = Date.now()): {
  allowed: boolean;
  retryAfterSeconds: number;
} {
  const clientKey = getActivityClientKey(req);
  const current = activityRateLimit.get(clientKey);

  if (!current || now - current.windowStart >= ACTIVITY_RATE_WINDOW_MS) {
    activityRateLimit.set(clientKey, { windowStart: now, count: 1 });
    trimActivityRateLimit(now);
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (current.count >= ACTIVITY_RATE_LIMIT) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((current.windowStart + ACTIVITY_RATE_WINDOW_MS - now) / 1000),
      ),
    };
  }

  current.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

function trimActivityRateLimit(now: number): void {
  if (activityRateLimit.size <= MAX_ACTIVITY_RATE_LIMIT_CLIENTS) return;

  for (const [clientKey, entry] of activityRateLimit) {
    if (now - entry.windowStart >= ACTIVITY_RATE_WINDOW_MS) {
      activityRateLimit.delete(clientKey);
    }
  }

  while (activityRateLimit.size > MAX_ACTIVITY_RATE_LIMIT_CLIENTS) {
    const oldestClient = activityRateLimit.keys().next().value;
    if (!oldestClient) break;
    activityRateLimit.delete(oldestClient);
  }
}

async function resolveCountry(req: Request): Promise<string> {
  const headerCountry = getHeaderCountry(req);
  if (headerCountry) return headerCountry;

  const ip = getPublicIp(req);
  if (!ip) return "unknown";
  const cached = countryCache.get(ip);
  if (cached && cached.expiresAt > Date.now()) return cached.country;

  try {
    const response = await fetch(
      `https://ipwho.is/${encodeURIComponent(ip)}?fields=success,country,country_code`,
      { signal: AbortSignal.timeout(1500) },
    );
    const payload = await response.json() as {
      success?: boolean;
      country?: string;
      country_code?: string;
    };
    const country = payload.success
      ? (payload.country_code || payload.country || "unknown")
      : "unknown";
    countryCache.set(ip, {
      country,
      expiresAt: Date.now() + 1000 * 60 * 60 * 24,
    });
    return country;
  } catch {
    return "unknown";
  }
}

router.post("/activity/event", async (req: Request, res: Response) => {
  try {
    const eventName = safeText(req.body?.eventName, 50);
    const path = safeText(req.body?.path, 300);
    const visitorId = safeText(req.body?.visitorId, 100);
    const metadata =
      req.body?.metadata &&
      typeof req.body.metadata === "object" &&
      !Array.isArray(req.body.metadata)
        ? { ...req.body.metadata }
        : {};

    if (!eventName || !ALLOWED_EVENTS.has(eventName)) {
      res.status(400).json({ error: "Unsupported activity event" });
      return;
    }

    const rateLimit = allowActivityRequest(req);
    if (!rateLimit.allowed) {
      res
        .set("Retry-After", String(rateLimit.retryAfterSeconds))
        .status(429)
        .json({ error: "Activity rate limit exceeded" });
      return;
    }

    metadata.country = await resolveCountry(req);
    const metadataJson = JSON.stringify(metadata);
    if (metadataJson.length > 2000) {
      res.status(413).json({ error: "Activity metadata is too large" });
      return;
    }

    await pool.query(
      `INSERT INTO activity_events (event_name, path, visitor_id, metadata)
       VALUES ($1, $2, $3, $4::jsonb)`,
      [eventName, path, visitorId, metadataJson],
    );
    res.status(204).end();
  } catch (error) {
    logger.warn({ msg: "Activity event could not be saved", error });
    res.status(204).end();
  }
});

router.post("/owner/device/recover", requireOwnerIdentity, recoverOwnerDevice);

router.get("/owner/activity", requireOwner, async (req: Request, res: Response) => {
  try {
    const [
      summaryResult,
      eventResult,
      dailyResult,
      pagesResult,
      recentResult,
      deviceResult,
      deviceSecurityEventResult,
      replacementFrequencyResult,
    ] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE event_name = 'page_viewed')::int AS page_views,
          COUNT(DISTINCT visitor_id)::int AS unique_visitors,
          COUNT(*)::int AS total_events
        FROM activity_events
        WHERE created_at >= NOW() - INTERVAL '30 days'
      `),
      pool.query(`
        SELECT event_name, COUNT(*)::int AS count
        FROM activity_events
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY event_name
        ORDER BY count DESC, event_name ASC
      `),
      pool.query(`
        SELECT TO_CHAR(DATE_TRUNC('day', created_at), 'YYYY-MM-DD') AS day,
               COUNT(*) FILTER (WHERE event_name = 'page_viewed')::int AS page_views,
               COUNT(DISTINCT visitor_id)::int AS visitors
        FROM activity_events
        WHERE created_at >= NOW() - INTERVAL '14 days'
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY day ASC
      `),
      pool.query(`
        SELECT COALESCE(path, '/') AS path, COUNT(*)::int AS count
        FROM activity_events
        WHERE event_name = 'page_viewed'
          AND created_at >= NOW() - INTERVAL '30 days'
        GROUP BY COALESCE(path, '/')
        ORDER BY count DESC, path ASC
        LIMIT 8
      `),
      pool.query(`
        SELECT
          event_name,
          COALESCE(path, '/') AS path,
          COALESCE(metadata->>'country', 'unknown') AS country,
          COALESCE(metadata->>'referrer', 'direct') AS referrer,
          created_at
        FROM activity_events
        ORDER BY created_at DESC
        LIMIT 50
      `),
      pool.query(
        `SELECT created_at
         FROM owner_devices
         WHERE email = $1
         LIMIT 1`,
        [req.ownerEmail],
      ),
      pool.query(
        `SELECT event_type, created_at
         FROM owner_device_security_events
         WHERE email = $1
         ORDER BY created_at DESC, id DESC
         LIMIT 20`,
        [req.ownerEmail],
      ),
      getRecentOwnerDeviceReplacementCount(req.ownerEmail as string),
    ]);
    const recentReplacementCount = replacementFrequencyResult;

    res.json({
      rangeDays: 30,
      summary: summaryResult.rows[0] ?? {
        page_views: 0,
        unique_visitors: 0,
        total_events: 0,
      },
      events: eventResult.rows,
      daily: dailyResult.rows,
      topPages: pagesResult.rows,
      recentEvents: recentResult.rows,
      trustedDevice: {
        registeredAt: deviceResult.rows[0]?.created_at ?? null,
        recentEvents: deviceSecurityEventResult.rows,
        replacementBurst: {
          count: recentReplacementCount,
          threshold: OWNER_DEVICE_REPLACEMENT_BURST_THRESHOLD,
          windowHours: OWNER_DEVICE_REPLACEMENT_BURST_WINDOW_HOURS,
          warning: recentReplacementCount >= OWNER_DEVICE_REPLACEMENT_BURST_THRESHOLD,
        },
      },
    });
  } catch (error) {
    logger.error({ msg: "Owner activity query failed", error });
    res.status(500).json({ error: "Unable to load activity" });
  }
});

export default router;