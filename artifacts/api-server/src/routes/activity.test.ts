import crypto from "node:crypto";
import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const database = vi.hoisted(() => ({
  devices: new Map<string, string>(),
  deviceRegisteredAt: new Map<string, string>(),
  deviceSecurityEvents: [] as Array<{ email: string; event_type: string; created_at: string }>,
  failSecurityEventCleanup: false,
  cleanupHealthFailureCount: 0,
  activityInserts: 0,
  query: vi.fn(),
}));

const email = vi.hoisted(() => ({
  sendTrustedDeviceCleanupAlertEmail: vi.fn(),
  sendTrustedDeviceReplacementEmail: vi.fn(),
}));

const log = vi.hoisted(() => ({
  error: vi.fn(),
  warn: vi.fn(),
}));

const getUser = vi.hoisted(() => vi.fn());

vi.mock("pg", () => ({
  Pool: class {
    query = database.query;
  },
}));

vi.mock("../lib/email", () => email);

vi.mock("../lib/logger", () => ({
  logger: {
    error: log.error,
    warn: log.warn,
    info: vi.fn(),
  },
}));

vi.mock("@clerk/express", () => ({
  getAuth: (req: express.Request) => {
    const userId = req.header("x-test-user-id");
    const email = req.header("x-test-email");
    return {
      userId: userId || null,
      sessionClaims: email ? { email } : null,
    };
  },
  clerkClient: {
    users: {
      getUser,
    },
  },
}));

import activityRouter from "./activity";
import healthRouter from "./health";

const OWNER_EMAIL = "owner@example.com";
const SESSION_SECRET = "activity-route-test-secret";

function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/api", healthRouter);
  app.use("/api", activityRouter);
  return app;
}

function owner(requestBuilder: request.Test) {
  return requestBuilder
    .set("x-test-user-id", "owner-user")
    .set("x-test-email", OWNER_EMAIL);
}

