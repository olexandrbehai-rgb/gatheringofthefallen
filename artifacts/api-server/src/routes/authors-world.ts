import { Router, type Request, type Response } from "express";
import { getAuth } from "@clerk/express";
import { Pool } from "pg";
import { logger } from "../lib/logger";

const router = Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const chatSubscribers = new Set<Response>();

const MAX_CHAT_MESSAGE_LENGTH = 1000;

type PlatformLink = { label: string; url: string };
type AuthorCreation = {
  id: number;
  sortOrder: number;
  platform: string;
  kind: string;
  title: string;
  description: string;
  imageUrl: string | null;
  contentUrl: string | null;
  createdAt: unknown;
  updatedAt: unknown;
};

const WORLD_COLUMNS = 4;
const WORLD_CELL_WIDTH = 260;
const WORLD_CELL_HEIGHT = 220;
const WORLD_PADDING_X = 150;
const WORLD_PADDING_Y = 150;
let schemaReady: Promise<void> | null = null;

function worldPositionFor(index: number) {
  return {
    left: WORLD_PADDING_X + (index % WORLD_COLUMNS) * WORLD_CELL_WIDTH,
    top: WORLD_PADDING_Y + Math.floor(index / WORLD_COLUMNS) * WORLD_CELL_HEIGHT,
  };
}

function transliterate(value: string) {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ie",
    ж: "zh", з: "z", и: "y", і: "i", ї: "i", й: "i", к: "k", л: "l",
    м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u",
    ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch", ь: "",
    ю: "iu", я: "ia", ы: "y", э: "e", ё: "io",ъ: "",
  };
  return value
    .toLowerCase()
    .split("")
    .map((character) => map[character] ?? character)
    .join("");
}

