import { Router, type Request, type Response } from "express";
import { getAuth } from "@clerk/express";
import { Pool } from "pg";
import { logger } from "../lib/logger";
import { ObjectNotFoundError, ObjectStorageService } from "../lib/objectStorage";

const router = Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const chatSubscribers = new Set<Response>();

const MAX_CHAT_MESSAGE_LENGTH = 1000;
const MAX_MP3_BYTES = 20 * 1024 * 1024;
const MAX_MP3_TRACKS_PER_AUTHOR = 5;
const MAX_MP3_BYTES_PER_AUTHOR = 100 * 1024 * 1024;
const objectStorage = new ObjectStorageService();

class AudioStorageError extends Error {
  constructor(message: string, public readonly statusCode = 400) {
    super(message);
    this.name = "AudioStorageError";
  }
}

type PlatformLink = { label: string; url: string };
type ChatMention = {
  id: number;
  slug: string;
  displayName: string;
};
type AuthorCreation = {
  id: number;
  sortOrder: number;
  platform: string;
  kind: string;
  title: string;
  description: string;
  poem: string;
  links: string;
  imageUrl: string | null;
  contentUrl: string | null;
  audioUrl: string | null;
  audioObjectPath: string | null;
  audioSizeBytes: number | null;
  audioDurationSeconds: number | null;
  position?: { left: number; top: number } | null;
  isHidden?: boolean;
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
        mentions JSONB NOT NULL DEFAULT '[]'::jsonb,
        edited_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      ALTER TABLE authors_world_chat_messages ADD COLUMN IF NOT EXISTS mentions JSONB NOT NULL DEFAULT '[]'::jsonb;
      ALTER TABLE authors_world_chat_messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;

      CREATE TABLE IF NOT EXISTS authors_world_notifications (
        id SERIAL PRIMARY KEY,
        recipient_author_id INTEGER NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
        actor_author_id INTEGER NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
        chat_message_id INTEGER NOT NULL REFERENCES authors_world_chat_messages(id) ON DELETE CASCADE,
        kind TEXT NOT NULL DEFAULT 'chat_mention',
        body TEXT NOT NULL,
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (recipient_author_id, chat_message_id, kind)
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
        memory_poem TEXT,
        memory_links TEXT,
        world_left INTEGER,
        world_top INTEGER,
        is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      ALTER TABLE author_creations ADD COLUMN IF NOT EXISTS platform TEXT NOT NULL DEFAULT 'other';
      ALTER TABLE author_creations ADD COLUMN IF NOT EXISTS sort_order INTEGER;
      ALTER TABLE author_creations ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'card';
      ALTER TABLE author_creations ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';
      ALTER TABLE author_creations ADD COLUMN IF NOT EXISTS image_url TEXT;
      ALTER TABLE author_creations ADD COLUMN IF NOT EXISTS content_url TEXT;
      ALTER TABLE author_creations ADD COLUMN IF NOT EXISTS memory_poem TEXT;
      ALTER TABLE author_creations ADD COLUMN IF NOT EXISTS memory_links TEXT;
      ALTER TABLE author_creations ADD COLUMN IF NOT EXISTS world_left INTEGER;
      ALTER TABLE author_creations ADD COLUMN IF NOT EXISTS world_top INTEGER;
      ALTER TABLE author_creations ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE author_creations ADD COLUMN IF NOT EXISTS audio_object_path TEXT;
      ALTER TABLE author_creations ADD COLUMN IF NOT EXISTS audio_size_bytes INTEGER;
      ALTER TABLE author_creations ADD COLUMN IF NOT EXISTS audio_duration_seconds REAL;
      ALTER TABLE author_creations ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
      ALTER TABLE author_creations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

      CREATE TABLE IF NOT EXISTS author_audio_uploads (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        object_path TEXT NOT NULL UNIQUE,
        original_name TEXT NOT NULL,
        size_bytes INTEGER NOT NULL,
        content_type TEXT NOT NULL,
        consumed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS authors_world_chat_created_at_idx
        ON authors_world_chat_messages (created_at);
      CREATE INDEX IF NOT EXISTS authors_world_chat_author_id_idx
        ON authors_world_chat_messages (author_id);
      CREATE INDEX IF NOT EXISTS authors_world_notifications_recipient_idx
        ON authors_world_notifications (recipient_author_id, is_read, created_at DESC);
      CREATE INDEX IF NOT EXISTS author_creations_author_id_idx
        ON author_creations (author_id);
      CREATE INDEX IF NOT EXISTS author_creations_created_at_idx
        ON author_creations (created_at);
      CREATE INDEX IF NOT EXISTS author_audio_uploads_user_id_idx
        ON author_audio_uploads (user_id);
      CREATE UNIQUE INDEX IF NOT EXISTS author_creations_audio_object_path_unique_idx
        ON author_creations (audio_object_path)
        WHERE audio_object_path IS NOT NULL;
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

function chatMentionSlugs(body: string): string[] {
  const slugs = new Set<string>();
  const pattern = /(^|[^\p{L}\p{N}_])@([a-z0-9]+(?:-[a-z0-9]+)*)\b/giu;
  for (const match of body.matchAll(pattern)) {
    const slug = match[2]?.toLowerCase();
    if (slug) slugs.add(slug);
  }
  return [...slugs];
}

function serializeChatMentions(value: unknown): ChatMention[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const candidate = item as Record<string, unknown>;
    const id = Number(candidate.id);
    const slug = typeof candidate.slug === "string" ? candidate.slug : "";
    const displayName = typeof candidate.displayName === "string" ? candidate.displayName : "";
    return Number.isInteger(id) && slug && displayName
      ? [{ id, slug, displayName }]
      : [];
  });
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
    memories: Array.isArray(row.memory_nodes)
      ? row.memory_nodes.map((memory) => {
        const value = memory as Record<string, unknown>;
        return {
          id: Number(value.id),
          title: typeof value.title === "string" ? value.title : "Memory",
          description: typeof value.description === "string" ? value.description : "",
          poem: typeof value.memory_poem === "string" ? value.memory_poem : "",
          links: typeof value.memory_links === "string" ? value.memory_links : "",
          imageUrl: typeof value.image_url === "string" ? value.image_url : null,
          createdAt: value.created_at,
        };
      })
      : [],
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
    poem: typeof row.memory_poem === "string" ? row.memory_poem : "",
    links: typeof row.memory_links === "string" ? row.memory_links : "",
    imageUrl: typeof row.image_url === "string" ? row.image_url : null,
    contentUrl: typeof row.content_url === "string" ? row.content_url : null,
    audioUrl: typeof row.audio_object_path === "string"
      ? `/api/authors-world/creations/${Number(row.id)}/audio`
      : null,
    audioObjectPath: typeof row.audio_object_path === "string" ? row.audio_object_path : null,
    audioSizeBytes: Number.isFinite(Number(row.audio_size_bytes)) ? Number(row.audio_size_bytes) : null,
    audioDurationSeconds: Number.isFinite(Number(row.audio_duration_seconds)) ? Number(row.audio_duration_seconds) : null,
    position: Number.isFinite(Number(row.world_left)) && Number.isFinite(Number(row.world_top))
      ? { left: Number(row.world_left), top: Number(row.world_top) }
      : null,
    isHidden: row.is_hidden === true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function creationsForAuthor(authorId: number, includeHidden = false) {
  const result = await pool.query(
    `SELECT id, sort_order, platform, kind, title, description, image_url, content_url,
            memory_poem, memory_links, world_left, world_top, is_hidden, audio_object_path, audio_size_bytes, audio_duration_seconds, created_at, updated_at
     FROM author_creations
     WHERE author_id = $1
       AND ($2::boolean OR kind <> 'memory' OR is_hidden = FALSE)
     ORDER BY sort_order ASC NULLS LAST, created_at ASC, id ASC`,
    [authorId, includeHidden],
  );
  return result.rows.map(serializeCreation);
}

function normalizedOptionalUrl(value: unknown): string | null | "invalid" {
  if (value == null || value === "") return null;
  const url = textField(value);
  if (!url || !/^https?:\/\//i.test(url)) return "invalid";
  return url;
}

function normalizedOptionalImage(value: unknown): string | null | "invalid" {
  if (value == null || value === "") return null;
  const image = textField(value);
  if (!image) return "invalid";
  if (/^https?:\/\//i.test(image)) return image;
  return isValidAvatarValue(image) ? image : "invalid";
}

function normalizedCreationBody(body: unknown) {
  const candidate = body && typeof body === "object"
    ? body as Record<string, unknown>
    : {};
  const title = textField(candidate.title);
  const description = typeof candidate.description === "string" ? candidate.description.trim() : "";
  const poem = typeof candidate.poem === "string" ? candidate.poem.trim() : "";
  const rawLinks = typeof candidate.links === "string" ? candidate.links.trim() : "";
  const platform = textField(candidate.platform) ?? "other";
  const kind = textField(candidate.kind) ?? "card";
  const imageUrl = normalizedOptionalImage(candidate.imageUrl);
  const contentUrl = normalizedOptionalUrl(candidate.contentUrl);
  const audioObjectPath = textField(candidate.audioObjectPath);
  const isHidden = candidate.hidden === true;
  const audioDurationSeconds = typeof candidate.audioDurationSeconds === "number"
    && Number.isFinite(candidate.audioDurationSeconds)
    && candidate.audioDurationSeconds >= 0
    && candidate.audioDurationSeconds <= 60 * 60 * 4
    ? candidate.audioDurationSeconds
    : null;
  if (!title) return { error: "Title is required" as const };
  if (imageUrl === "invalid" || contentUrl === "invalid") {
    return { error: "Image must be an http(s) link or a compressed image, and content links must use http(s)" as const };
  }
  if (poem.length > 12_000) {
    return { error: "The poem must be no longer than 12,000 characters" as const };
  }
  const links = rawLinks
    ? rawLinks.split(/\r?\n/).map((link) => link.trim()).filter(Boolean)
    : [];
  if (links.length > 20 || links.some((link) => !/^https?:\/\/\S+$/i.test(link))) {
    return { error: "Memory links must be http(s) URLs, one per line, with a maximum of 20 links" as const };
  }
  const normalizedMemoryLinks = links.length > 0 ? links.join("\n") : null;
  if (audioObjectPath && !/^\/objects\/uploads\/[a-z0-9-]+$/i.test(audioObjectPath)) {
    return { error: "Audio upload path is invalid" as const };
  }
  if (kind === "memory" && !description) {
    return { error: "A memory needs a story or description" as const };
  }
  if (kind !== "memory" && !audioObjectPath && !contentUrl) {
    return { error: "Add an MP3 file or a content link" as const };
  }
  return {
    value: {
      title,
      description,
      poem: kind === "memory" ? poem : null,
      links: kind === "memory" ? normalizedMemoryLinks : null,
      platform,
      kind: ["card", "banner", "creation", "memory"].includes(kind) ? kind : "card",
      imageUrl,
      contentUrl,
      audioObjectPath,
      audioDurationSeconds,
      isHidden,
    },
  };
}

async function resolveAudioForSave(
  userId: string,
  audioObjectPath: string | null,
  existingAudioObjectPath: string | null = null,
) {
  if (!audioObjectPath) {
    return { objectPath: null, sizeBytes: null };
  }
  if (audioObjectPath === existingAudioObjectPath) {
    try {
      const { metadata } = await audioFileAndMetadata(audioObjectPath);
      return { objectPath: audioObjectPath, sizeBytes: Number(metadata.size ?? 0) };
    } catch {
      throw new AudioStorageError("The existing MP3 file is no longer available", 404);
    }
  }

  const pending = await pool.query(
    `SELECT object_path, size_bytes, content_type
     FROM author_audio_uploads
     WHERE object_path = $1 AND user_id = $2 AND consumed_at IS NULL
     LIMIT 1`,
    [audioObjectPath, userId],
  );
  if (!pending.rows[0]) {
    throw new AudioStorageError("Upload this MP3 from the current author portal before saving");
  }

  try {
    const { file, metadata } = await audioFileAndMetadata(audioObjectPath);
    const sizeBytes = Number(metadata.size ?? pending.rows[0].size_bytes);
    const contentType = String(metadata.contentType ?? pending.rows[0].content_type);
    if (!Number.isFinite(sizeBytes) || sizeBytes <= 0 || sizeBytes > MAX_MP3_BYTES) {
      throw new AudioStorageError("MP3 must be smaller than 20 MB", 413);
    }
    if (!["audio/mpeg", "audio/mp3", "application/octet-stream"].includes(contentType)) {
      throw new AudioStorageError("Only MP3 audio files are allowed");
    }
    if (!(await hasMp3Header(file))) {
      throw new AudioStorageError("The uploaded file is not a valid MP3");
    }
    await objectStorage.trySetObjectEntityAclPolicy(audioObjectPath, {
      owner: userId,
      visibility: "public",
    });
    return { objectPath: audioObjectPath, sizeBytes, file };
  } catch (error) {
    if (error instanceof AudioStorageError) throw error;
    if (error instanceof ObjectNotFoundError) {
      throw new AudioStorageError("Uploaded MP3 was not found", 404);
    }
    throw error;
  }
}

async function hasMp3Header(file: Awaited<ReturnType<typeof objectStorage.getObjectEntityFile>>) {
  const chunks: Buffer[] = [];
  for await (const chunk of file.createReadStream({ start: 0, end: 3 })) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const header = Buffer.concat(chunks);
  if (header.length >= 3 && header.toString("ascii", 0, 3) === "ID3") return true;
  return header.length >= 2 && header[0] === 0xff && (header[1] & 0xe0) === 0xe0;
}

async function audioFileAndMetadata(objectPath: string) {
  const file = await objectStorage.getObjectEntityFile(objectPath);
  const [metadata] = await file.getMetadata();
  return { file, metadata };
}

async function deleteAudioObject(objectPath: string) {
  try {
    const file = await objectStorage.getObjectEntityFile(objectPath);
    await file.delete();
  } catch (error) {
    if (!(error instanceof ObjectNotFoundError)) throw error;
  }
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

function serializeChatMessage(row: Record<string, unknown>) {
  return {
    id: Number(row.id),
    body: row.body,
    createdAt: row.created_at,
    editedAt: row.edited_at ?? null,
    mentions: serializeChatMentions(row.mentions),
    author: {
      id: Number(row.author_id),
      slug: row.slug,
      displayName: row.display_name,
      role: row.role,
      avatarUrl: row.avatar_url,
    },
  };
}

async function chatMessageById(id: number) {
  const result = await pool.query(
    `SELECT messages.id, messages.body, messages.created_at, messages.edited_at, messages.mentions,
            authors.id AS author_id, authors.slug, authors.display_name, authors.role, authors.avatar_url
     FROM authors_world_chat_messages messages
     JOIN authors ON authors.id = messages.author_id
     WHERE messages.id = $1
     LIMIT 1`,
    [id],
  );
  return result.rows[0] ? serializeChatMessage(result.rows[0]) : null;
}

router.get("/authors-world/authors", async (_req, res) => {
  try {
    await ensureAuthorsWorldSchema();
    const result = await pool.query(`
      SELECT id, display_name, role, bio, avatar_url, background_url, platform_links, slug, world_left, world_top, created_at,
             COALESCE((
               SELECT json_agg(json_build_object(
                 'id', memories.id,
                 'title', memories.title,
                  'description', memories.description,
                  'memory_poem', memories.memory_poem,
                  'memory_links', memories.memory_links,
                  'image_url', memories.image_url,
                 'created_at', memories.created_at
               ) ORDER BY memories.sort_order ASC NULLS LAST, memories.created_at ASC, memories.id ASC)
               FROM author_creations memories
                WHERE memories.author_id = authors.id AND memories.kind = 'memory' AND memories.is_hidden = FALSE
             ), '[]'::json) AS memory_nodes
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
      `SELECT id, display_name, role, bio, avatar_url, background_url, platform_links, slug, world_left, world_top, created_at,
              COALESCE((
                SELECT json_agg(json_build_object(
                  'id', memories.id,
                  'title', memories.title,
                  'description', memories.description,
                  'memory_poem', memories.memory_poem,
                  'memory_links', memories.memory_links,
                  'image_url', memories.image_url,
                  'created_at', memories.created_at
                ) ORDER BY memories.sort_order ASC NULLS LAST, memories.created_at ASC, memories.id ASC)
                FROM author_creations memories
                WHERE memories.author_id = authors.id AND memories.kind = 'memory' AND memories.is_hidden = FALSE
              ), '[]'::json) AS memory_nodes
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

router.get("/authors-world/me/analytics", async (req, res) => {
  const userId = currentUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Sign in to view your author statistics" });
    return;
  }

  try {
    await ensureAuthorsWorldSchema();
    const authorResult = await pool.query(
      `SELECT id, slug, display_name
       FROM authors
       WHERE user_id = $1
       LIMIT 1`,
      [userId],
    );
    const author = authorResult.rows[0];
    if (!author) {
      res.status(404).json({ error: "Create an author portal before viewing its statistics" });
      return;
    }

    const slug = typeof author.slug === "string" && author.slug
      ? author.slug
      : `author-${Number(author.id)}`;
    const profilePath = `/author/${slug}`;
    const [
      summaryResult,
      dailyResult,
      referrerResult,
      countryResult,
      recentResult,
    ] = await Promise.all([
      pool.query(
        `SELECT
           COUNT(*)::int AS page_views,
           COUNT(DISTINCT NULLIF(visitor_id, ''))::int AS unique_visitors
         FROM activity_events
         WHERE event_name = 'page_viewed'
           AND path = $1
           AND created_at >= NOW() - INTERVAL '30 days'`,
        [profilePath],
      ),
      pool.query(
        `SELECT TO_CHAR(DATE_TRUNC('day', created_at), 'YYYY-MM-DD') AS day,
                COUNT(*)::int AS page_views,
                COUNT(DISTINCT NULLIF(visitor_id, ''))::int AS visitors
         FROM activity_events
         WHERE event_name = 'page_viewed'
           AND path = $1
           AND created_at >= NOW() - INTERVAL '30 days'
         GROUP BY DATE_TRUNC('day', created_at)
         ORDER BY day ASC`,
        [profilePath],
      ),
      pool.query(
        `SELECT COALESCE(NULLIF(metadata->>'referrer', ''), 'direct') AS referrer,
                COUNT(*)::int AS count
         FROM activity_events
         WHERE event_name = 'page_viewed'
           AND path = $1
           AND created_at >= NOW() - INTERVAL '30 days'
         GROUP BY COALESCE(NULLIF(metadata->>'referrer', ''), 'direct')
         ORDER BY count DESC, referrer ASC
         LIMIT 12`,
        [profilePath],
      ),
      pool.query(
        `SELECT COALESCE(NULLIF(metadata->>'country', ''), 'unknown') AS country,
                COUNT(*)::int AS count
         FROM activity_events
         WHERE event_name = 'page_viewed'
           AND path = $1
           AND created_at >= NOW() - INTERVAL '30 days'
         GROUP BY COALESCE(NULLIF(metadata->>'country', ''), 'unknown')
         ORDER BY count DESC, country ASC
         LIMIT 12`,
        [profilePath],
      ),
      pool.query(
        `SELECT created_at,
                COALESCE(NULLIF(metadata->>'country', ''), 'unknown') AS country,
                COALESCE(NULLIF(metadata->>'referrer', ''), 'direct') AS referrer
         FROM activity_events
         WHERE event_name = 'page_viewed'
           AND path = $1
         ORDER BY created_at DESC
         LIMIT 50`,
        [profilePath],
      ),
    ]);

    res.json({
      rangeDays: 30,
      author: {
        slug,
        displayName: author.display_name,
        profilePath,
      },
      summary: {
        pageViews: Number(summaryResult.rows[0]?.page_views ?? 0),
        uniqueVisitors: Number(summaryResult.rows[0]?.unique_visitors ?? 0),
      },
      daily: dailyResult.rows.map((row) => ({
        day: row.day,
        pageViews: Number(row.page_views ?? 0),
        visitors: Number(row.visitors ?? 0),
      })),
      referrers: referrerResult.rows.map((row) => ({
        referrer: row.referrer,
        count: Number(row.count ?? 0),
      })),
      countries: countryResult.rows.map((row) => ({
        country: row.country,
        count: Number(row.count ?? 0),
      })),
      recentViews: recentResult.rows.map((row) => ({
        createdAt: row.created_at,
        country: row.country,
        referrer: row.referrer,
      })),
    });
  } catch (error) {
    logger.error({ msg: "Author activity query failed", error });
    res.status(500).json({ error: "Unable to load author statistics" });
  }
});

router.get("/authors-world/author/:slug", async (req, res) => {
  try {
    await ensureAuthorsWorldSchema();
    const result = await pool.query(
      `SELECT id, user_id, display_name, role, bio, avatar_url, background_url, platform_links,
             slug, world_left, world_top, created_at,
             COALESCE((
               SELECT json_agg(json_build_object(
                 'id', memories.id,
                 'title', memories.title,
                  'description', memories.description,
                  'memory_poem', memories.memory_poem,
                  'memory_links', memories.memory_links,
                  'image_url', memories.image_url,
                 'created_at', memories.created_at
               ) ORDER BY memories.sort_order ASC NULLS LAST, memories.created_at ASC, memories.id ASC)
               FROM author_creations memories
                WHERE memories.author_id = authors.id AND memories.kind = 'memory' AND memories.is_hidden = FALSE
             ), '[]'::json) AS memory_nodes
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
       creations: await creationsForAuthor(Number(row.id), currentUserId(req) === row.user_id),
       canEdit: currentUserId(req) === row.user_id,
    });
  } catch (error) {
    logger.error({ msg: "Public author portal load failed", error });
    res.status(500).json({ error: "Unable to load the author portal" });
  }
});

router.post("/authors-world/me/audio/upload-url", async (req, res) => {
  const userId = currentUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Sign in to upload an MP3" });
    return;
  }

  const name = textField(req.body?.name);
  const size = Number(req.body?.size);
  const contentType = typeof req.body?.contentType === "string"
    ? req.body.contentType.toLowerCase()
    : "";
  const creationId = Number.isInteger(Number(req.body?.creationId))
    ? Number(req.body.creationId)
    : null;

  if (!name || !/\.mp3$/i.test(name) || !Number.isInteger(size) || size <= 0 || size > MAX_MP3_BYTES) {
    res.status(413).json({ error: "Choose an MP3 file smaller than 20 MB" });
    return;
  }
  if (contentType && !["audio/mpeg", "audio/mp3", "application/octet-stream"].includes(contentType)) {
    res.status(415).json({ error: "Only MP3 audio files are allowed" });
    return;
  }

  try {
    await ensureAuthorsWorldSchema();
    const authorResult = await pool.query(
      `SELECT authors.id
       FROM authors
       WHERE authors.user_id = $1
       LIMIT 1`,
      [userId],
    );
    if (!authorResult.rows[0]) {
      res.status(403).json({ error: "Create your author portal before uploading music" });
      return;
    }

    if (creationId !== null) {
      const ownedCreation = await pool.query(
        `SELECT creations.id
         FROM author_creations creations
         JOIN authors ON authors.id = creations.author_id
         WHERE creations.id = $1 AND authors.user_id = $2
         LIMIT 1`,
        [creationId, userId],
      );
      if (!ownedCreation.rows[0]) {
        res.status(404).json({ error: "Creation not found or not owned by you" });
        return;
      }
    }

    const usage = await pool.query(
      `SELECT
         COUNT(*)::int AS track_count,
         COALESCE(SUM(audio_size_bytes), 0)::bigint AS total_bytes
       FROM author_creations
       WHERE author_id = $1
         AND audio_object_path IS NOT NULL
         AND ($2::int IS NULL OR id <> $2)`,
      [Number(authorResult.rows[0].id), creationId],
    );
    const trackCount = Number(usage.rows[0]?.track_count ?? 0);
    const totalBytes = Number(usage.rows[0]?.total_bytes ?? 0);
    if (trackCount >= MAX_MP3_TRACKS_PER_AUTHOR) {
      res.status(413).json({ error: "You can publish up to 5 MP3 tracks in one author portal" });
      return;
    }
    if (totalBytes + size > MAX_MP3_BYTES_PER_AUTHOR) {
      res.status(413).json({ error: "Your author portal has reached its 100 MB MP3 storage limit" });
      return;
    }

    const uploadURL = await objectStorage.getObjectEntityUploadURL();
    const objectPath = objectStorage.normalizeObjectEntityPath(uploadURL);
    await pool.query(
      `INSERT INTO author_audio_uploads
         (user_id, object_path, original_name, size_bytes, content_type)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, objectPath, name, size, contentType || "audio/mpeg"],
    );
    res.json({ uploadURL, objectPath, maxBytes: MAX_MP3_BYTES });
  } catch (error) {
    logger.error({ msg: "MP3 upload URL request failed", error });
    res.status(500).json({ error: "Unable to prepare MP3 upload" });
  }
});

router.get("/authors-world/creations/:id/audio", async (req, res) => {
  try {
    await ensureAuthorsWorldSchema();
    const result = await pool.query(
      `SELECT audio_object_path
       FROM author_creations
       WHERE id = $1 AND audio_object_path IS NOT NULL
       LIMIT 1`,
      [Number(req.params.id)],
    );
    const objectPath = result.rows[0]?.audio_object_path;
    if (typeof objectPath !== "string") {
      res.status(404).json({ error: "MP3 not found" });
      return;
    }

    const { file, metadata } = await audioFileAndMetadata(objectPath);
    const size = Number(metadata.size ?? 0);
    const rangeHeader = req.headers.range;
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.setHeader("Content-Disposition", "inline");

    if (!rangeHeader) {
      res.setHeader("Content-Length", size);
      file.createReadStream().on("error", (error) => {
        logger.error({ msg: "MP3 stream failed", error });
        if (!res.headersSent) res.status(500).end();
      }).pipe(res);
      return;
    }

    const match = /^bytes=(\d*)-(\d*)$/i.exec(rangeHeader);
    if (!match) {
      res.status(416).setHeader("Content-Range", `bytes */${size}`).end();
      return;
    }
    const start = match[1] ? Number(match[1]) : Math.max(size - Number(match[2] || 0), 0);
    const requestedEnd = match[2] ? Number(match[2]) : size - 1;
    const end = Math.min(requestedEnd, size - 1);
    if (!Number.isFinite(start) || start < 0 || start > end || start >= size) {
      res.status(416).setHeader("Content-Range", `bytes */${size}`).end();
      return;
    }
    res.status(206);
    res.setHeader("Content-Range", `bytes ${start}-${end}/${size}`);
    res.setHeader("Content-Length", end - start + 1);
    file.createReadStream({ start, end }).on("error", (error) => {
      logger.error({ msg: "MP3 range stream failed", error });
      if (!res.headersSent) res.status(500).end();
    }).pipe(res);
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      res.status(404).json({ error: "MP3 not found" });
      return;
    }
    logger.error({ msg: "Public MP3 stream failed", error });
    res.status(500).json({ error: "Unable to stream this MP3" });
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
    const author = await pool.query(
      `SELECT id FROM authors WHERE user_id = $1 LIMIT 1`,
      [userId],
    );
    if (!author.rows[0]) {
      res.status(403).json({ error: "Create your author portal before publishing work" });
      return;
    }
    const audio = await resolveAudioForSave(userId, normalized.value.audioObjectPath);
    const result = await pool.query(
      `INSERT INTO author_creations
         (author_id, sort_order, platform, kind, title, description, image_url, content_url,
            memory_poem, memory_links, is_hidden, audio_object_path, audio_size_bytes, audio_duration_seconds)
       SELECT authors.id,
              (SELECT COALESCE(MAX(existing.sort_order) + 1, 0)
               FROM author_creations existing
               WHERE existing.author_id = authors.id),
                 $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
       FROM authors
       WHERE user_id = $1
       RETURNING id, sort_order, platform, kind, title, description, image_url, content_url,
                   memory_poem, memory_links, is_hidden, audio_object_path, audio_size_bytes, audio_duration_seconds, created_at, updated_at`,
      [
        userId,
        normalized.value.platform,
        normalized.value.kind,
        normalized.value.title,
        normalized.value.description,
        normalized.value.imageUrl,
        normalized.value.contentUrl,
         normalized.value.poem,
         normalized.value.links,
         normalized.value.isHidden,
        audio.objectPath,
        audio.sizeBytes,
        normalized.value.audioDurationSeconds,
      ],
    );
    if (!result.rows[0]) {
      res.status(403).json({ error: "Create your author portal before publishing work" });
      return;
    }
    if (normalized.value.audioObjectPath) {
      await pool.query(
        `UPDATE author_audio_uploads
         SET consumed_at = NOW()
         WHERE object_path = $1 AND user_id = $2`,
        [normalized.value.audioObjectPath, userId],
      );
    }
    res.status(201).json({ creation: serializeCreation(result.rows[0]) });
  } catch (error) {
    if (error instanceof AudioStorageError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
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
    const existing = await pool.query(
      `SELECT creations.audio_object_path
       FROM author_creations creations
       JOIN authors ON authors.id = creations.author_id
       WHERE creations.id = $1 AND authors.user_id = $2
       LIMIT 1`,
      [Number(req.params.id), userId],
    );
    if (!existing.rows[0]) {
      res.status(404).json({ error: "Creation not found or not owned by you" });
      return;
    }
    const existingAudioObjectPath = typeof existing.rows[0].audio_object_path === "string"
      ? existing.rows[0].audio_object_path
      : null;
    const audio = await resolveAudioForSave(
      userId,
      normalized.value.audioObjectPath,
      existingAudioObjectPath,
    );
    const result = await pool.query(
      `UPDATE author_creations AS creations
       SET platform = $1, kind = $2, title = $3, description = $4,
           image_url = $5, content_url = $6, memory_poem = $7, memory_links = $8,
           is_hidden = $9, audio_object_path = $10, audio_size_bytes = $11,
           audio_duration_seconds = $12, updated_at = NOW()
       FROM authors
       WHERE creations.id = $13 AND creations.author_id = authors.id AND authors.user_id = $14
       RETURNING creations.id, creations.platform, creations.kind, creations.title,
                  creations.sort_order, creations.description, creations.image_url, creations.content_url,
                  creations.memory_poem, creations.memory_links, creations.is_hidden, creations.audio_object_path,
                  creations.audio_size_bytes, creations.audio_duration_seconds,
                 creations.created_at, creations.updated_at`,
      [
        normalized.value.platform,
        normalized.value.kind,
        normalized.value.title,
        normalized.value.description,
        normalized.value.imageUrl,
        normalized.value.contentUrl,
         normalized.value.poem,
         normalized.value.links,
         normalized.value.isHidden,
        audio.objectPath,
        audio.sizeBytes,
        normalized.value.audioDurationSeconds,
        Number(req.params.id),
        userId,
      ],
    );
    if (!result.rows[0]) {
      res.status(404).json({ error: "Creation not found or not owned by you" });
      return;
    }
    if (normalized.value.audioObjectPath && normalized.value.audioObjectPath !== existingAudioObjectPath) {
      await pool.query(
        `UPDATE author_audio_uploads
         SET consumed_at = NOW()
         WHERE object_path = $1 AND user_id = $2`,
        [normalized.value.audioObjectPath, userId],
      );
    }
    if (existingAudioObjectPath && existingAudioObjectPath !== audio.objectPath) {
      await deleteAudioObject(existingAudioObjectPath);
    }
    res.json({ creation: serializeCreation(result.rows[0]) });
  } catch (error) {
    if (error instanceof AudioStorageError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
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
    const existing = await pool.query(
      `SELECT creations.audio_object_path
       FROM author_creations creations
       JOIN authors ON authors.id = creations.author_id
       WHERE creations.id = $1 AND authors.user_id = $2
       LIMIT 1`,
      [Number(req.params.id), userId],
    );
    if (!existing.rows[0]) {
      res.status(404).json({ error: "Creation not found or not owned by you" });
      return;
    }
    const audioObjectPath = typeof existing.rows[0].audio_object_path === "string"
      ? existing.rows[0].audio_object_path
      : null;
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
    if (audioObjectPath) {
      await deleteAudioObject(audioObjectPath);
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
         messages.edited_at,
         messages.mentions,
         authors.id AS author_id,
         authors.slug,
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
      messages: result.rows.reverse().map(serializeChatMessage),
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
    const ownAuthorResult = await pool.query(
      `SELECT id FROM authors WHERE user_id = $1 LIMIT 1`,
      [userId],
    );
    const ownAuthorId = ownAuthorResult.rows[0] ? Number(ownAuthorResult.rows[0].id) : null;
    if (!ownAuthorId) {
      res.status(403).json({ error: "Create your author portal before chatting" });
      return;
    }

    const slugs = chatMentionSlugs(body);
    const mentionsResult = slugs.length > 0
      ? await pool.query(
        `SELECT id, slug, display_name
         FROM authors
         WHERE slug = ANY($1::text[])`,
        [slugs],
      )
      : { rows: [] };
    const mentions = mentionsResult.rows.map((row) => ({
      id: Number(row.id),
      slug: String(row.slug),
      displayName: String(row.display_name),
    })) satisfies ChatMention[];

    const client = await pool.connect();
    let insertedId: number;
    try {
      await client.query("BEGIN");
      const result = await client.query(
        `INSERT INTO authors_world_chat_messages (author_id, body, mentions)
         VALUES ($1, $2, $3::jsonb)
         RETURNING id`,
        [ownAuthorId, body, JSON.stringify(mentions)],
      );
      insertedId = Number(result.rows[0].id);
      for (const mention of mentions) {
        if (mention.id === ownAuthorId) continue;
        await client.query(
          `INSERT INTO authors_world_notifications
             (recipient_author_id, actor_author_id, chat_message_id, kind, body)
           VALUES ($1, $2, $3, 'chat_mention', $4)
           ON CONFLICT (recipient_author_id, chat_message_id, kind) DO NOTHING`,
          [mention.id, ownAuthorId, insertedId, body],
        );
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }

    const message = await chatMessageById(insertedId);
    if (!message) {
      res.status(500).json({ error: "The message was created but could not be loaded" });
      return;
    }
    broadcastChatMessage(message);
    res.status(201).json({ message });
  } catch (error) {
    logger.error({ msg: "Authors world chat send failed", error });
    res.status(500).json({ error: "Unable to send the message" });
  }
});

router.patch("/authors-world/chat/:id", async (req, res) => {
  const userId = currentUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Sign in to edit your message" });
    return;
  }

  const messageId = Number(req.params.id);
  const body = textField(req.body?.body, MAX_CHAT_MESSAGE_LENGTH);
  if (!Number.isInteger(messageId) || messageId < 1 || !body) {
    res.status(400).json({ error: "Message cannot be empty" });
    return;
  }

  try {
    await ensureAuthorsWorldSchema();
    const ownerResult = await pool.query(
      `SELECT messages.author_id
       FROM authors_world_chat_messages messages
       JOIN authors ON authors.id = messages.author_id
       WHERE messages.id = $1 AND authors.user_id = $2
       LIMIT 1`,
      [messageId, userId],
    );
    if (!ownerResult.rows[0]) {
      res.status(404).json({ error: "Message not found or not owned by you" });
      return;
    }

    const ownAuthorId = Number(ownerResult.rows[0].author_id);
    const slugs = chatMentionSlugs(body);
    const mentionsResult = slugs.length > 0
      ? await pool.query(
        `SELECT id, slug, display_name
         FROM authors
         WHERE slug = ANY($1::text[])`,
        [slugs],
      )
      : { rows: [] };
    const mentions = mentionsResult.rows.map((row) => ({
      id: Number(row.id),
      slug: String(row.slug),
      displayName: String(row.display_name),
    })) satisfies ChatMention[];

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const updated = await client.query(
        `UPDATE authors_world_chat_messages
         SET body = $1, mentions = $2::jsonb, edited_at = NOW()
         WHERE id = $3 AND author_id = $4
         RETURNING id`,
        [body, JSON.stringify(mentions), messageId, ownAuthorId],
      );
      if (!updated.rows[0]) {
        await client.query("ROLLBACK");
        res.status(404).json({ error: "Message not found or not owned by you" });
        return;
      }
      await client.query(
        `DELETE FROM authors_world_notifications WHERE chat_message_id = $1`,
        [messageId],
      );
      for (const mention of mentions) {
        if (mention.id === ownAuthorId) continue;
        await client.query(
          `INSERT INTO authors_world_notifications
             (recipient_author_id, actor_author_id, chat_message_id, kind, body)
           VALUES ($1, $2, $3, 'chat_mention', $4)
           ON CONFLICT (recipient_author_id, chat_message_id, kind) DO NOTHING`,
          [mention.id, ownAuthorId, messageId, body],
        );
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }

    const message = await chatMessageById(messageId);
    if (!message) {
      res.status(500).json({ error: "The message was updated but could not be loaded" });
      return;
    }
    broadcastChatMessage({ type: "updated", message });
    res.json({ message });
  } catch (error) {
    logger.error({ msg: "Authors world chat edit failed", error });
    res.status(500).json({ error: "Unable to edit the message" });
  }
});

router.delete("/authors-world/chat/:id", async (req, res) => {
  const userId = currentUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Sign in to delete your message" });
    return;
  }

  const messageId = Number(req.params.id);
  if (!Number.isInteger(messageId) || messageId < 1) {
    res.status(400).json({ error: "Invalid message" });
    return;
  }

  try {
    await ensureAuthorsWorldSchema();
    const result = await pool.query(
      `DELETE FROM authors_world_chat_messages messages
       USING authors
       WHERE messages.id = $1 AND messages.author_id = authors.id AND authors.user_id = $2`,
      [messageId, userId],
    );
    if (!result.rowCount) {
      res.status(404).json({ error: "Message not found or not owned by you" });
      return;
    }
    broadcastChatMessage({ type: "deleted", id: messageId });
    res.status(204).send();
  } catch (error) {
    logger.error({ msg: "Authors world chat delete failed", error });
    res.status(500).json({ error: "Unable to delete the message" });
  }
});

router.get("/authors-world/notifications", async (req, res) => {
  const userId = currentUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Sign in to view your notifications" });
    return;
  }
  const requestedLimit = Number(req.query.limit);
  const limit = Number.isInteger(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), 100)
    : 50;

  try {
    await ensureAuthorsWorldSchema();
    const notificationsResult = await pool.query(
      `SELECT notifications.id, notifications.kind, notifications.body, notifications.is_read,
              notifications.chat_message_id, notifications.created_at,
              actor.id AS actor_id, actor.slug AS actor_slug, actor.display_name AS actor_display_name,
              actor.role AS actor_role, actor.avatar_url AS actor_avatar_url
       FROM authors_world_notifications notifications
       JOIN authors recipient ON recipient.id = notifications.recipient_author_id
       JOIN authors actor ON actor.id = notifications.actor_author_id
       WHERE recipient.user_id = $1
       ORDER BY notifications.created_at DESC, notifications.id DESC
       LIMIT $2`,
      [userId, limit],
    );
    const unreadResult = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM authors_world_notifications notifications
       JOIN authors recipient ON recipient.id = notifications.recipient_author_id
       WHERE recipient.user_id = $1 AND notifications.is_read = FALSE`,
      [userId],
    );
    res.json({
      unreadCount: Number(unreadResult.rows[0]?.count ?? 0),
      notifications: notificationsResult.rows.map((row) => ({
        id: Number(row.id),
        kind: row.kind,
        body: row.body,
        isRead: row.is_read === true,
        chatMessageId: Number(row.chat_message_id),
        createdAt: row.created_at,
        actor: {
          id: Number(row.actor_id),
          slug: row.actor_slug,
          displayName: row.actor_display_name,
          role: row.actor_role,
          avatarUrl: row.actor_avatar_url,
        },
      })),
    });
  } catch (error) {
    logger.error({ msg: "Authors world notifications load failed", error });
    res.status(500).json({ error: "Unable to load your notifications" });
  }
});

router.patch("/authors-world/notifications/:id/read", async (req, res) => {
  const userId = currentUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Sign in to update notifications" });
    return;
  }
  const notificationId = Number(req.params.id);
  if (!Number.isInteger(notificationId) || notificationId < 1) {
    res.status(400).json({ error: "Invalid notification" });
    return;
  }
  try {
    await ensureAuthorsWorldSchema();
    const result = await pool.query(
      `UPDATE authors_world_notifications notifications
       SET is_read = TRUE
       FROM authors recipient
       WHERE notifications.id = $1
         AND notifications.recipient_author_id = recipient.id
         AND recipient.user_id = $2
       RETURNING notifications.id`,
      [notificationId, userId],
    );
    if (!result.rowCount) {
      res.status(404).json({ error: "Notification not found" });
      return;
    }
    res.json({ ok: true });
  } catch (error) {
    logger.error({ msg: "Authors world notification read failed", error });
    res.status(500).json({ error: "Unable to update the notification" });
  }
});

router.post("/authors-world/notifications/read-all", async (req, res) => {
  const userId = currentUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Sign in to update notifications" });
    return;
  }
  try {
    await ensureAuthorsWorldSchema();
    const result = await pool.query(
      `UPDATE authors_world_notifications notifications
       SET is_read = TRUE
       FROM authors recipient
       WHERE notifications.recipient_author_id = recipient.id
         AND recipient.user_id = $1
         AND notifications.is_read = FALSE`,
      [userId],
    );
    res.json({ ok: true, updated: result.rowCount ?? 0 });
  } catch (error) {
    logger.error({ msg: "Authors world notifications read-all failed", error });
    res.status(500).json({ error: "Unable to update your notifications" });
  }
});

export default router;