describe("private owner activity routes", () => {
  beforeEach(() => {
    process.env.OWNER_EMAIL = OWNER_EMAIL;
    process.env.SESSION_SECRET = SESSION_SECRET;
    database.devices.clear();
    database.deviceRegisteredAt.clear();
    database.deviceSecurityEvents.length = 0;
    database.failSecurityEventCleanup = false;
    database.cleanupHealthFailureCount = 0;
    database.activityInserts = 0;
    email.sendTrustedDeviceCleanupAlertEmail.mockReset();
    email.sendTrustedDeviceCleanupAlertEmail.mockResolvedValue(undefined);
    email.sendTrustedDeviceReplacementEmail.mockReset();
    email.sendTrustedDeviceReplacementEmail.mockResolvedValue(undefined);
    log.error.mockReset();
    log.warn.mockReset();
    getUser.mockReset();
    database.query.mockReset();
    database.query.mockImplementation(async (sql: string, params: unknown[] = []) => {
      if (sql.includes("CREATE TABLE IF NOT EXISTS trusted_device_cleanup_health")) {
        return { rows: [], rowCount: 0 };
      }
      if (sql.includes("INSERT INTO trusted_device_cleanup_health")) {
        return { rows: [], rowCount: 1 };
      }
      if (sql.includes("SET consecutive_failures = consecutive_failures + 1")) {
        database.cleanupHealthFailureCount += 1;
        return {
          rows: [{ consecutive_failures: database.cleanupHealthFailureCount }],
          rowCount: 1,
        };
      }
      if (sql.includes("UPDATE trusted_device_cleanup_health AS health")) {
        const previousFailureCount = database.cleanupHealthFailureCount;
        database.cleanupHealthFailureCount = 0;
        return {
          rows: [{ previous_failure_count: previousFailureCount }],
          rowCount: 1,
        };
      }
      if (sql.includes("SELECT consecutive_failures")) {
        return {
          rows: [{ consecutive_failures: database.cleanupHealthFailureCount }],
          rowCount: 1,
        };
      }
      if (sql.includes("SELECT token_hash FROM owner_devices")) {
        const tokenHash = database.devices.get(String(params[0]));
        return { rows: tokenHash ? [{ token_hash: tokenHash }] : [], rowCount: tokenHash ? 1 : 0 };
      }
      if (sql.includes("DELETE FROM owner_device_security_events")) {
        if (database.failSecurityEventCleanup) {
          throw new Error("security history cleanup unavailable");
        }
        const retentionCutoff = new Date("2025-09-17T12:30:00.000Z");
        const beforeCleanup = database.deviceSecurityEvents.length;
        database.deviceSecurityEvents = database.deviceSecurityEvents.filter(
          (event) => new Date(event.created_at) >= retentionCutoff,
        );
        return {
          rows: [],
          rowCount: beforeCleanup - database.deviceSecurityEvents.length,
        };
      }
      if (sql.includes("COUNT(*)::int AS replacement_count")) {
        return {
          rows: [{
            replacement_count: database.deviceSecurityEvents.filter(
              (event) => event.email === String(params[0]) && event.event_type === "replaced",
            ).length,
          }],
          rowCount: 1,
        };
      }
      if (sql.includes("INSERT INTO owner_devices")) {
        const ownerEmail = String(params[0]);
        const isReplacement = sql.includes("'replaced'");
        if (!isReplacement && database.devices.has(ownerEmail)) {
          return { rows: [], rowCount: 0 };
        }
        database.devices.set(ownerEmail, String(params[1]));
        database.deviceRegisteredAt.set(ownerEmail, "2026-09-17T12:30:00.000Z");
        database.deviceSecurityEvents.push({
          email: ownerEmail,
          event_type: isReplacement ? "replaced" : "registered",
          created_at: "2026-09-17T12:30:00.000Z",
        });
        return { rows: [{ created_at: "2026-09-17T12:30:00.000Z" }], rowCount: 1 };
      }
      if (sql.includes("FROM owner_device_security_events")) {
        return {
          rows: database.deviceSecurityEvents
            .filter((event) => event.email === String(params[0]))
            .map(({ event_type, created_at }) => ({ event_type, created_at })),
          rowCount: database.deviceSecurityEvents.length,
        };
      }
      if (sql.includes("SELECT created_at") && sql.includes("FROM owner_devices")) {
        const registeredAt = database.deviceRegisteredAt.get(String(params[0]));
        return { rows: registeredAt ? [{ created_at: registeredAt }] : [], rowCount: registeredAt ? 1 : 0 };
      }
      if (sql.includes("INSERT INTO activity_events")) {
        database.activityInserts += 1;
        return { rows: [], rowCount: 1 };
      }
      if (sql.includes("AS page_views") && sql.includes("total_events")) {
        return { rows: [{ page_views: 2, unique_visitors: 1, total_events: 3 }], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    });
  });

  it("registers the owner's first device and grants access", async () => {
    const response = await owner(request(createApp()).get("/api/owner/activity"));

    expect(response.status).toBe(200);
    expect(response.headers["set-cookie"]?.[0]).toContain("gtf_owner_device=");
    expect(response.body.summary).toEqual({
      page_views: 2,
      unique_visitors: 1,
      total_events: 3,
    });
    expect(response.body.trustedDevice).toEqual({
      registeredAt: "2026-09-17T12:30:00.000Z",
      recentEvents: [{
        event_type: "registered",
        created_at: "2026-09-17T12:30:00.000Z",
      }],
      replacementBurst: {
        count: 0,
        threshold: 3,
        windowHours: 24,
        warning: false,
      },
    });
    expect(database.deviceSecurityEvents).toHaveLength(1);
  });

  it("uses the Clerk primary email when session claims contain a different email", async () => {
    getUser.mockResolvedValue({
      primaryEmailAddress: { emailAddress: OWNER_EMAIL },
    });

    const response = await request(createApp())
      .get("/api/owner/activity")
      .set("x-test-user-id", "owner-user")
      .set("x-test-email", "stale-claim@example.com");

    expect(response.status).toBe(200);
    expect(response.headers["set-cookie"]?.[0]).toContain("gtf_owner_device=");
  });

  it("removes security events older than one year while keeping recent history", async () => {
    const trustedToken = "trusted-token";
    database.devices.set(
      OWNER_EMAIL,
      crypto.createHash("sha256").update(trustedToken).digest("hex"),
    );
    database.deviceRegisteredAt.set(OWNER_EMAIL, "2026-09-17T12:30:00.000Z");
    database.deviceSecurityEvents.push(
      {
        email: OWNER_EMAIL,
        event_type: "replaced",
        created_at: "2025-09-16T12:30:00.000Z",
      },
      {
        email: OWNER_EMAIL,
        event_type: "replaced",
        created_at: "2026-09-16T12:30:00.000Z",
      },
    );
    const signature = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(trustedToken)
      .digest("hex");

    const response = await owner(request(createApp()).get("/api/owner/activity"))
      .set("Cookie", `gtf_owner_device=${trustedToken}.${signature}`);

    expect(response.status).toBe(200);
    expect(database.deviceSecurityEvents).toEqual([{
      email: OWNER_EMAIL,
      event_type: "replaced",
      created_at: "2026-09-16T12:30:00.000Z",
    }]);
    expect(response.body.trustedDevice.recentEvents).toEqual([{
      event_type: "replaced",
      created_at: "2026-09-16T12:30:00.000Z",
    }]);
    expect(response.body.trustedDevice.replacementBurst).toEqual({
      count: 1,
      threshold: 3,
      windowHours: 24,
      warning: false,
    });
    const cleanupCall = database.query.mock.calls.find(([sql]) =>
      String(sql).includes("DELETE FROM owner_device_security_events"),
    );
    expect(cleanupCall?.[0]).toContain("INTERVAL '1 day'");
    expect(cleanupCall?.[1]).toEqual([OWNER_EMAIL, 365]);
  });

  it("keeps the owner dashboard available when security history cleanup fails", async () => {
    const trustedToken = "trusted-token";
    database.devices.set(
      OWNER_EMAIL,
      crypto.createHash("sha256").update(trustedToken).digest("hex"),
    );
    database.deviceRegisteredAt.set(OWNER_EMAIL, "2026-09-17T12:30:00.000Z");
    database.deviceSecurityEvents.push({
      email: OWNER_EMAIL,
      event_type: "replaced",
      created_at: "2026-09-16T12:30:00.000Z",
    });
    database.failSecurityEventCleanup = true;
    const signature = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(trustedToken)
      .digest("hex");

    const response = await owner(request(createApp()).get("/api/owner/activity"))
      .set("Cookie", `gtf_owner_device=${trustedToken}.${signature}`);

    expect(response.status).toBe(200);
    expect(response.body.trustedDevice.recentEvents).toEqual([{
      event_type: "replaced",
      created_at: "2026-09-16T12:30:00.000Z",
    }]);
    expect(log.warn).toHaveBeenCalledWith(expect.objectContaining({
      msg: "Trusted device security event cleanup failed",
      failureCount: 1,
      failureThreshold: 3,
      error: expect.any(Error),
    }));
    expect(log.warn.mock.calls[0][0]).not.toHaveProperty("ownerEmail");
  });

  it("reports degraded health after repeated security history cleanup failures", async () => {
    const trustedToken = "trusted-token";
    database.devices.set(
      OWNER_EMAIL,
      crypto.createHash("sha256").update(trustedToken).digest("hex"),
    );
    database.failSecurityEventCleanup = true;
    const signature = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(trustedToken)
      .digest("hex");
    const cookie = `gtf_owner_device=${trustedToken}.${signature}`;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await owner(request(createApp()).get("/api/owner/activity"))
        .set("Cookie", cookie);
      expect(response.status).toBe(200);
    }

    const health = await request(createApp()).get("/api/healthz");

    expect(health.status).toBe(503);
    expect(health.body).toEqual({
      status: "degraded",
      message: "Trusted-device security event cleanup is failing repeatedly. Check database connectivity and the owner-device security events table health.",
    });
    const secondInstanceHealth = await request(createApp()).get("/api/healthz");
    expect(secondInstanceHealth.status).toBe(503);
    expect(secondInstanceHealth.body).toEqual(health.body);
    const cleanupHealthCalls = database.query.mock.calls.filter(([sql]) =>
      String(sql).includes("trusted_device_cleanup_health"),
    );
    expect(cleanupHealthCalls.every(([, params]) =>
      !params || !params.includes(OWNER_EMAIL),
    )).toBe(true);
    expect(email.sendTrustedDeviceCleanupAlertEmail).toHaveBeenCalledTimes(1);
    expect(email.sendTrustedDeviceCleanupAlertEmail.mock.calls[0]).toEqual([]);
    expect(log.error).toHaveBeenCalledWith(expect.objectContaining({
      msg: "Trusted device security event cleanup repeatedly failing",
      failureCount: 3,
      failureThreshold: 3,
      action: expect.any(String),
      error: expect.any(Error),
    }));
    expect(log.error.mock.calls[0][0]).not.toHaveProperty("ownerEmail");

    database.failSecurityEventCleanup = false;
    const recovered = await owner(request(createApp()).get("/api/owner/activity"))
      .set("Cookie", cookie);
    expect(recovered.status).toBe(200);
    await expect(request(createApp()).get("/api/healthz")).resolves.toMatchObject({
      status: 200,
      body: { status: "ok" },
    });
    expect(email.sendTrustedDeviceCleanupAlertEmail).toHaveBeenCalledTimes(1);
  });

  it("rejects a different authenticated email", async () => {
    const response = await request(createApp())
      .get("/api/owner/activity")
      .set("x-test-user-id", "other-user")
      .set("x-test-email", "other@example.com");

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: "Owner access required" });
  });

  it("allows the owner without the registered device cookie", async () => {
    database.devices.set(OWNER_EMAIL, crypto.createHash("sha256").update("trusted-token").digest("hex"));

    const response = await owner(request(createApp()).get("/api/owner/activity"));

    expect(response.status).toBe(200);
    expect(response.body.summary).toEqual({
      page_views: 2,
      unique_visitors: 1,
      total_events: 3,
    });
  });

  it("allows the owner from a different device", async () => {
    database.devices.set(OWNER_EMAIL, crypto.createHash("sha256").update("trusted-token").digest("hex"));
    const otherToken = "different-device-token";
    const signature = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(otherToken)
      .digest("hex");

    const response = await owner(request(createApp()).get("/api/owner/activity"))
      .set("Cookie", `gtf_owner_device=${otherToken}.${signature}`);

    expect(response.status).toBe(200);
    expect(response.body.summary).toEqual({
      page_views: 2,
      unique_visitors: 1,
      total_events: 3,
    });
  });

  it("rejects signed-out requests", async () => {
    const response = await request(createApp()).get("/api/owner/activity");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Unauthorized" });
  });

  it("requires explicit confirmation before recovering the trusted device", async () => {
    database.devices.set(OWNER_EMAIL, crypto.createHash("sha256").update("trusted-token").digest("hex"));

    const response = await owner(request(createApp()).post("/api/owner/device/recover")).send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Recovery confirmation required" });
    expect(database.devices.get(OWNER_EMAIL)).toBe(
      crypto.createHash("sha256").update("trusted-token").digest("hex"),
    );
  });

  it("allows the owner to rotate the trusted device without blocking the old device", async () => {
    const oldToken = "trusted-token";
    database.devices.set(OWNER_EMAIL, crypto.createHash("sha256").update(oldToken).digest("hex"));

    const recovery = await owner(request(createApp()).post("/api/owner/device/recover"))
      .send({ confirm: true });

    expect(recovery.status).toBe(204);
    expect(database.deviceSecurityEvents).toEqual([
      {
        email: OWNER_EMAIL,
        event_type: "replaced",
        created_at: "2026-09-17T12:30:00.000Z",
      },
    ]);
    expect(email.sendTrustedDeviceReplacementEmail).toHaveBeenCalledWith({
      ownerEmail: OWNER_EMAIL,
      replacedAt: new Date("2026-09-17T12:30:00.000Z"),
      replacementCount: 1,
    });
    const replacementCookie = recovery.headers["set-cookie"]?.[0];
    expect(replacementCookie).toContain("gtf_owner_device=");
    expect(replacementCookie).not.toContain(`${oldToken}.`);

    const oldDeviceResponse = await owner(request(createApp()).get("/api/owner/activity"))
      .set("Cookie", `gtf_owner_device=${oldToken}.${crypto
        .createHmac("sha256", SESSION_SECRET)
        .update(oldToken)
        .digest("hex")}`);
    expect(oldDeviceResponse.status).toBe(200);
    expect(oldDeviceResponse.body.summary).toEqual({
      page_views: 2,
      unique_visitors: 1,
      total_events: 3,
    });

    const replacementResponse = await owner(request(createApp()).get("/api/owner/activity"))
      .set("Cookie", replacementCookie);
    expect(replacementResponse.status).toBe(200);
  });

  it("keeps device recovery successful when security history cleanup fails", async () => {
    const oldToken = "trusted-token";
    database.devices.set(OWNER_EMAIL, crypto.createHash("sha256").update(oldToken).digest("hex"));
    database.failSecurityEventCleanup = true;

    const response = await owner(request(createApp()).post("/api/owner/device/recover"))
      .send({ confirm: true });

    expect(response.status).toBe(204);
    expect(response.headers["set-cookie"]?.[0]).toContain("gtf_owner_device=");
    expect(database.devices.get(OWNER_EMAIL)).not.toBe(
      crypto.createHash("sha256").update(oldToken).digest("hex"),
    );
    expect(database.deviceSecurityEvents).toEqual([{
      email: OWNER_EMAIL,
      event_type: "replaced",
      created_at: "2026-09-17T12:30:00.000Z",
    }]);
    expect(log.warn).toHaveBeenCalledWith(expect.objectContaining({
      msg: "Trusted device security event cleanup failed",
      failureCount: 1,
      failureThreshold: 3,
      error: expect.any(Error),
    }));
    expect(log.warn.mock.calls[0][0]).not.toHaveProperty("ownerEmail");
  });

  it("counts repeated replacements in the last day and marks the owner activity as suspicious", async () => {
    database.devices.set(
      OWNER_EMAIL,
      crypto.createHash("sha256").update("trusted-token").digest("hex"),
    );
    database.deviceSecurityEvents.push(
      {
        email: OWNER_EMAIL,
        event_type: "replaced",
        created_at: "2026-09-17T10:00:00.000Z",
      },
      {
        email: OWNER_EMAIL,
        event_type: "replaced",
        created_at: "2026-09-17T11:00:00.000Z",
      },
    );

    const recovery = await owner(request(createApp()).post("/api/owner/device/recover"))
      .send({ confirm: true });

    expect(recovery.status).toBe(204);
    expect(email.sendTrustedDeviceReplacementEmail).toHaveBeenCalledWith({
      ownerEmail: OWNER_EMAIL,
      replacedAt: new Date("2026-09-17T12:30:00.000Z"),
      replacementCount: 3,
    });

    const replacementCookie = recovery.headers["set-cookie"]?.[0];
    const activity = await owner(request(createApp()).get("/api/owner/activity"))
      .set("Cookie", replacementCookie);

    expect(activity.status).toBe(200);
    expect(activity.body.trustedDevice.replacementBurst).toEqual({
      count: 3,
      threshold: 3,
      windowHours: 24,
      warning: true,
    });
  });

  it("keeps the device replacement successful when its security email fails", async () => {
    database.devices.set(
      OWNER_EMAIL,
      crypto.createHash("sha256").update("trusted-token").digest("hex"),
    );
    email.sendTrustedDeviceReplacementEmail.mockRejectedValueOnce(
      new Error("SMTP unavailable"),
    );

    const response = await owner(request(createApp()).post("/api/owner/device/recover"))
      .send({ confirm: true });

    expect(response.status).toBe(204);
    expect(response.headers["set-cookie"]?.[0]).toContain("gtf_owner_device=");
    await vi.waitFor(() => {
      expect(log.error).toHaveBeenCalledWith(expect.objectContaining({
        msg: "Trusted device replacement notification failed",
        ownerEmail: OWNER_EMAIL,
        replacedAt: "2026-09-17T12:30:00.000Z",
        error: expect.any(Error),
      }));
    });
  });

  it("responds with the replacement cookie without waiting for email delivery", async () => {
    database.devices.set(
      OWNER_EMAIL,
      crypto.createHash("sha256").update("trusted-token").digest("hex"),
    );
    email.sendTrustedDeviceReplacementEmail.mockImplementationOnce(
      () => new Promise(() => {}),
    );

    const recovery = owner(request(createApp()).post("/api/owner/device/recover"))
      .send({ confirm: true });
    const outcome = await Promise.race([
      recovery.then((response) => ({ response })),
      new Promise<{ timedOut: true }>((resolve) => {
        setTimeout(() => resolve({ timedOut: true }), 100);
      }),
    ]);

    expect(outcome).not.toEqual({ timedOut: true });
    if ("response" in outcome) {
      expect(outcome.response.status).toBe(204);
      expect(outcome.response.headers["set-cookie"]?.[0]).toContain("gtf_owner_device=");
    }
  });

  it("does not allow a different authenticated email to recover a device", async () => {
    database.devices.set(OWNER_EMAIL, crypto.createHash("sha256").update("trusted-token").digest("hex"));

    const response = await request(createApp())
      .post("/api/owner/device/recover")
      .set("x-test-user-id", "other-user")
      .set("x-test-email", "other@example.com")
      .send({ confirm: true });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: "Owner access required" });
    expect(database.devices.get(OWNER_EMAIL)).toBe(
      crypto.createHash("sha256").update("trusted-token").digest("hex"),
    );
  });

  it("does not allow signed-out requests to recover a device", async () => {
    const response = await request(createApp())
      .post("/api/owner/device/recover")
      .send({ confirm: true });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Unauthorized" });
  });

  it("accepts public activity ingestion without returning activity data", async () => {
    const response = await request(createApp())
      .post("/api/activity/event")
      .send({
        eventName: "page_viewed",
        path: "/music",
        visitorId: "public-visitor",
        metadata: { source: "navigation" },
      });

    expect(response.status).toBe(204);
    expect(response.text).toBe("");
    expect(database.activityInserts).toBe(1);
    expect(response.body).toEqual({});
  });

  it("rejects excess public activity events without inserting them", async () => {
    const clientAddress = "203.0.113.50";
    const event = {
      eventName: "page_viewed",
      path: "/music",
      visitorId: "limited-visitor",
      metadata: { source: "automated-test" },
    };

    for (let attempt = 0; attempt < 30; attempt += 1) {
      const response = await request(createApp())
        .post("/api/activity/event")
        .set("x-forwarded-for", clientAddress)
        .set("cf-ipcountry", "US")
        .send(event);

      expect(response.status).toBe(204);
    }

    const limitedResponse = await request(createApp())
      .post("/api/activity/event")
      .set("x-forwarded-for", clientAddress)
      .set("cf-ipcountry", "US")
      .send(event);

    expect(limitedResponse.status).toBe(429);
    expect(limitedResponse.body).toEqual({ error: "Activity rate limit exceeded" });
    expect(Number(limitedResponse.headers["retry-after"])).toBeGreaterThan(0);
    expect(database.activityInserts).toBe(30);

    const otherClientResponse = await request(createApp())
      .post("/api/activity/event")
      .set("x-forwarded-for", "203.0.113.51")
      .set("cf-ipcountry", "US")
      .send(event);

    expect(otherClientResponse.status).toBe(204);
    expect(database.activityInserts).toBe(31);
  });
});