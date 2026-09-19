import { Router, type Request, type Response } from "express";
import { getAuth } from "@clerk/express";
import { Pool } from "pg";
import { logger } from "../lib/logger";

const router = Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const chatSubscribers = new Set<Response>();

const MAX_CHAT_MESSAGE_LENGTH = 1000;

type PlatformLink = { label: string; url: string };
let schemaReady: Promise<void> | null = null;

function ensureAuthorsWorldSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = pool.query(`
      CREATE TABLE IF NOT EXISTS authors (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        display_name TEXT NOT NULL,
        role TEXT NOT NULL,
        bio TEXT NOT NULL,
        avatar_url TEXT,
        platform_links JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      ALTER TABLE authors ADD COLUMN IF NOT EXISTS avatar_url TEXT;
      ALTER TABLE authors ADD COLUMN IF NOT EXISTS platform_links JSONB NOT NULL DEFAULT '[]'::jsonb;
      ALTER TABLE authors ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
      ALTER TABLE authors ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

      CREATE UNIQUE INDEX IF NOT EXISTS authors_user_id_unique_idx ON authors (user_id);
      CREATE INDEX IF NOT EXISTS authors_display_name_idx ON authors (display_name);
      CREATE INDEX IF NOT EXISTS authors_created_at_idx ON authors (created_at);

      CREATE TABLE IF NOT EXISTS authors_world_chat_messages (
        id SERIAL PRIMARY KEY,
        author_id INTEGER NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
        body TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS authors_world_chat_created_at_idx
        ON authors_world_chat_messages (created_at);
      CREATE INDEX IF NOT EXISTS authors_world_chat_author_id_idx
        ON authors_world_chat_messages (author_id);
    `).then(() => undefined).catch((error) => {
      schemaReady = null;
      throw error;
    });
  }

  return schemaReady;
}

function currentUserId(req: Request): string | null {
  try {
    return getAuth(req).userId ?? null;
  } catch {
    return null;
  }
}

function textField(value: unknown, maxLength?: number): string | null {
  if (typeof value !== "string") return null;
  const result = value.trim();
  if (!result) return null;
  return maxLength === undefined || result.length <= maxLength ? result : null;
}

function normalizeLinks(value: unknown): PlatformLink[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((link) => {
      if (!link || typeof link !== "object") return null;
      const candidate = link as { label?: unknown; url?: unknown };
      const label = textField(candidate.label);
      const url = textField(candidate.url);
      if (!label || !url || !/^https?:\/\//i.test(url)) return null;
      return { label, url };
    })
    .filter((link): link is PlatformLink => Boolean(link));
}

function serializeAuthor(row: Record<string, unknown>) {
  return {
    id: Number(row.id),
    displayName: row.display_name,
    role: row.role,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    platformLinks: Array.isArray(row.platform_links) ? row.platform_links : [],
    createdAt: row.created_at,
  };
}

function broadcastChatMessage(message: unknown) {
  const payload = `data: ${JSON.stringify(message)}\n\n`;
  for (const subscriber of chatSubscribers) {
    try {
      subscriber.write(payload);
    } catch {
      chatSubscribers.delete(subscriber);
    }
  }
}

router.get("/authors-world/authors", async (_req, res) => {
  try {
    await ensureAuthorsWorldSchema();
    const result = await pool.query(`
      SELECT id, display_name, role, bio, avatar_url, platform_links, created_at
      FROM authors
      ORDER BY created_at ASC, id ASC
    `);
    res.json({ authors: result.rows.map(serializeAuthor) });
  } catch (error) {
    logger.error({ msg: "Authors world list failed", error });
    res.status(500).json({ error: "Unable to load authors" });
  }
});

router.get("/authors-world/me", async (req, res) => {
  const userId = currentUserId(req);
  if (!userId) {
    res.json({ author: null });
    return;
  }

  try {
    await ensureAuthorsWorldSchema();
    const result = await pool.query(
      `SELECT id, display_name, role, bio, avatar_url, platform_links, created_at
       FROM authors
       WHERE user_id = $1
       LIMIT 1`,
      [userId],
    );
    res.json({ author: result.rows[0] ? serializeAuthor(result.rows[0]) : null });
  } catch (error) {
    logger.error({ msg: "Current author lookup failed", error });
    res.status(500).json({ error: "Unable to load your author profile" });
  }
});

router.post("/authors-world/me", async (req, res) => {
  const userId = currentUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Sign in to create an author portal" });
    return;
  }

  const displayName = textField(req.body?.displayName);
  const role = textField(req.body?.role);
  const bio = textField(req.body?.bio);
  const avatarUrl = req.body?.avatarUrl
    ? textField(req.body.avatarUrl)
    : null;
  const platformLinks = normalizeLinks(req.body?.platformLinks);

  if (!displayName || !role || !bio) {
    res.status(400).json({ error: "Name, role, and bio are required" });
    return;
  }
  if (avatarUrl && !/^https?:\/\//i.test(avatarUrl)) {
    res.status(400).json({ error: "Avatar URL must use http or https" });
    return;
  }

  try {
    await ensureAuthorsWorldSchema();
    const result = await pool.query(
      `INSERT INTO authors (user_id, display_name, role, bio, avatar_url, platform_links)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)
       ON CONFLICT (user_id)
       DO UPDATE SET
         display_name = EXCLUDED.display_name,
         role = EXCLUDED.role,
         bio = EXCLUDED.bio,
         avatar_url = EXCLUDED.avatar_url,
         platform_links = EXCLUDED.platform_links,
         updated_at = NOW()
       RETURNING id, display_name, role, bio, avatar_url, platform_links, created_at`,
      [userId, displayName, role, bio, avatarUrl, JSON.stringify(platformLinks)],
    );
    res.status(200).json({ author: serializeAuthor(result.rows[0]) });
  } catch (error) {
    logger.error({ msg: "Author profile save failed", error });
    res.status(500).json({ error: "Unable to save your author profile" });
  }
});