function baseSlugFor(displayName: string) {
  const slug = transliterate(displayName)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "author";
}

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
        background_url TEXT,
        platform_links JSONB NOT NULL DEFAULT '[]'::jsonb,
        slug TEXT,
        world_left INTEGER,
        world_top INTEGER,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      ALTER TABLE authors ADD COLUMN IF NOT EXISTS avatar_url TEXT;
      ALTER TABLE authors ADD COLUMN IF NOT EXISTS background_url TEXT;
      ALTER TABLE authors ADD COLUMN IF NOT EXISTS platform_links JSONB NOT NULL DEFAULT '[]'::jsonb;
      ALTER TABLE authors ADD COLUMN IF NOT EXISTS slug TEXT;
      ALTER TABLE authors ADD COLUMN IF NOT EXISTS world_left INTEGER;
      ALTER TABLE authors ADD COLUMN IF NOT EXISTS world_top INTEGER;
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

      CREATE TABLE IF NOT EXISTS author_creations (
        id SERIAL PRIMARY KEY,
        author_id INTEGER NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
        sort_order INTEGER,
        platform TEXT NOT NULL DEFAULT 'other',
        kind TEXT NOT NULL DEFAULT 'card',
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        image_url TEXT,
        content_url TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      ALTER TABLE author_creations ADD COLUMN IF NOT EXISTS platform TEXT NOT NULL DEFAULT 'other';
      ALTER TABLE author_creations ADD COLUMN IF NOT EXISTS sort_order INTEGER;
      ALTER TABLE author_creations ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'card';
      ALTER TABLE author_creations ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';
      ALTER TABLE author_creations ADD COLUMN IF NOT EXISTS image_url TEXT;
      ALTER TABLE author_creations ADD COLUMN IF NOT EXISTS content_url TEXT;
      ALTER TABLE author_creations ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
      ALTER TABLE author_creations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

      CREATE INDEX IF NOT EXISTS authors_world_chat_created_at_idx
        ON authors_world_chat_messages (created_at);
      CREATE INDEX IF NOT EXISTS authors_world_chat_author_id_idx
        ON authors_world_chat_messages (author_id);
      CREATE INDEX IF NOT EXISTS author_creations_author_id_idx
        ON author_creations (author_id);
      CREATE INDEX IF NOT EXISTS author_creations_created_at_idx
        ON author_creations (created_at);
    `).then(async () => {
      const existingAuthors = await pool.query(
        `SELECT id, display_name, slug, world_left, world_top
         FROM authors
         ORDER BY created_at ASC, id ASC`,
      );
      const usedSlugs = new Set<string>();
      for (const [index, author] of existingAuthors.rows.entries()) {
        let slug = typeof author.slug === "string" && author.slug.trim()
          ? author.slug.trim()
          : baseSlugFor(String(author.display_name));
        if (usedSlugs.has(slug)) slug = `${slug}-${Number(author.id)}`;
        usedSlugs.add(slug);
        const position = worldPositionFor(index);
        await pool.query(
          `UPDATE authors
           SET slug = $1,
               world_left = COALESCE(world_left, $2),
               world_top = COALESCE(world_top, $3)
           WHERE id = $4`,
          [slug, position.left, position.top, author.id],
        );
      }
      await pool.query(
        `CREATE UNIQUE INDEX IF NOT EXISTS authors_slug_unique_idx ON authors (slug)`,
      );
      const existingCreations = await pool.query(
        `SELECT id, author_id
         FROM author_creations
         ORDER BY author_id ASC, created_at ASC, id ASC`,
      );
      const nextOrderByAuthor = new Map<number, number>();
      for (const creation of existingCreations.rows) {
        const authorId = Number(creation.author_id);
        const sortOrder = nextOrderByAuthor.get(authorId) ?? 0;
        await pool.query(
          `UPDATE author_creations SET sort_order = $1 WHERE id = $2`,
          [sortOrder, creation.id],
        );
        nextOrderByAuthor.set(authorId, sortOrder + 1);
      }
      await pool.query(
        `CREATE UNIQUE INDEX IF NOT EXISTS author_creations_author_order_unique_idx
         ON author_creations (author_id, sort_order)`,
      );
    }).catch((error) => {
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

function isValidAvatarValue(value: string) {
  if (/^https?:\/\//i.test(value)) return true;
  if (value.length > 1_500_000) return false;
  return /^data:image\/(?:png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/i.test(value);
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
  const fallbackPosition = worldPositionFor(0);
  return {
    id: Number(row.id),
    sortOrder: Number.isFinite(Number(row.sort_order)) ? Number(row.sort_order) : Number(row.id),
    displayName: row.display_name,
    role: row.role,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    backgroundUrl: row.background_url,
    platformLinks: Array.isArray(row.platform_links) ? row.platform_links : [],
    slug: typeof row.slug === "string" && row.slug ? row.slug : `author-${Number(row.id)}`,
    position: {
      left: Number.isFinite(Number(row.world_left)) ? Number(row.world_left) : fallbackPosition.left,
      top: Number.isFinite(Number(row.world_top)) ? Number(row.world_top) : fallbackPosition.top,
    },
    createdAt: row.created_at,
  };
}

function serializeCreation(row: Record<string, unknown>): AuthorCreation {
  return {
    id: Number(row.id),
    sortOrder: Number.isFinite(Number(row.sort_order)) ? Number(row.sort_order) : Number(row.id),
    platform: typeof row.platform === "string" ? row.platform : "other",
    kind: typeof row.kind === "string" ? row.kind : "card",
    title: row.title as string,
    description: typeof row.description === "string" ? row.description : "",
    imageUrl: typeof row.image_url === "string" ? row.image_url : null,
    contentUrl: typeof row.content_url === "string" ? row.content_url : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function creationsForAuthor(authorId: number) {
  const result = await pool.query(
    `SELECT id, sort_order, platform, kind, title, description, image_url, content_url, created_at, updated_at
     FROM author_creations
     WHERE author_id = $1
     ORDER BY sort_order ASC NULLS LAST, created_at ASC, id ASC`,
    [authorId],
  );
  return result.rows.map(serializeCreation);
}

function normalizedOptionalUrl(value: unknown): string | null | "invalid" {
  if (value == null || value === "") return null;
  const url = textField(value);
  if (!url || !/^https?:\/\//i.test(url)) return "invalid";
  return url;
}

function normalizedCreationBody(body: unknown) {
  const candidate = body && typeof body === "object"
    ? body as Record<string, unknown>
    : {};
  const title = textField(candidate.title);
  const description = typeof candidate.description === "string" ? candidate.description.trim() : "";
  const platform = textField(candidate.platform) ?? "other";
  const kind = textField(candidate.kind) ?? "card";
  const imageUrl = normalizedOptionalUrl(candidate.imageUrl);
  const contentUrl = normalizedOptionalUrl(candidate.contentUrl);
  if (!title) return { error: "Title is required" as const };
  if (imageUrl === "invalid" || contentUrl === "invalid") {
    return { error: "Image and content links must use http or https" as const };
  }
  return {
    value: {
      title,
      description,
      platform,
      kind: ["card", "banner", "creation"].includes(kind) ? kind : "card",
      imageUrl,
      contentUrl,
    },
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
      SELECT id, display_name, role, bio, avatar_url, background_url, platform_links, slug, world_left, world_top, created_at
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
      `SELECT id, display_name, role, bio, avatar_url, background_url, platform_links, slug, world_left, world_top, created_at
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
  const backgroundUrl = req.body?.backgroundUrl
    ? textField(req.body.backgroundUrl)
    : null;
  const platformLinks = normalizeLinks(req.body?.platformLinks);

  if (!displayName || !role || !bio) {
    res.status(400).json({ error: "Name, role, and bio are required" });
    return;
  }
  if (avatarUrl && !isValidAvatarValue(avatarUrl)) {
    res.status(400).json({ error: "Avatar must be an http(s) image URL or a compressed PNG, JPEG, or WebP image" });
    return;
  }
  if (backgroundUrl && !isValidAvatarValue(backgroundUrl)) {
    res.status(400).json({ error: "Profile background must be an http(s) image URL or a compressed PNG, JPEG, or WebP image" });
    return;
  }

  try {
    await ensureAuthorsWorldSchema();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const existing = await client.query(
        `SELECT id, slug, world_left, world_top
         FROM authors
         WHERE user_id = $1
         FOR UPDATE`,
        [userId],
      );
      let authorId: number;
      if (existing.rows[0]) {
        authorId = Number(existing.rows[0].id);
        await client.query(
          `UPDATE authors
            SET display_name = $1, role = $2, bio = $3, avatar_url = $4, background_url = $5,
                platform_links = $6::jsonb, updated_at = NOW()
            WHERE id = $7`,
          [displayName, role, bio, avatarUrl, backgroundUrl, JSON.stringify(platformLinks), authorId],
        );
      } else {
        const countResult = await client.query(`SELECT COUNT(*)::int AS count FROM authors`);
        const position = worldPositionFor(Number(countResult.rows[0]?.count ?? 0));
        const baseSlug = baseSlugFor(displayName);
        let slug = baseSlug;
        let suffix = 2;
        while ((await client.query(`SELECT 1 FROM authors WHERE slug = $1 LIMIT 1`, [slug])).rowCount) {
          slug = `${baseSlug}-${suffix}`;
          suffix += 1;
        }
        const inserted = await client.query(
          `INSERT INTO authors
             (user_id, display_name, role, bio, avatar_url, background_url, platform_links, slug, world_left, world_top)
            VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10)
           RETURNING id`,
          [userId, displayName, role, bio, avatarUrl, backgroundUrl, JSON.stringify(platformLinks), slug, position.left, position.top],
        );
        authorId = Number(inserted.rows[0].id);
      }
      const result = await client.query(
        `SELECT id, display_name, role, bio, avatar_url, background_url, platform_links, slug, world_left, world_top, created_at
         FROM authors
         WHERE id = $1`,
        [authorId],
      );
      await client.query("COMMIT");
      res.status(200).json({ author: serializeAuthor(result.rows[0]) });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error({ msg: "Author profile save failed", error });
    res.status(500).json({ error: "Unable to save your author profile" });
  }
});

