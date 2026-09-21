import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const database = vi.hoisted(() => ({
  query: vi.fn(),
}));

vi.mock("pg", () => ({
  Pool: class {
    query = database.query;
  },
}));

vi.mock("@clerk/express", () => ({
  getAuth: (req: express.Request) => ({
    userId: req.header("x-test-user-id") || null,
  }),
}));

vi.mock("../lib/objectStorage", () => ({
  ObjectStorageService: class {},
  ObjectNotFoundError: class extends Error {},
}));

vi.mock("../lib/logger", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

import authorsWorldRouter from "./authors-world";

function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/api", authorsWorldRouter);
  return app;
}

describe("author profile analytics", () => {
  beforeEach(() => {
    database.query.mockReset();
    database.query.mockImplementation(async (sql: string, params: unknown[] = []) => {
      if (sql.includes("CREATE TABLE IF NOT EXISTS authors")) {
        return { rows: [], rowCount: 0 };
      }
      if (sql.includes("SELECT id, slug, display_name")) {
        expect(params).toEqual(["author-user"]);
        return {
          rows: [{ id: 7, slug: "night-signal", display_name: "Night Signal" }],
          rowCount: 1,
        };
      }
      if (sql.includes("AS page_views") && sql.includes("unique_visitors")) {
        expect(params).toEqual(["/author/night-signal"]);
        return { rows: [{ page_views: 12, unique_visitors: 8 }], rowCount: 1 };
      }
      if (sql.includes("TO_CHAR(DATE_TRUNC")) {
        expect(params).toEqual(["/author/night-signal"]);
        return {
          rows: [{ day: "2026-09-20", page_views: 4, visitors: 3 }],
          rowCount: 1,
        };
      }
      if (sql.includes("LIMIT 12") && sql.includes("AS referrer")) {
        expect(params).toEqual(["/author/night-signal"]);
        return { rows: [{ referrer: "direct", count: 7 }], rowCount: 1 };
      }
      if (sql.includes("LIMIT 12") && sql.includes("AS country")) {
        expect(params).toEqual(["/author/night-signal"]);
        return { rows: [{ country: "UA", count: 9 }], rowCount: 1 };
      }
      if (sql.includes("LIMIT 50")) {
        expect(params).toEqual(["/author/night-signal"]);
        return {
          rows: [{
            created_at: "2026-09-20T10:00:00.000Z",
            country: "UA",
            referrer: "direct",
          }],
          rowCount: 1,
        };
      }
      return { rows: [], rowCount: 0 };
    });
  });

  it("requires a signed-in author", async () => {
    const response = await request(createApp()).get("/api/authors-world/me/analytics");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Sign in to view your author statistics" });
    expect(database.query).not.toHaveBeenCalled();
  });

  it("returns only the signed-in author's exact public profile path", async () => {
    const response = await request(createApp())
      .get("/api/authors-world/me/analytics")
      .set("x-test-user-id", "author-user");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      rangeDays: 30,
      author: {
        slug: "night-signal",
        displayName: "Night Signal",
        profilePath: "/author/night-signal",
      },
      summary: { pageViews: 12, uniqueVisitors: 8 },
      daily: [{ day: "2026-09-20", pageViews: 4, visitors: 3 }],
      referrers: [{ referrer: "direct", count: 7 }],
      countries: [{ country: "UA", count: 9 }],
      recentViews: [{
        createdAt: "2026-09-20T10:00:00.000Z",
        country: "UA",
        referrer: "direct",
      }],
    });
  });
});