router.get("/authors-world/chat", async (req, res) => {
  const requestedLimit = Number(req.query.limit);
  const limit = Number.isInteger(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), 100)
    : 60;

  try {
    await ensureAuthorsWorldSchema();
    const result = await pool.query(
      `SELECT
         messages.id,
         messages.body,
         messages.created_at,
         authors.id AS author_id,
         authors.display_name,
         authors.role,
         authors.avatar_url
       FROM authors_world_chat_messages messages
       JOIN authors ON authors.id = messages.author_id
       ORDER BY messages.created_at DESC, messages.id DESC
       LIMIT $1`,
      [limit],
    );
    res.json({
      messages: result.rows.reverse().map((row) => ({
        id: Number(row.id),
        body: row.body,
        createdAt: row.created_at,
        author: {
          id: Number(row.author_id),
          displayName: row.display_name,
          role: row.role,
          avatarUrl: row.avatar_url,
        },
      })),
    });
  } catch (error) {
    logger.error({ msg: "Authors world chat load failed", error });
    res.status(500).json({ error: "Unable to load the general chat" });
  }
});

router.get("/authors-world/chat/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
  res.write(": connected to the internal authors world network\n\n");
  chatSubscribers.add(res);

  const keepAlive = setInterval(() => {
    res.write(": keep-alive\n\n");
  }, 20_000);

  req.on("close", () => {
    clearInterval(keepAlive);
    chatSubscribers.delete(res);
  });
});

router.post("/authors-world/chat", async (req, res) => {
  const userId = currentUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Sign in and create an author portal to chat" });
    return;
  }

  const body = textField(req.body?.body, MAX_CHAT_MESSAGE_LENGTH);
  if (!body) {
    res.status(400).json({ error: "Message cannot be empty" });
    return;
  }

  try {
    await ensureAuthorsWorldSchema();
    const result = await pool.query(
      `INSERT INTO authors_world_chat_messages (author_id, body)
       SELECT id, $2
       FROM authors
       WHERE user_id = $1
       RETURNING id, body, created_at, author_id`,
      [userId, body],
    );
    const inserted = result.rows[0];
    if (!inserted) {
      res.status(403).json({ error: "Create your author portal before chatting" });
      return;
    }

    const authorResult = await pool.query(
      `SELECT id, display_name, role, avatar_url
       FROM authors
       WHERE id = $1
       LIMIT 1`,
      [inserted.author_id],
    );
    const author = authorResult.rows[0];
    const message = {
      id: Number(inserted.id),
      body: inserted.body,
      createdAt: inserted.created_at,
      author: {
        id: Number(author.id),
        displayName: author.display_name,
        role: author.role,
        avatarUrl: author.avatar_url,
      },
    };
    broadcastChatMessage(message);
    res.status(201).json({ message });
  } catch (error) {
    logger.error({ msg: "Authors world chat send failed", error });
    res.status(500).json({ error: "Unable to send the message" });
  }
});

export default router;