router.get("/authors-world/author/:slug", async (req, res) => {
  try {
    await ensureAuthorsWorldSchema();
    const result = await pool.query(
      `SELECT id, user_id, display_name, role, bio, avatar_url, background_url, platform_links,
              slug, world_left, world_top, created_at
       FROM authors
       WHERE slug = $1
       LIMIT 1`,
      [req.params.slug],
    );
    const row = result.rows[0];
    if (!row) {
      res.status(404).json({ error: "Author portal not found" });
      return;
    }
    res.json({
      author: serializeAuthor(row),
      creations: await creationsForAuthor(Number(row.id)),
      canEdit: currentUserId(req) === row.user_id,
    });
  } catch (error) {
    logger.error({ msg: "Public author portal load failed", error });
    res.status(500).json({ error: "Unable to load the author portal" });
  }
});

router.post("/authors-world/me/creations", async (req, res) => {
  const userId = currentUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Sign in to publish a creation" });
    return;
  }
  const normalized = normalizedCreationBody(req.body);
  if ("error" in normalized) {
    res.status(400).json({ error: normalized.error });
    return;
  }
  try {
    await ensureAuthorsWorldSchema();
    const result = await pool.query(
      `INSERT INTO author_creations (author_id, sort_order, platform, kind, title, description, image_url, content_url)
       SELECT authors.id,
              (SELECT COALESCE(MAX(existing.sort_order) + 1, 0)
               FROM author_creations existing
               WHERE existing.author_id = authors.id),
              $2, $3, $4, $5, $6, $7
       FROM authors
       WHERE user_id = $1
       RETURNING id, sort_order, platform, kind, title, description, image_url, content_url, created_at, updated_at`,
      [
        userId,
        normalized.value.platform,
        normalized.value.kind,
        normalized.value.title,
        normalized.value.description,
        normalized.value.imageUrl,
        normalized.value.contentUrl,
      ],
    );
    if (!result.rows[0]) {
      res.status(403).json({ error: "Create your author portal before publishing work" });
      return;
    }
    res.status(201).json({ creation: serializeCreation(result.rows[0]) });
  } catch (error) {
    logger.error({ msg: "Author creation publish failed", error });
    res.status(500).json({ error: "Unable to publish this creation" });
  }
});

router.patch("/authors-world/me/creations/:id", async (req, res) => {
  const userId = currentUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Sign in to edit a creation" });
    return;
  }
  const normalized = normalizedCreationBody(req.body);
  if ("error" in normalized) {
    res.status(400).json({ error: normalized.error });
    return;
  }
  try {
    await ensureAuthorsWorldSchema();
    const result = await pool.query(
                 `UPDATE author_creations AS creations
       SET platform = $1, kind = $2, title = $3, description = $4,
           image_url = $5, content_url = $6, updated_at = NOW()
       FROM authors
       WHERE creations.id = $7 AND creations.author_id = authors.id AND authors.user_id = $8
       RETURNING creations.id, creations.platform, creations.kind, creations.title,
                 creations.sort_order, creations.description, creations.image_url, creations.content_url,
                 creations.created_at, creations.updated_at`,
      [
        normalized.value.platform,
        normalized.value.kind,
        normalized.value.title,
        normalized.value.description,
        normalized.value.imageUrl,
        normalized.value.contentUrl,
        Number(req.params.id),
        userId,
      ],
    );
    if (!result.rows[0]) {
      res.status(404).json({ error: "Creation not found or not owned by you" });
      return;
    }
    res.json({ creation: serializeCreation(result.rows[0]) });
  } catch (error) {
    logger.error({ msg: "Author creation update failed", error });
    res.status(500).json({ error: "Unable to update this creation" });
  }
});

router.delete("/authors-world/me/creations/:id", async (req, res) => {
  const userId = currentUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Sign in to delete a creation" });
    return;
  }
  try {
    await ensureAuthorsWorldSchema();
    const result = await pool.query(
      `DELETE FROM author_creations AS creations
       USING authors
       WHERE creations.id = $1 AND creations.author_id = authors.id AND authors.user_id = $2`,
      [Number(req.params.id), userId],
    );
    if (!result.rowCount) {
      res.status(404).json({ error: "Creation not found or not owned by you" });
      return;
    }
    res.status(204).send();
  } catch (error) {
    logger.error({ msg: "Author creation delete failed", error });
    res.status(500).json({ error: "Unable to delete this creation" });
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