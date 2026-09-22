import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, BarChart3, Bell, Check, CheckCheck, ImagePlus, LocateFixed, LogIn, LogOut, Mail, MessageCircle, Minus, Move, Pencil, Plus, Send, Trash2, UploadCloud, X, ZoomIn, ZoomOut } from "lucide-react";
import { motion } from "framer-motion";
import { useClerk, useUser } from "@clerk/react";
import { Link, useLocation } from "wouter";
import { useT } from "@/i18n/LanguageContext";
import { AUTHORS_WORLD_COPY, formatAuthorsWorldCopy } from "@/i18n/authorsWorld";
import { PLATFORM_OPTIONS, type PlatformKey } from "@/lib/authorPlatforms";
import authorGardenMist from "@/assets/author-garden-mist.mp4";
import authorGardenMistPoster from "@/assets/author-garden-mist-poster.jpg";

type AuthorLink = {
  label: string;
  url: string;
};

type AuthorMemory = {
  id: number;
  title: string;
  description: string;
  poem: string;
  links: string;
  imageUrl?: string | null;
  isHidden?: boolean;
  createdAt?: string;
};

type PlatformLinkDraft = {
  platform: PlatformKey;
  url: string;
  customLabel: string;
};

type Author = {
  id: string;
  slug: string;
  name: string;
  role: string;
  initials: string;
  memory: string;
  links: AuthorLink[];
  avatarUrl?: string | null;
  backgroundUrl?: string | null;
  isOnline: boolean;
  position: { left: number; top: number };
  memories: AuthorMemory[];
};

type ChatMessage = {
  id: number;
  body: string;
  createdAt: string;
  editedAt?: string | null;
  mentions?: ChatMention[];
  author: {
    id: number;
    slug: string;
    displayName: string;
    role: string;
    avatarUrl?: string | null;
  };
};

type ChatMention = {
  id: number;
  slug: string;
  displayName: string;
};

type AuthorNotification = {
  id: number;
  kind: string;
  body: string;
  isRead: boolean;
  chatMessageId: number;
  createdAt: string;
  actor: {
    id: number;
    slug: string;
    displayName: string;
    role: string;
    avatarUrl?: string | null;
  };
};

type DirectMessage = {
  id: number;
  body: string;
  createdAt: string;
  readAt?: string | null;
  sender: {
    id: number;
    slug: string;
    displayName: string;
    role: string;
    avatarUrl?: string | null;
  };
};

type DirectConversation = {
  id: number;
  author: DirectMessage["sender"];
  lastMessage: {
    id: number;
    body: string;
    createdAt: string;
    senderId: number;
  } | null;
  unreadCount: number;
};

type DirectThread = {
  id: number;
  author: DirectMessage["sender"];
  messages: DirectMessage[];
};

function ChatMessageBody({ message }: { message: ChatMessage }) {
  const mentions = message.mentions ?? [];
  if (mentions.length === 0) return <>{message.body}</>;

  const mentionByToken = new Map(mentions.map((mention) => [`@${mention.slug.toLowerCase()}`, mention]));
  const slugs = mentions
    .map((mention) => mention.slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .sort((a, b) => b.length - a.length);
  const parts = message.body.split(new RegExp(`(@(?:${slugs.join("|")}))`, "gi"));

  return (
    <>
      {parts.map((part, index) => {
        const mention = mentionByToken.get(part.toLowerCase());
        return mention ? (
          <Link
            key={`${mention.id}-${index}`}
            href={`/author/${mention.slug}`}
            className="font-bold text-[#ffad7f] underline decoration-[#ffad7f]/50 underline-offset-2 transition-colors hover:text-white"
          >
            {part}
          </Link>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        );
      })}
    </>
  );
}

function MessagingAvatar({
  name,
  avatarUrl,
  size = "md",
}: {
  name: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass = size === "lg" ? "h-12 w-12 text-sm" : size === "sm" ? "h-8 w-8 text-[9px]" : "h-10 w-10 text-[10px]";
  return (
    <span className={`authors-world-messaging-avatar ${sizeClass}`} aria-hidden="true">
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="authors-world-avatar-image h-full w-full" />
      ) : (
        initialsFor(name)
      )}
    </span>
  );
}

function mentionContextFor(value: string, cursor: number) {
  const beforeCursor = value.slice(0, cursor);
  const match = beforeCursor.match(/(?:^|\s)@([a-z0-9-]*)$/i);
  if (!match) return null;
  const query = match[1] ?? "";
  return {
    start: beforeCursor.length - query.length - 1,
    end: cursor,
    query: query.toLowerCase(),
  };
}

type AuthorDraft = {
  name: string;
  role: string;
  memory: string;
  avatarUrl: string;
  backgroundUrl: string;
  links: PlatformLinkDraft[];
};

type AuthorCreation = {
  id: number;
  platform: string;
  kind: string;
  title: string;
  description: string;
  poem: string;
  links: string;
  imageUrl?: string | null;
  contentUrl?: string | null;
  audioUrl?: string | null;
  audioObjectPath?: string | null;
  audioSizeBytes?: number | null;
  audioDurationSeconds?: number | null;
  position?: { left: number; top: number } | null;
  isHidden?: boolean;
  createdAt?: string;
};

type CreationDraft = {
  platform: PlatformKey;
  kind: "card" | "banner" | "creation";
  title: string;
  description: string;
  imageUrl: string;
  contentUrl: string;
  audioObjectPath: string;
  audioFileName: string;
  audioSizeBytes: number | null;
  audioDurationSeconds: number | null;
};

type MemoryDraft = {
  title: string;
  description: string;
  poem: string;
  links: string;
  imageUrl: string;
  isHidden: boolean;
};

const API_ROOT = `${import.meta.env.BASE_URL}api`;

const WORLD_COLUMNS = 4;
const WORLD_CELL_WIDTH = 260;
const WORLD_CELL_HEIGHT = 220;
const WORLD_PADDING_X = 150;
const WORLD_PADDING_Y = 150;
const WORLD_COLUMN_GAP = 84;
const WORLD_ROW_GAP = 82;
const DEFAULT_WORLD_ZOOM = 0.72;
const MIN_WORLD_ZOOM = 0.42;
const MAX_WORLD_ZOOM = 2.4;
const WORLD_ZOOM_STEP = 0.12;

function worldPositionFor(index: number, compact = false) {
  const columns = compact ? 1 : WORLD_COLUMNS;
  const column = index % columns;
  const row = Math.floor(index / columns);

  return {
    left: compact ? 150 : WORLD_PADDING_X + column * WORLD_CELL_WIDTH,
    top: compact ? 100 + row * 170 : WORLD_PADDING_Y + row * WORLD_CELL_HEIGHT,
  };
}

function authorFootprintFor(author: Pick<Author, "memories">, compact: boolean) {
  const memoryCount = Math.min(author.memories.length, 20);
  const memoryRadiusX = compact ? 92 : 132 + memoryCount * 2;
  const memoryRadiusY = compact ? 70 : 108 + memoryCount * 1.5;
  const memorySize = Math.max(42, 72 - memoryCount * 1.25);

  return {
    width: Math.max(compact ? 300 : 430, memoryRadiusX * 2 + memorySize + (compact ? 28 : 92)),
    height: Math.max(compact ? 220 : 330, memoryRadiusY * 2 + memorySize + (compact ? 44 : 92)),
  };
}

function worldLayoutFor(authors: Author[], compact = false) {
  const columns = compact ? 1 : Math.min(WORLD_COLUMNS, Math.max(1, authors.length));
  const footprints = authors.map((author) => authorFootprintFor(author, compact));
  const columnWidths = Array.from({ length: columns }, (_, column) =>
    Math.max(...footprints.filter((_, index) => index % columns === column).map((footprint) => footprint.width), compact ? 300 : WORLD_CELL_WIDTH),
  );
  const rows = Math.max(1, Math.ceil(Math.max(authors.length, 1) / columns));
  const rowHeights = Array.from({ length: rows }, (_, row) =>
    Math.max(...footprints.slice(row * columns, row * columns + columns).map((footprint) => footprint.height), compact ? 220 : WORLD_CELL_HEIGHT),
  );
  const columnOffsets = columnWidths.map((_, column) =>
    WORLD_PADDING_X + columnWidths.slice(0, column).reduce((sum, width) => sum + width + WORLD_COLUMN_GAP, 0),
  );
  const rowOffsets = rowHeights.map((_, row) =>
    WORLD_PADDING_Y + rowHeights.slice(0, row).reduce((sum, height) => sum + height + WORLD_ROW_GAP, 0),
  );
  const positions = authors.map((author, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    return {
      left: columnOffsets[column] + columnWidths[column] / 2,
      top: rowOffsets[row] + rowHeights[row] / 2,
    };
  });

  return {
    positions,
    width: compact
      ? Math.max(300, WORLD_PADDING_X * 2 + columnWidths[0])
      : Math.max(1040, WORLD_PADDING_X * 2 + columnWidths.reduce((sum, width) => sum + width, 0) + WORLD_COLUMN_GAP * (columns - 1)),
    height: compact
      ? Math.max(300, WORLD_PADDING_Y * 2 + rowHeights.reduce((sum, height) => sum + height, 0) + WORLD_ROW_GAP * (rows - 1))
      : Math.max(760, WORLD_PADDING_Y * 2 + rowHeights.reduce((sum, height) => sum + height, 0) + WORLD_ROW_GAP * (rows - 1)),
  };
}

function emptyPlatformLink(): PlatformLinkDraft {
  return { platform: "website", url: "", customLabel: "" };
}

const EMPTY_DRAFT: AuthorDraft = {
  name: "",
  role: "",
  memory: "",
  avatarUrl: "",
  backgroundUrl: "",
  links: [emptyPlatformLink()],
};

const EMPTY_CREATION_DRAFT: CreationDraft = {
  platform: "youtube",
  kind: "banner",
  title: "",
  description: "",
  imageUrl: "",
  contentUrl: "",
  audioObjectPath: "",
  audioFileName: "",
  audioSizeBytes: null,
  audioDurationSeconds: null,
};

const EMPTY_MEMORY_DRAFT: MemoryDraft = {
  title: "",
  description: "",
  poem: "",
  links: "",
  imageUrl: "",
  isHidden: false,
};

function initialsFor(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "??";
}

function platformOptionFor(value: PlatformKey) {
  return PLATFORM_OPTIONS.find((option) => option.value === value) ?? PLATFORM_OPTIONS[0];
}

function platformKeyForLink(link: AuthorLink): PlatformKey {
  const haystack = `${link.label} ${link.url}`.toLowerCase();
  if (haystack.includes("suno.com") || haystack.includes("suno")) return "suno";
  if (haystack.includes("spotify")) return "spotify";
  if (haystack.includes("youtube music") || haystack.includes("music.youtube")) return "youtube-music";
  if (haystack.includes("youtube")) return "youtube";
  if (haystack.includes("instagram")) return "instagram";
  if (haystack.includes("tiktok")) return "tiktok";
  if (haystack.includes("bandcamp")) return "bandcamp";
  if (haystack.includes("soundcloud")) return "soundcloud";
  if (haystack.includes("site") || haystack.includes("website") || haystack.includes("portfolio") || haystack.includes("портф")) return "website";
  return "other";
}

function draftLinkFor(link: AuthorLink): PlatformLinkDraft {
  const platform = platformKeyForLink(link);
  return {
    platform,
    url: link.url,
    customLabel: platform === "other" ? link.label : "",
  };
}

function platformLinksForDraft(drafts: PlatformLinkDraft[]) {
  const links: AuthorLink[] = [];

  for (const draft of drafts) {
    const url = draft.url.trim();
    if (!url) continue;

    const normalizedUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    try {
      const parsedUrl = new URL(normalizedUrl);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        throw new Error("invalid protocol");
      }
    } catch {
      throw new Error(`Перевір адресу: ${url}`);
    }

    const option = platformOptionFor(draft.platform);
    const label = draft.platform === "other" ? draft.customLabel.trim() || option.label : option.label;
    links.push({ label, url: normalizedUrl });
  }

  return links;
}

function compressedImageFromFile(file: File, maxSide: number, quality: number, label: string) {
  return new Promise<string>((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Обери файл зображення."));
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      reject(new Error(`${label} має бути не більшою за 8 МБ.`));
      return;
    }

    // Preserve the exact uploaded image whenever it already fits the profile
    // payload limit. Re-encoding small avatars needlessly softens line art,
    // lettering, and pixel art before the author-world zoom is applied.
    if (file.size <= 1_100_000) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result !== "string") {
          reject(new Error("Не вдалося прочитати файл іконки."));
          return;
        }
        resolve(reader.result);
      };
      reader.onerror = () => reject(new Error("Не вдалося прочитати файл іконки."));
      reader.readAsDataURL(file);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const ratio = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("Не вдалося підготувати іконку."));
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const compressed = canvas.toDataURL("image/webp", quality);
      if (compressed.length > 1_500_000) {
        reject(new Error(`Після стиснення ${label.toLowerCase()} все ще завелика. Обери інше зображення.`));
        return;
      }
      resolve(compressed);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Не вдалося прочитати файл іконки."));
    };
    image.src = objectUrl;
  });
}

function compressedAvatarFromFile(file: File) {
  return compressedImageFromFile(file, 1536, 0.94, "Іконка");
}

function compressedBackgroundFromFile(file: File) {
  return compressedImageFromFile(file, 1600, 0.78, "Фон профілю");
}

function compressedMemoryImageFromFile(file: File) {
  return compressedImageFromFile(file, 900, 0.82, "Фото спогаду");
}

function audioDurationFromFile(file: File) {
  return new Promise<number | null>((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const audio = new Audio();
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(Number.isFinite(audio.duration) ? audio.duration : null);
    };
    audio.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(null);
    };
    audio.src = objectUrl;
  });
}

function mapApiAuthor(
  value: {
    id: number;
    displayName: string;
    role: string;
    bio: string;
    avatarUrl?: string | null;
    backgroundUrl?: string | null;
    isOnline?: boolean;
    platformLinks?: AuthorLink[];
    slug: string;
    position?: { left: number; top: number };
  },
  index: number,
): Author {
  return {
    id: String(value.id),
    slug: value.slug,
    name: value.displayName,
    role: value.role,
    initials: initialsFor(value.displayName),
    memory: value.bio,
    links: Array.isArray(value.platformLinks) ? value.platformLinks : [],
    avatarUrl: value.avatarUrl,
    backgroundUrl: value.backgroundUrl,
    isOnline: value.isOnline === true,
    position: value.position ?? worldPositionFor(index),
    memories: Array.isArray((value as { memories?: AuthorMemory[] }).memories)
      ? (value as unknown as { memories: Array<AuthorMemory & { poem?: unknown; links?: unknown }> }).memories.map((memory) => ({
        ...memory,
        poem: typeof memory.poem === "string" ? memory.poem : "",
        links: typeof memory.links === "string" ? memory.links : "",
      }))
      : [],
  };
}

function memoryPositionFor(authorPosition: { left: number; top: number }, index: number, total: number, compact: boolean) {
  const angle = compact
    ? (index % 2 === 0 ? -0.65 : 0.65) + Math.floor(index / 2) * 0.12
    : (Math.PI * 2 * index) / Math.max(total, 1) - Math.PI / 2;
  const radiusX = compact ? 92 : 132 + Math.min(total, 20) * 2;
  const radiusY = compact ? 70 : 108 + Math.min(total, 20) * 1.5;
  return {
    left: authorPosition.left + Math.cos(angle) * radiusX,
    top: authorPosition.top + Math.sin(angle) * radiusY,
  };
}

function AuthorNode({
  author,
  position,
  active,
  expanded,
  locating,
  ariaLabel,
  nodeRef,
  onSelect,
  onHoverChange,
}: {
  author: Author;
  position?: { left: number; top: number };
  active: boolean;
  expanded: boolean;
  locating: boolean;
  ariaLabel: string;
  nodeRef: (node: HTMLButtonElement | null) => void;
  onSelect: () => void;
  onHoverChange: (expanded: boolean) => void;
}) {
  const nodePosition = position ?? author.position;
  const neonDelay = -((author.slug.length * 0.29 + author.name.length * 0.17) % 4.8);
  return (
    <motion.button
      type="button"
      ref={nodeRef}
      onClick={onSelect}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
      onFocus={() => onHoverChange(true)}
      onBlur={() => onHoverChange(false)}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className={`group absolute isolate flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2 overflow-visible text-center transition-[filter] duration-300 focus-visible:outline-none ${
        expanded ? "z-[1200]" : active ? "z-[210]" : "z-[100]"
       } ${locating ? "author-node-locating" : ""} ${author.isOnline ? "author-node-online" : ""}`}
       style={{ left: `${nodePosition.left}px`, top: `${nodePosition.top}px`, transformOrigin: "left center" }}
      aria-label={ariaLabel}
    >
       <span className="authors-world-author-icon relative flex h-16 w-16 items-center overflow-visible rounded-full border border-[#00f0ff]/90 bg-[#020a12]/[.98] text-left text-[#b9f7ff] shadow-[0_0_24px_rgba(0,240,255,0.44),0_0_58px_rgba(138,43,226,0.24)] transition-[width,height,border-radius,box-shadow] duration-300 group-hover:h-44 group-hover:w-96 group-hover:rounded-2xl group-hover:border-white group-hover:shadow-[0_0_52px_rgba(0,240,255,1),0_0_110px_rgba(138,43,226,0.42)] group-focus-visible:h-44 group-focus-visible:w-96 group-focus-visible:rounded-2xl">
          <span
            aria-hidden="true"
            className="author-avatar-neon-ring pointer-events-none absolute -inset-[3px] h-16 w-16 rounded-full"
            style={{ animationDelay: `${neonDelay}s` }}
          />
          <span className={`relative z-10 flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#00f0ff]/75 bg-[#01060e] font-mono text-xs font-bold tracking-[0.16em] transition-[width,height,border-radius] duration-300 group-hover:h-full group-hover:w-36 group-hover:rounded-none group-hover:border-0 group-focus-visible:h-full group-focus-visible:w-36 group-focus-visible:rounded-none group-focus-visible:border-0 ${
          ""
        }`}>
          <span aria-hidden="true" className="absolute inset-1 rounded-full border border-dashed border-[#00f0ff]/50 transition-[inset,border-radius] duration-300 group-hover:inset-2 group-hover:rounded-xl group-focus-visible:inset-2 group-focus-visible:rounded-xl" />
          {author.avatarUrl ? (
            <img src={author.avatarUrl} alt="" className="authors-world-avatar-image h-full w-full" />
          ) : (
            <Plus className="relative h-7 w-7 text-[#00f0ff]/80" aria-hidden="true" />
          )}
           {author.isOnline && (
             <span
               className="authors-world-presence-dot"
               title="Автор зараз на сайті"
               aria-label="Автор зараз на сайті"
             />
           )}
        </span>
        <span className="relative z-20 hidden min-w-0 flex-1 flex-col justify-center px-4 py-2 opacity-0 transition-opacity duration-200 group-hover:flex group-hover:opacity-100 group-focus-visible:flex group-focus-visible:opacity-100">
           <span className="truncate font-creepster text-2xl tracking-[0.08em] text-[#00f0ff] antialiased">{author.name}</span>
           <span className="mt-1 truncate font-mono text-[11px] uppercase tracking-[0.14em] text-[#ffad7f] antialiased">{author.role}</span>
           <span className="mt-3 line-clamp-3 font-mono text-[11px] leading-relaxed text-white/70 antialiased">{author.memory}</span>
        </span>
      </span>
        <span className="authors-world-author-label w-max font-mono text-[10px] uppercase tracking-[0.16em] text-white transition-colors group-hover:hidden group-focus-visible:hidden group-hover:text-white">
        {author.name}
      </span>
    </motion.button>
  );
}

function MemoryNode({
  memory,
  position,
  size,
  ariaLabel,
  onSelect,
}: {
  memory: AuthorMemory;
  position: { left: number; top: number };
  size: number;
  ariaLabel: string;
  onSelect: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileHover={{ scale: 1.12 }}
      whileFocus={{ scale: 1.12 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      className="authors-world-memory-node group absolute z-[180] flex -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full border border-[#ffcf9e]/70 bg-[#140d18]/90 text-center shadow-[0_0_18px_rgba(255,207,158,0.32)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffcf9e]"
      style={{ left: `${position.left}px`, top: `${position.top}px`, width: `${size}px`, height: `${size}px` }}
      aria-label={ariaLabel}
      title={memory.title}
    >
      <span aria-hidden="true" className="absolute inset-1 rounded-full border border-dashed border-[#ffcf9e]/45" />
      {memory.imageUrl ? (
        <img src={memory.imageUrl} alt="" className="h-full w-full object-cover opacity-85 transition-opacity group-hover:opacity-100" />
      ) : (
        <span className="relative px-2 font-creepster text-[11px] leading-tight tracking-[0.06em] text-[#ffcf9e]">
          {memory.title}
        </span>
      )}
    </motion.button>
  );
}

export default function AuthorsWorld() {
  const [location, setLocation] = useLocation();
  const { lang } = useT();
  const copy = AUTHORS_WORLD_COPY[lang];
  const locale = lang === "ua" ? "uk-UA" : lang === "fr" ? "fr-FR" : "en-CA";
  const { signOut } = useClerk();
  const { isLoaded: authLoaded, isSignedIn, user } = useUser();
  const [authors, setAuthors] = useState<Author[]>([]);
  const [selectedAuthorId, setSelectedAuthorId] = useState<string | null>(null);
  const [hoveredAuthorId, setHoveredAuthorId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [draft, setDraft] = useState<AuthorDraft>(EMPTY_DRAFT);
  const [myAuthor, setMyAuthor] = useState<Author | null>(null);
  const [authorsLoading, setAuthorsLoading] = useState(true);
  const [authorsError, setAuthorsError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [isProcessingAvatar, setIsProcessingAvatar] = useState(false);
  const [backgroundError, setBackgroundError] = useState<string | null>(null);
  const [isProcessingBackground, setIsProcessingBackground] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSavedNotice, setProfileSavedNotice] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatDraft, setChatDraft] = useState("");
  const [chatLoading, setChatLoading] = useState(true);
  const [chatError, setChatError] = useState<string | null>(null);
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [editingChatMessageId, setEditingChatMessageId] = useState<number | null>(null);
  const [editingChatDraft, setEditingChatDraft] = useState("");
  const [isUpdatingChat, setIsUpdatingChat] = useState(false);
  const [notifications, setNotifications] = useState<AuthorNotification[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [directConversations, setDirectConversations] = useState<DirectConversation[]>([]);
  const [directUnreadCount, setDirectUnreadCount] = useState(0);
  const [directLoading, setDirectLoading] = useState(false);
  const [directError, setDirectError] = useState<string | null>(null);
  const [selectedDirectSlug, setSelectedDirectSlug] = useState<string | null>(null);
  const [directThread, setDirectThread] = useState<DirectThread | null>(null);
  const [directDraft, setDirectDraft] = useState("");
  const [isSendingDirect, setIsSendingDirect] = useState(false);
  const [directNotice, setDirectNotice] = useState<string | null>(null);
  const [directSendMode, setDirectSendMode] = useState<"private" | "public">("private");
  const [inboxView, setInboxView] = useState<"mentions" | "direct" | "general">("direct");
  const [chatCursorPosition, setChatCursorPosition] = useState(0);
  const [mentionHighlightIndex, setMentionHighlightIndex] = useState(0);
  const [creations, setCreations] = useState<AuthorCreation[]>([]);
  const [creationDraft, setCreationDraft] = useState<CreationDraft>(EMPTY_CREATION_DRAFT);
  const [creationError, setCreationError] = useState<string | null>(null);
  const [isSavingCreation, setIsSavingCreation] = useState(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [creationSavedNotice, setCreationSavedNotice] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [editingCreationId, setEditingCreationId] = useState<number | null>(null);
  const [isCreationComposerOpen, setIsCreationComposerOpen] = useState(false);
  const [memoryDraft, setMemoryDraft] = useState<MemoryDraft>(EMPTY_MEMORY_DRAFT);
  const [memoryError, setMemoryError] = useState<string | null>(null);
  const [memorySavedNotice, setMemorySavedNotice] = useState<string | null>(null);
  const [isSavingMemory, setIsSavingMemory] = useState(false);
  const [isProcessingMemory, setIsProcessingMemory] = useState(false);
  const [editingMemoryId, setEditingMemoryId] = useState<number | null>(null);
  const [locatingAuthorId, setLocatingAuthorId] = useState<string | null>(null);
  const [isCompactViewport, setIsCompactViewport] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 639px)").matches);
  const [isMobileViewport, setIsMobileViewport] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches);
  const [worldZoom, setWorldZoom] = useState(DEFAULT_WORLD_ZOOM);
  const [worldPan, setWorldPan] = useState({ x: 0, y: 0 });
  const [isWorldDragging, setIsWorldDragging] = useState(false);
  const worldViewportRef = useRef<HTMLDivElement>(null);
  const authorNodeRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const worldPanRef = useRef(worldPan);
  const worldDragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const worldViewInitializedRef = useRef(false);
  const panAnimationRef = useRef<number | null>(null);
  const worldLayout = useMemo(() => worldLayoutFor(authors, isCompactViewport), [authors, isCompactViewport]);
  const worldSize = worldLayout;
  const chatInputRef = useRef<HTMLInputElement>(null);
  const generalChatInputRef = useRef<HTMLInputElement>(null);
  const mentionContext = useMemo(
    () => mentionContextFor(chatDraft, chatCursorPosition),
    [chatCursorPosition, chatDraft],
  );
  const mentionCandidates = useMemo(() => {
    if (!mentionContext) return [];
    const query = mentionContext.query;
    return authors
      .filter((author) => author.id !== myAuthor?.id)
      .filter((author) => `${author.slug} ${author.name}`.toLowerCase().includes(query))
      .slice(0, 6);
  }, [authors, mentionContext, myAuthor?.id]);

  const loadNotifications = useCallback(async () => {
    if (!isSignedIn || !myAuthor) {
      setNotifications([]);
      setUnreadNotificationCount(0);
      return;
    }
    setNotificationsLoading(true);
    setNotificationsError(null);
    try {
      const response = await fetch(`${API_ROOT}/authors-world/notifications`, {
        credentials: "include",
      });
      const payload = await response.json().catch(() => ({})) as {
        notifications?: AuthorNotification[];
        unreadCount?: number;
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error ?? copy.notifications.failed);
      setNotifications(Array.isArray(payload.notifications) ? payload.notifications : []);
      setUnreadNotificationCount(Number(payload.unreadCount ?? 0));
    } catch (error) {
      setNotificationsError(error instanceof Error ? error.message : copy.notifications.failed);
    } finally {
      setNotificationsLoading(false);
    }
  }, [copy.notifications.failed, isSignedIn, myAuthor?.id]);

  const loadDirectConversations = useCallback(async () => {
    if (!isSignedIn || !myAuthor) {
      setDirectConversations([]);
      setDirectUnreadCount(0);
      setSelectedDirectSlug(null);
      setDirectThread(null);
      return;
    }
    setDirectLoading(true);
    setDirectError(null);
    try {
      const response = await fetch(`${API_ROOT}/authors-world/direct/conversations`, {
        credentials: "include",
      });
      const payload = await response.json().catch(() => ({})) as {
        conversations?: DirectConversation[];
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error ?? copy.directMessages.failed);
      const nextConversations = Array.isArray(payload.conversations) ? payload.conversations : [];
      setDirectConversations(nextConversations);
      setDirectUnreadCount(nextConversations.reduce((total, item) => total + item.unreadCount, 0));
    } catch (error) {
      setDirectError(error instanceof Error ? error.message : copy.directMessages.failed);
    } finally {
      setDirectLoading(false);
    }
  }, [copy.directMessages.failed, isSignedIn, myAuthor?.id]);

  const openDirectConversation = useCallback(async (conversation: DirectConversation) => {
    setSelectedDirectSlug(conversation.author.slug);
    setDirectThread(null);
    setDirectDraft("");
    setDirectNotice(null);
    setDirectSendMode("private");
    setDirectLoading(true);
    setDirectError(null);
    try {
      const response = await fetch(`${API_ROOT}/authors-world/direct/${encodeURIComponent(conversation.author.slug)}`, {
        credentials: "include",
      });
      const payload = await response.json().catch(() => ({})) as {
        thread?: { id: number; author: DirectMessage["sender"] } | null;
        messages?: DirectMessage[];
        error?: string;
      };
      if (!response.ok || !payload.thread) throw new Error(payload.error ?? copy.directMessages.failed);
      setDirectThread({
        id: payload.thread.id,
        author: payload.thread.author,
        messages: Array.isArray(payload.messages) ? payload.messages : [],
      });
      setDirectConversations((current) => current.map((item) =>
        item.author.slug === conversation.author.slug ? { ...item, unreadCount: 0 } : item,
      ));
      setDirectUnreadCount((current) => Math.max(0, current - conversation.unreadCount));
    } catch (error) {
      setDirectError(error instanceof Error ? error.message : copy.directMessages.failed);
    } finally {
      setDirectLoading(false);
    }
  }, [copy.directMessages.failed]);

  const sendDirectReply = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = directDraft.trim();
    if (!selectedDirectSlug || !body || isSendingDirect) return;
    setIsSendingDirect(true);
    setDirectError(null);
    setDirectNotice(null);
    try {
      const isPublicReply = directSendMode === "public";
      const publicBody = directThread && body.toLowerCase().startsWith(`@${directThread.author.slug.toLowerCase()}`)
        ? body
        : directThread
          ? `@${directThread.author.slug} ${body}`
          : body;
      const response = await fetch(
        isPublicReply
          ? `${API_ROOT}/authors-world/chat`
          : `${API_ROOT}/authors-world/direct/${encodeURIComponent(selectedDirectSlug)}`,
        {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: isPublicReply ? publicBody : body }),
        },
      );
      const payload = await response.json().catch(() => ({})) as {
        message?: DirectMessage | ChatMessage;
        error?: string;
      };
      if (!response.ok || !payload.message) throw new Error(payload.error ?? (isPublicReply ? copy.chat.failed : copy.directMessages.sendFailed));
      if (isPublicReply) {
        setChatMessages((current) =>
          current.some((item) => item.id === payload.message?.id)
            ? current
            : [...current, payload.message as ChatMessage].slice(-100),
        );
        setDirectNotice(copy.directMessage.success);
      } else {
        setDirectThread((current) => current
          ? { ...current, messages: [...current.messages, payload.message as DirectMessage] }
          : current);
        setDirectNotice(copy.directMessage.privateSuccess);
      }
      setDirectDraft("");
      if (!isPublicReply) void loadDirectConversations();
    } catch (error) {
      setDirectError(error instanceof Error ? error.message : directSendMode === "public" ? copy.chat.failed : copy.directMessages.sendFailed);
    } finally {
      setIsSendingDirect(false);
    }
  }, [copy.chat.failed, copy.directMessage.privateSuccess, copy.directMessage.success, copy.directMessages.sendFailed, directDraft, directSendMode, directThread, isSendingDirect, loadDirectConversations, selectedDirectSlug]);

  const selectMention = useCallback((author: Author) => {
    if (!mentionContext) return;
    const nextDraft = `${chatDraft.slice(0, mentionContext.start)}@${author.slug} ${chatDraft.slice(mentionContext.end)}`;
    const nextCursor = mentionContext.start + author.slug.length + 2;
    setChatDraft(nextDraft);
    setChatCursorPosition(nextCursor);
    setMentionHighlightIndex(0);
    window.requestAnimationFrame(() => {
      chatInputRef.current?.focus();
      chatInputRef.current?.setSelectionRange(nextCursor, nextCursor);
    });
  }, [chatDraft, mentionContext]);

  const addressAuthor = useCallback((author: Pick<ChatMessage["author"], "slug">) => {
    const prefix = `@${author.slug} `;
    const nextDraft = `${prefix}${chatDraft}`;
    const nextCursor = prefix.length;
    setChatDraft(nextDraft);
    setChatCursorPosition(nextCursor);
    setMentionHighlightIndex(0);
    setIsNotificationsOpen(false);
    document.getElementById("authors-world-chat")?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.requestAnimationFrame(() => {
      chatInputRef.current?.focus();
      chatInputRef.current?.setSelectionRange(nextCursor, nextCursor);
    });
  }, [chatDraft]);

  const openAuthorPortal = () => {
    setFormError(null);
    setProfileSavedNotice(null);
    if (!authLoaded || !isSignedIn) {
      setLocation("/sign-in");
      return;
    }
    setIsRegistering(true);
  };

  const openMyPortalWorld = () => {
    if (!authLoaded || !isSignedIn) {
      setLocation("/sign-in");
      return;
    }
    if (authorsLoading) return;
    if (!myAuthor) {
      openAuthorPortal();
      return;
    }
    setLocation(`/author/${encodeURIComponent(myAuthor.slug)}`);
  };

  const handleAuthorSignOut = async () => {
    await signOut({ redirectUrl: "/authors-world" });
  };

  const updateWorldPan = useCallback((nextPan: { x: number; y: number }) => {
    worldPanRef.current = nextPan;
    setWorldPan(nextPan);
  }, []);

  const animateWorldPanTo = useCallback((targetPan: { x: number; y: number }) => {
    if (panAnimationRef.current !== null) {
      window.cancelAnimationFrame(panAnimationRef.current);
    }

    const startPan = worldPanRef.current;
    const startedAt = performance.now();
    const duration = 720;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      updateWorldPan({
        x: startPan.x + (targetPan.x - startPan.x) * eased,
        y: startPan.y + (targetPan.y - startPan.y) * eased,
      });
      if (progress < 1) {
        panAnimationRef.current = window.requestAnimationFrame(tick);
      } else {
        panAnimationRef.current = null;
      }
    };

    panAnimationRef.current = window.requestAnimationFrame(tick);
  }, [updateWorldPan]);

  const changeWorldZoom = useCallback((nextZoom: number, focusPoint?: { x: number; y: number }) => {
    const viewport = worldViewportRef.current;
    const clampedZoom = Math.min(MAX_WORLD_ZOOM, Math.max(MIN_WORLD_ZOOM, nextZoom));
    if (!viewport || clampedZoom === worldZoom) {
      setWorldZoom(clampedZoom);
      return;
    }

    const centerX = focusPoint?.x ?? viewport.clientWidth / 2;
    const centerY = focusPoint?.y ?? viewport.clientHeight / 2;
    const currentPan = worldPanRef.current;
    const focusX = (centerX - currentPan.x) / worldZoom;
    const focusY = (centerY - currentPan.y) / worldZoom;
    updateWorldPan({
      x: centerX - focusX * clampedZoom,
      y: centerY - focusY * clampedZoom,
    });
    setWorldZoom(clampedZoom);
  }, [updateWorldPan, worldZoom]);

  const centerWorldOn = useCallback((point: { left: number; top: number }, zoom = worldZoom, animate = true) => {
    const viewport = worldViewportRef.current;
    if (!viewport) return;

    const targetPan = {
      x: viewport.clientWidth / 2 - point.left * zoom,
      y: viewport.clientHeight / 2 - point.top * zoom,
    };
    if (animate) {
      animateWorldPanTo(targetPan);
    } else {
      updateWorldPan(targetPan);
    }
  }, [animateWorldPanTo, updateWorldPan, worldZoom]);

  const centerWorld = useCallback((animate = true) => {
    const viewport = worldViewportRef.current;
    if (!viewport) return;

    worldDragRef.current = null;
    setIsWorldDragging(false);
    if (panAnimationRef.current !== null) {
      window.cancelAnimationFrame(panAnimationRef.current);
      panAnimationRef.current = null;
    }

    const targetPan = {
      x: viewport.clientWidth / 2 - (worldSize.width * worldZoom) / 2,
      y: viewport.clientHeight / 2 - (worldSize.height * worldZoom) / 2,
    };
    if (animate) {
      animateWorldPanTo(targetPan);
    } else {
      updateWorldPan(targetPan);
    }
  }, [animateWorldPanTo, updateWorldPan, worldSize.height, worldSize.width, worldZoom]);

  const handleWorldPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest("button, a, input, textarea, select")) return;

    if (panAnimationRef.current !== null) {
      window.cancelAnimationFrame(panAnimationRef.current);
      panAnimationRef.current = null;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    worldDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: worldPanRef.current.x,
      originY: worldPanRef.current.y,
    };
    setIsWorldDragging(true);
  };

  const handleWorldPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = worldDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    updateWorldPan({
      x: drag.originX + event.clientX - drag.startX,
      y: drag.originY + event.clientY - drag.startY,
    });
  };

  const finishWorldPointerDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (worldDragRef.current?.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    worldDragRef.current = null;
    setIsWorldDragging(false);
  };

  const handleWorldWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const bounds = event.currentTarget.getBoundingClientRect();
    changeWorldZoom(
      worldZoom + (event.deltaY < 0 ? WORLD_ZOOM_STEP : -WORLD_ZOOM_STEP),
      {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      },
    );
  };

  const handleAvatarFile = async (file: File | undefined) => {
    if (!file) return;
    setAvatarError(null);
    setIsProcessingAvatar(true);
    try {
      const avatarUrl = await compressedAvatarFromFile(file);
      setDraft((current) => ({ ...current, avatarUrl }));
    } catch (error) {
      setAvatarError(lang === "ua" && error instanceof Error ? error.message : copy.errors.avatar);
    } finally {
      setIsProcessingAvatar(false);
    }
  };

  const handleBackgroundFile = async (file: File | undefined) => {
    if (!file) return;
    setBackgroundError(null);
    setIsProcessingBackground(true);
    try {
      const backgroundUrl = await compressedBackgroundFromFile(file);
      setDraft((current) => ({ ...current, backgroundUrl }));
    } catch (error) {
      setBackgroundError(lang === "ua" && error instanceof Error ? error.message : copy.errors.background);
    } finally {
      setIsProcessingBackground(false);
    }
  };

  const handleMemoryFile = async (file: File | undefined) => {
    if (!file) return;
    setMemoryError(null);
    setIsProcessingMemory(true);
    try {
      const imageUrl = await compressedMemoryImageFromFile(file);
      setMemoryDraft((current) => ({ ...current, imageUrl }));
    } catch (error) {
      setMemoryError(lang === "ua" && error instanceof Error ? error.message : copy.errors.memoryImage);
    } finally {
      setIsProcessingMemory(false);
    }
  };

  const handleAudioFile = async (file: File | undefined) => {
    if (!file) return;
    setAudioError(null);
    if (!/\.mp3$/i.test(file.name)) {
      setAudioError(copy.errors.mp3Type);
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setAudioError(copy.errors.mp3Size);
      return;
    }
    setAudioFile(file);
    const duration = await audioDurationFromFile(file);
    setCreationDraft((current) => ({
      ...current,
      audioObjectPath: "",
      audioFileName: file.name,
      audioSizeBytes: file.size,
      audioDurationSeconds: duration,
    }));
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 639px)");
    const mobileMediaQuery = window.matchMedia("(max-width: 767px)");
    const updateViewport = () => {
      setIsCompactViewport(mediaQuery.matches);
      setIsMobileViewport(mobileMediaQuery.matches);
    };
    updateViewport();
    mediaQuery.addEventListener("change", updateViewport);
    mobileMediaQuery.addEventListener("change", updateViewport);
    return () => {
      mediaQuery.removeEventListener("change", updateViewport);
      mobileMediaQuery.removeEventListener("change", updateViewport);
    };
  }, []);

  useEffect(() => {
    if (!isRegistering) return;

    const body = document.body;
    const html = document.documentElement;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyOverscrollBehavior = body.style.overscrollBehavior;
    const previousHtmlOverflow = html.style.overflow;
    const previousHtmlOverscrollBehavior = html.style.overscrollBehavior;

    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";
    html.style.overflow = "hidden";
    html.style.overscrollBehavior = "none";

    return () => {
      body.style.overflow = previousBodyOverflow;
      body.style.overscrollBehavior = previousBodyOverscrollBehavior;
      html.style.overflow = previousHtmlOverflow;
      html.style.overscrollBehavior = previousHtmlOverscrollBehavior;
    };
  }, [isRegistering]);

  useEffect(() => {
    if (!authLoaded) return;
    let active = true;

    const loadAuthors = async () => {
      try {
        const [authorsResponse, meResponse] = await Promise.all([
          fetch(`${API_ROOT}/authors-world/authors`, { credentials: "include" }),
          fetch(`${API_ROOT}/authors-world/me`, { credentials: "include" }),
        ]);
        if (!authorsResponse.ok || !meResponse.ok) {
          throw new Error(copy.errors.loadWorld);
        }

        const authorsPayload = await authorsResponse.json() as {
          authors?: Parameters<typeof mapApiAuthor>[0][];
        };
        const mePayload = await meResponse.json() as {
          author?: Parameters<typeof mapApiAuthor>[0] | null;
        };
        if (!active) return;

        const nextAuthors = Array.isArray(authorsPayload.authors)
          ? authorsPayload.authors.map(mapApiAuthor)
          : [];
        setAuthors(nextAuthors);
        if (mePayload.author) {
          const ownAuthor = mapApiAuthor(mePayload.author, nextAuthors.length);
          setMyAuthor(ownAuthor);
          setDraft({
            name: ownAuthor.name,
            role: ownAuthor.role,
            memory: ownAuthor.memory,
            avatarUrl: ownAuthor.avatarUrl ?? "",
            backgroundUrl: ownAuthor.backgroundUrl ?? "",
            links: ownAuthor.links.length > 0 ? ownAuthor.links.map(draftLinkFor) : [emptyPlatformLink()],
          });
          const profileResponse = await fetch(
            `${API_ROOT}/authors-world/author/${encodeURIComponent(ownAuthor.slug)}`,
            { credentials: "include" },
          );
          const profilePayload = await profileResponse.json().catch(() => ({})) as {
            creations?: AuthorCreation[];
          };
          if (active && profileResponse.ok) {
            setCreations(Array.isArray(profilePayload.creations) ? profilePayload.creations : []);
          }
        } else {
          setMyAuthor(null);
          setCreations([]);
        }
      } catch (error) {
        if (!active) return;
        setAuthors([]);
        setAuthorsError(error instanceof Error ? error.message : copy.errors.loadAuthors);
      } finally {
        if (active) setAuthorsLoading(false);
      }
    };

    void loadAuthors();
    return () => {
      active = false;
    };
  }, [authLoaded, copy.errors.loadWorld, isSignedIn]);

  useEffect(() => {
    if (!authLoaded) return;
    let active = true;

    const loadPresence = async () => {
      try {
        const response = await fetch(`${API_ROOT}/authors-world/presence`, { credentials: "include" });
        if (!response.ok) return;
        const payload = await response.json().catch(() => ({})) as { onlineAuthorIds?: unknown };
        if (!active || !Array.isArray(payload.onlineAuthorIds)) return;
        const onlineIds = new Set(payload.onlineAuthorIds.map((id) => String(id)));
        setAuthors((current) => current.map((author) => ({
          ...author,
          isOnline: onlineIds.has(author.id),
        })));
        setMyAuthor((current) => current
          ? { ...current, isOnline: onlineIds.has(current.id) }
          : current);
      } catch {
        // The initial author payload remains usable when presence is unavailable.
      }
    };

    void loadPresence();
    const interval = window.setInterval(() => void loadPresence(), 10_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [authLoaded]);

  useEffect(() => {
    if (myAuthor && new URLSearchParams(location.split("?")[1] ?? "").get("edit") === "1") {
      setIsRegistering(true);
    }
  }, [location, myAuthor]);

  useEffect(() => {
    if (authors.length === 0) {
      setSelectedAuthorId(null);
      return;
    }
    if (!selectedAuthorId || !authors.some((author) => author.id === selectedAuthorId)) {
      setSelectedAuthorId(authors[0].id);
    }
  }, [authors, selectedAuthorId]);

  useEffect(() => {
    const focus = new URLSearchParams(location.split("?")[1] ?? "").get("focus");
    if (focus !== "me" || !myAuthor || authors.length === 0) return;

    const authorIndex = authors.findIndex((author) => author.id === myAuthor.id);
    if (authorIndex < 0) return;

    setSelectedAuthorId(myAuthor.id);
    const frame = window.requestAnimationFrame(() => {
      centerWorldOn(
        worldLayout.positions[authorIndex] ?? worldPositionFor(authorIndex, isCompactViewport),
        DEFAULT_WORLD_ZOOM,
      );
    });

    return () => window.cancelAnimationFrame(frame);
  }, [authors, centerWorldOn, isCompactViewport, location, myAuthor, worldLayout.positions]);

  useEffect(() => {
    let active = true;

    const loadChat = async () => {
      try {
        const response = await fetch(`${API_ROOT}/authors-world/chat`, {
          credentials: "include",
        });
        if (!response.ok) throw new Error(copy.errors.connectChat);
        const payload = await response.json() as { messages?: ChatMessage[] };
        if (active) setChatMessages(Array.isArray(payload.messages) ? payload.messages : []);
      } catch (error) {
        if (active) {
          setChatError(error instanceof Error ? error.message : copy.errors.chatUnavailable);
        }
      } finally {
        if (active) setChatLoading(false);
      }
    };

    void loadChat();
    const stream = new EventSource(`${API_ROOT}/authors-world/chat/stream`);
    stream.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as ChatMessage | { type: "updated"; message: ChatMessage } | { type: "deleted"; id: number };
        if (!active) return;
        if ("type" in payload && payload.type === "deleted") {
          setChatMessages((current) => current.filter((item) => item.id !== payload.id));
          if (editingChatMessageId === payload.id) setEditingChatMessageId(null);
          return;
        }
        if ("type" in payload && payload.type === "updated") {
          setChatMessages((current) => current.map((item) => item.id === payload.message.id ? payload.message : item));
          return;
        }
        const message = payload;
        setChatMessages((current) =>
          current.some((item) => item.id === message.id)
            ? current
            : [...current, message].slice(-100),
        );
        if (myAuthor && message.mentions?.some((mention) => mention.id === Number(myAuthor.id))) {
          void loadNotifications();
        }
      } catch {
        // Ignore malformed events and keep the connection alive.
      }
    };
    stream.onerror = () => {
      if (active) setChatError(copy.errors.liveInterrupted);
    };

    return () => {
      active = false;
      stream.close();
    };
  }, [copy.errors.chatUnavailable, copy.errors.connectChat, copy.errors.liveInterrupted, editingChatMessageId, loadNotifications, myAuthor]);

  useEffect(() => {
    void loadNotifications();
    void loadDirectConversations();
    const refreshTimer = window.setInterval(() => {
      void loadNotifications();
      void loadDirectConversations();
    }, 30_000);
    return () => window.clearInterval(refreshTimer);
  }, [loadDirectConversations, loadNotifications]);

  useEffect(() => {
    if (!isNotificationsOpen || !isMobileViewport) return;
    const body = document.body;
    const previousOverflow = body.style.overflow;
    const previousOverscrollBehavior = body.style.overscrollBehavior;
    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";
    return () => {
      body.style.overflow = previousOverflow;
      body.style.overscrollBehavior = previousOverscrollBehavior;
    };
  }, [isMobileViewport, isNotificationsOpen]);

  const visibleAuthors = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return authors;
    return authors.filter((author) =>
      `${author.name} ${author.role} ${author.memory}`.toLowerCase().includes(query),
    );
  }, [authors, search]);

  const selectedAuthor = authors.find((author) => author.id === selectedAuthorId) ?? null;
  const authoredWorks = useMemo(() => creations.filter((creation) => creation.kind !== "memory"), [creations]);
  const authoredMemories = useMemo(() => creations.filter((creation) => creation.kind === "memory"), [creations]);
  useEffect(() => {
    if (authors.length === 0 || worldViewInitializedRef.current) return;

    const frame = window.requestAnimationFrame(() => {
      centerWorldOn(
        { left: worldSize.width / 2, top: worldSize.height / 2 },
        DEFAULT_WORLD_ZOOM,
        false,
      );
      worldViewInitializedRef.current = true;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [authors.length, centerWorldOn, worldSize.height, worldSize.width]);

  useEffect(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      setLocatingAuthorId(null);
      return;
    }

    const match = authors.find((author) =>
      `${author.name} ${author.role} ${author.memory}`.toLowerCase().includes(query),
    );
    if (!match) {
      setLocatingAuthorId(null);
      return;
    }

     const matchIndex = authors.findIndex((author) => author.id === match.id);
    setSelectedAuthorId(match.id);
    setLocatingAuthorId(match.id);
    const frame = window.requestAnimationFrame(() => {
       centerWorldOn(worldLayout.positions[matchIndex] ?? worldPositionFor(matchIndex, isCompactViewport));
    });
    const timeout = window.setTimeout(() => setLocatingAuthorId(null), 1400);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [authors, centerWorldOn, isCompactViewport, search, worldLayout.positions]);

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setProfileSavedNotice(null);
    if (!isSignedIn) {
      setFormError(copy.errors.signInFirst);
      return;
    }
    const formData = new FormData(event.currentTarget);
    const fieldValue = (key: string, fallback: string) => {
      const value = formData.get(key);
      return typeof value === "string" ? value.trim() : fallback.trim();
    };
    const name = fieldValue("displayName", draft.name);
    const role = fieldValue("role", draft.role);
    const memory = fieldValue("bio", draft.memory);
    const avatarUrl = fieldValue("avatarUrl", draft.avatarUrl);
    const backgroundUrl = fieldValue("backgroundUrl", draft.backgroundUrl);
    const missingField = !name ? "displayName" : !role ? "role" : !memory ? "bio" : null;
    if (missingField) {
      setFormError(copy.errors.requiredFields);
      (event.currentTarget.elements.namedItem(missingField) as HTMLInputElement | HTMLTextAreaElement | null)?.focus();
      return;
    }

    let links: AuthorLink[];
    try {
      links = platformLinksForDraft(draft.links);
    } catch (error) {
      setFormError(lang === "ua" && error instanceof Error ? error.message : copy.errors.platformAddresses);
      return;
    }

    setIsSavingProfile(true);
    try {
      const response = await fetch(`${API_ROOT}/authors-world/me`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: name,
          role,
          bio: memory,
          avatarUrl: avatarUrl || null,
          backgroundUrl: backgroundUrl || null,
          platformLinks: links,
        }),
      });
      const payload = await response.json().catch(() => ({})) as {
        author?: Parameters<typeof mapApiAuthor>[0];
        error?: string;
      };
      if (!response.ok || !payload.author) {
        throw new Error(payload.error ?? copy.errors.openPortal);
      }

      const savedAuthor = mapApiAuthor(payload.author, authors.length);
      setMyAuthor(savedAuthor);
      setAuthors((current) => {
        const existingIndex = current.findIndex((author) => author.id === savedAuthor.id);
        if (existingIndex === -1) return [...current, savedAuthor];
        return current.map((author, index) =>
          index === existingIndex
            ? { ...savedAuthor, position: author.position }
            : author,
        );
      });
      setSelectedAuthorId(savedAuthor.id);
      setDraft({
        name: savedAuthor.name,
        role: savedAuthor.role,
        memory: savedAuthor.memory,
        avatarUrl: savedAuthor.avatarUrl ?? "",
        backgroundUrl: savedAuthor.backgroundUrl ?? "",
        links: savedAuthor.links.length > 0 ? savedAuthor.links.map(draftLinkFor) : [emptyPlatformLink()],
      });
      setProfileSavedNotice(copy.notices.profileSaved);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : copy.errors.openPortal);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveCreation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!creationDraft.title.trim() || isSavingCreation || isUploadingAudio) return;
    setCreationError(null);
    setCreationSavedNotice(null);
    if (!creationDraft.contentUrl.trim() && !audioFile && !creationDraft.audioObjectPath) {
      setCreationError(copy.errors.needWork);
      return;
    }
    setIsSavingCreation(true);
    try {
      let audioObjectPath = creationDraft.audioObjectPath || null;
      if (audioFile) {
        setIsUploadingAudio(true);
        const uploadUrlResponse = await fetch(`${API_ROOT}/authors-world/me/audio/upload-url`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: audioFile.name,
            size: audioFile.size,
            contentType: "audio/mpeg",
            creationId: editingCreationId,
          }),
        });
        const uploadPayload = await uploadUrlResponse.json().catch(() => ({})) as {
          uploadURL?: string;
          objectPath?: string;
          error?: string;
        };
        if (!uploadUrlResponse.ok || !uploadPayload.uploadURL || !uploadPayload.objectPath) {
          throw new Error(uploadPayload.error ?? copy.errors.prepareUpload);
        }
        const uploadResponse = await fetch(uploadPayload.uploadURL, {
          method: "PUT",
          headers: { "Content-Type": "audio/mpeg" },
          body: audioFile,
        });
        if (!uploadResponse.ok) {
          throw new Error(copy.errors.uploadMp3);
        }
        audioObjectPath = uploadPayload.objectPath;
      }
      const endpoint = editingCreationId
        ? `${API_ROOT}/authors-world/me/creations/${editingCreationId}`
        : `${API_ROOT}/authors-world/me/creations`;
      const response = await fetch(endpoint, {
        method: editingCreationId ? "PATCH" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...creationDraft,
          audioObjectPath,
          audioDurationSeconds: creationDraft.audioDurationSeconds,
        }),
      });
      const payload = await response.json().catch(() => ({})) as {
        creation?: AuthorCreation;
        error?: string;
      };
      if (!response.ok || !payload.creation) {
        throw new Error(payload.error ?? copy.errors.saveWork);
      }
      setCreations((current) => editingCreationId
        ? current.map((item) => item.id === editingCreationId ? payload.creation as AuthorCreation : item)
        : [...current, payload.creation as AuthorCreation]);
      setCreationDraft(EMPTY_CREATION_DRAFT);
      setAudioFile(null);
      setAudioError(null);
      setEditingCreationId(null);
      setIsCreationComposerOpen(false);
      setCreationSavedNotice(copy.notices.workSaved);
    } catch (error) {
      setCreationError(error instanceof Error ? error.message : copy.errors.saveWork);
    } finally {
      setIsUploadingAudio(false);
      setIsSavingCreation(false);
    }
  };

  const openCreationComposer = () => {
    setCreationError(null);
    setCreationSavedNotice(null);
    setAudioFile(null);
    setAudioError(null);
    setEditingCreationId(null);
    setCreationDraft(EMPTY_CREATION_DRAFT);
    setIsCreationComposerOpen(true);
  };

  const closeCreationComposer = () => {
    if (isSavingCreation || isUploadingAudio) return;
    setEditingCreationId(null);
    setCreationError(null);
    setAudioFile(null);
    setAudioError(null);
    setCreationDraft(EMPTY_CREATION_DRAFT);
    setIsCreationComposerOpen(false);
  };

  const handleSaveMemory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = memoryDraft.title.trim();
    const description = memoryDraft.description.trim();
    const poem = memoryDraft.poem.trim();
    const links = memoryDraft.links.trim();
    if (!title || !description || isSavingMemory || isProcessingMemory) return;
    setMemoryError(null);
    setMemorySavedNotice(null);
    setIsSavingMemory(true);
    try {
      const endpoint = editingMemoryId
        ? `${API_ROOT}/authors-world/me/creations/${editingMemoryId}`
        : `${API_ROOT}/authors-world/me/creations`;
      const response = await fetch(endpoint, {
        method: editingMemoryId ? "PATCH" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: "other",
          kind: "memory",
          title,
          description,
          poem,
          links,
          imageUrl: memoryDraft.imageUrl || null,
          contentUrl: null,
          audioObjectPath: null,
          audioDurationSeconds: null,
          hidden: memoryDraft.isHidden,
        }),
      });
      const payload = await response.json().catch(() => ({})) as {
        creation?: AuthorCreation;
        error?: string;
      };
      if (!response.ok || !payload.creation) {
        throw new Error(payload.error ?? copy.errors.saveMemory);
      }
      const savedMemory = payload.creation;
      setCreations((current) => editingMemoryId
        ? current.map((item) => item.id === editingMemoryId ? savedMemory : item)
        : [...current, savedMemory]);
      setAuthors((current) => current.map((author) =>
        author.id === myAuthor?.id
          ? {
            ...author,
            memories: [
              ...author.memories.filter((memory) => memory.id !== savedMemory.id),
              ...(savedMemory.isHidden ? [] : [{
                id: savedMemory.id,
                title: savedMemory.title,
                description: savedMemory.description,
                 poem: savedMemory.poem,
                 links: savedMemory.links,
                imageUrl: savedMemory.imageUrl,
                createdAt: savedMemory.createdAt,
              }]),
            ],
          }
          : author,
      ));
      setMyAuthor((current) => current
        ? {
          ...current,
          memories: [
            ...current.memories.filter((memory) => memory.id !== savedMemory.id),
            ...(savedMemory.isHidden ? [] : [{
              id: savedMemory.id,
              title: savedMemory.title,
              description: savedMemory.description,
               poem: savedMemory.poem,
               links: savedMemory.links,
              imageUrl: savedMemory.imageUrl,
              createdAt: savedMemory.createdAt,
            }]),
          ],
        }
        : current);
      setMemoryDraft(EMPTY_MEMORY_DRAFT);
      setEditingMemoryId(null);
      setMemorySavedNotice(copy.notices.memorySaved);
    } catch (error) {
      setMemoryError(error instanceof Error ? error.message : copy.errors.saveMemory);
    } finally {
      setIsSavingMemory(false);
    }
  };

  const handleDeleteMemory = async (memoryId: number) => {
    if (!window.confirm(copy.errors.confirmDeleteMemory)) return;
    setMemoryError(null);
    try {
      const response = await fetch(`${API_ROOT}/authors-world/me/creations/${memoryId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(payload.error ?? copy.errors.deleteMemory);
      }
      setCreations((current) => current.filter((item) => item.id !== memoryId));
      setAuthors((current) => current.map((author) =>
        author.id === myAuthor?.id
          ? { ...author, memories: author.memories.filter((memory) => memory.id !== memoryId) }
          : author,
      ));
      setMyAuthor((current) => current
        ? { ...current, memories: current.memories.filter((memory) => memory.id !== memoryId) }
        : current);
      if (editingMemoryId === memoryId) {
        setEditingMemoryId(null);
        setMemoryDraft(EMPTY_MEMORY_DRAFT);
      }
    } catch (error) {
      setMemoryError(error instanceof Error ? error.message : copy.errors.deleteMemory);
    }
  };

  const handleDeleteCreation = async (creationId: number) => {
    if (!window.confirm(copy.errors.confirmDeleteWork)) return;
    setCreationError(null);
    try {
      const response = await fetch(`${API_ROOT}/authors-world/me/creations/${creationId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(payload.error ?? copy.errors.deleteWork);
      }
      setCreations((current) => current.filter((item) => item.id !== creationId));
      if (editingCreationId === creationId) {
        setEditingCreationId(null);
        setCreationDraft(EMPTY_CREATION_DRAFT);
        setAudioFile(null);
        setAudioError(null);
      }
    } catch (error) {
      setCreationError(error instanceof Error ? error.message : copy.errors.deleteWork);
    }
  };

  const handleSendChat = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = chatDraft.trim();
    if (!body || isSendingChat) return;

    setIsSendingChat(true);
    setChatError(null);
    try {
      const response = await fetch(`${API_ROOT}/authors-world/chat`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const payload = await response.json().catch(() => ({})) as {
        message?: ChatMessage;
        error?: string;
      };
      if (!response.ok || !payload.message) {
        throw new Error(payload.error ?? copy.chat.failed);
      }
      setChatMessages((current) =>
        current.some((item) => item.id === payload.message?.id)
          ? current
          : [...current, payload.message as ChatMessage].slice(-100),
      );
      setChatDraft("");
    } catch (error) {
      setChatError(error instanceof Error ? error.message : copy.chat.failed);
    } finally {
      setIsSendingChat(false);
    }
  };

  const handleEditChat = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = editingChatDraft.trim();
    if (!editingChatMessageId || !body || isUpdatingChat) return;

    setIsUpdatingChat(true);
    setChatError(null);
    try {
      const response = await fetch(`${API_ROOT}/authors-world/chat/${editingChatMessageId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const payload = await response.json().catch(() => ({})) as {
        message?: ChatMessage;
        error?: string;
      };
      if (!response.ok || !payload.message) {
        throw new Error(payload.error ?? copy.chat.editFailed);
      }
      setChatMessages((current) => current.map((item) =>
        item.id === payload.message?.id ? payload.message as ChatMessage : item,
      ));
      setEditingChatMessageId(null);
      setEditingChatDraft("");
    } catch (error) {
      setChatError(error instanceof Error ? error.message : copy.chat.editFailed);
    } finally {
      setIsUpdatingChat(false);
    }
  };

  const handleDeleteChat = async (messageId: number) => {
    if (!window.confirm(copy.chat.confirmDelete)) return;
    setChatError(null);
    try {
      const response = await fetch(`${API_ROOT}/authors-world/chat/${messageId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const payload = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? copy.chat.deleteFailed);
      setChatMessages((current) => current.filter((item) => item.id !== messageId));
      if (editingChatMessageId === messageId) {
        setEditingChatMessageId(null);
        setEditingChatDraft("");
      }
    } catch (error) {
      setChatError(error instanceof Error ? error.message : copy.chat.deleteFailed);
    }
  };

  const handleMarkNotificationRead = async (notificationId: number) => {
    try {
      const response = await fetch(`${API_ROOT}/authors-world/notifications/${notificationId}/read`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!response.ok) return;
      setNotifications((current) => current.map((notification) =>
        notification.id === notificationId ? { ...notification, isRead: true } : notification,
      ));
      setUnreadNotificationCount((current) => Math.max(0, current - 1));
    } catch {
      // The next inbox refresh will restore the server state.
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      const response = await fetch(`${API_ROOT}/authors-world/notifications/read-all`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) return;
      setNotifications((current) => current.map((notification) => ({ ...notification, isRead: true })));
      setUnreadNotificationCount(0);
    } catch {
      setNotificationsError(copy.notifications.failed);
    }
  };

  return (
    <main className="relative min-h-[calc(100dvh-82px)] overflow-hidden bg-transparent px-3 py-6 text-white sm:px-6 sm:py-10 lg:px-10">
      <div aria-hidden="true" className="authors-world-atmosphere pointer-events-none absolute inset-0" />
      <div aria-hidden="true" className="authors-world-orbit authors-world-orbit-outer pointer-events-none absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full" />

      <div className="authors-world-readable relative z-10 mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-5 border-b border-[#00f0ff]/20 pb-5 sm:mb-8 sm:gap-6 sm:pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link href="/" className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/45 transition-colors hover:text-[#00f0ff]">
              {copy.nav.back}
            </Link>
            <p className="mt-5 font-mono text-[9px] uppercase tracking-[0.22em] text-[#ffad7f] sm:mt-6 sm:text-[10px] sm:tracking-[0.32em]">{copy.nav.archive}</p>
            <h1 className="authors-world-title mt-2 font-creepster text-4xl tracking-[0.06em] text-[#00f0ff] sm:text-7xl sm:tracking-[0.08em]">
              {copy.nav.title}
            </h1>
            <p className="mt-2 max-w-2xl font-mono text-xs leading-relaxed text-white/65 sm:text-base">
              {copy.nav.intro}
            </p>
          </div>
          <div className="grid w-full gap-2 sm:flex sm:flex-wrap sm:gap-3 lg:w-auto">
            <button
              type="button"
              onClick={() => document.getElementById("authors-world-chat")?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="authors-world-top-action authors-world-control-purple inline-flex min-h-11 w-full items-center justify-center border px-4 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#eadcff] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a2be2] sm:min-h-12 sm:w-auto sm:px-5 sm:text-xs sm:tracking-[0.18em]"
            >
              {copy.nav.chat}
            </button>
            <button
              type="button"
               onClick={openAuthorPortal}
              className="authors-world-top-action authors-world-control-cyan inline-flex min-h-11 w-full items-center justify-center border px-4 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#d9fbff] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00f0ff] sm:min-h-12 sm:w-auto sm:px-5 sm:text-xs sm:tracking-[0.18em]"
            >
              {!authLoaded ? copy.nav.checking : !isSignedIn ? copy.nav.signInPortal : myAuthor ? copy.nav.editPortal : copy.nav.leaveMemory}
            </button>
          </div>
            <div className="authors-world-account-panel mt-3 flex flex-col gap-3 border p-3 sm:mt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-[#ffad7f]">
                  <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> {copy.account.title}
                </p>
                <div
                  className={`authors-world-session-status mt-2 ${!authLoaded ? "is-checking" : isSignedIn ? "is-active" : "is-signed-out"}`}
                  role="status"
                  aria-live="polite"
                >
                  <span className="authors-world-session-dot" aria-hidden="true" />
                  {!authLoaded && (
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.12em]">{copy.account.sessionChecking}</span>
                  )}
                  {authLoaded && !isSignedIn && (
                    <>
                      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.12em]">{copy.account.signedOut}</span>
                      <span className="ml-auto shrink-0 font-mono text-[9px] uppercase tracking-[0.1em]">{copy.account.description}</span>
                    </>
                  )}
                </div>
              </div>
             <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
               {!authLoaded ? (
                  <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/40">{copy.account.loading}</span>
               ) : isSignedIn ? (
                 <>
                   <button
                     type="button"
                      onClick={openMyPortalWorld}
                      disabled={authorsLoading}
                      aria-busy={authorsLoading}
                      className="authors-world-action-button authors-world-top-action authors-world-control-cyan inline-flex min-h-10 min-w-[10rem] items-center justify-center gap-1.5 border px-3 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[#d9fbff] transition-all disabled:cursor-wait disabled:opacity-50"
                   >
                       <Plus className="h-3.5 w-3.5" aria-hidden="true" /> {authorsLoading ? copy.account.loading : copy.account.myPortal}
                   </button>
                   <button
                     type="button"
                     onClick={() => void handleAuthorSignOut()}
                     className="authors-world-action-button authors-world-top-action authors-world-control-orange inline-flex min-h-10 min-w-[10rem] items-center justify-center gap-1.5 border px-3 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[#ffd0ba] transition-all"
                   >
                      <LogOut className="h-3.5 w-3.5" aria-hidden="true" /> {copy.account.signOut}
                   </button>
                 </>
               ) : (
                 <>
                   <Link
                     href="/sign-in"
                      className="authors-world-action-button authors-world-compact-action authors-world-control-cyan inline-flex min-h-10 min-w-[10rem] items-center justify-center gap-1.5 border px-3 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[#d9fbff] transition-all"
                   >
                      <LogIn className="h-3.5 w-3.5" aria-hidden="true" /> {copy.account.signIn}
                   </Link>
                   <Link
                     href="/sign-up"
                      className="authors-world-action-button authors-world-compact-action authors-world-control-orange inline-flex min-h-10 min-w-[10rem] items-center justify-center gap-1.5 border px-3 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[#ffe0c0] transition-all"
                   >
                      <Mail className="h-3.5 w-3.5" aria-hidden="true" /> {copy.account.signUp}
                   </Link>
                 </>
               )}
             </div>
           </div>
            {isSignedIn && myAuthor && (
              <section
                id="authors-world-notifications"
                 role={isNotificationsOpen && isMobileViewport ? "dialog" : undefined}
                 aria-modal={isNotificationsOpen && isMobileViewport ? true : undefined}
                data-open={isNotificationsOpen ? "true" : "false"}
                onMouseEnter={() => {
                  if (!isMobileViewport) setIsNotificationsOpen(true);
                }}
                  className={`authors-world-inbox-shell authors-world-telegram-inbox authors-world-account-panel mt-3 border p-3 sm:mt-4 ${isNotificationsOpen ? "authors-world-inbox-open" : ""} ${isNotificationsOpen && isMobileViewport ? "authors-world-inbox-mobile-fullscreen" : ""}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    {isNotificationsOpen && (
                      <button
                        type="button"
                        onClick={() => setIsNotificationsOpen(false)}
                        className="inline-flex min-h-10 shrink-0 items-center gap-1.5 border border-white/15 px-2.5 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-white/65 transition-colors hover:border-[#00f0ff]/60 hover:text-white md:hidden"
                        aria-label={copy.directMessages.back}
                      >
                        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> {copy.directMessages.back}
                      </button>
                    )}
                  <button
                   type="button"
                   onClick={() => setIsNotificationsOpen((current) => !current)}
                     className="authors-world-inbox-title inline-flex min-h-10 min-w-0 items-center gap-2 text-left font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#b9f7ff] transition-colors hover:text-white"
                   aria-expanded={isNotificationsOpen}
                   aria-controls="authors-world-notification-list"
                 >
                   <Bell className="h-4 w-4" aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="block truncate">{copy.notifications.title}</span>
                      <span className="mt-0.5 block font-mono text-[9px] font-normal uppercase tracking-[0.1em] text-white/35">
                        {isNotificationsOpen ? copy.account.portalReady : copy.account.sessionActive}
                      </span>
                    </span>
                    {unreadNotificationCount + directUnreadCount > 0 && (
                     <span className="inline-flex min-w-6 items-center justify-center rounded-full border border-[#ffad7f]/70 bg-[#ffad7f]/15 px-1.5 py-1 text-[9px] text-[#ffd0ba]">
                        {unreadNotificationCount + directUnreadCount}
                     </span>
                   )}
                 </button>
                  </div>
                  {isNotificationsOpen && (
                    <button
                      type="button"
                      onClick={() => setIsNotificationsOpen(false)}
                      className="inline-flex min-h-10 items-center gap-1.5 border border-white/15 px-2.5 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-white/55 transition-colors hover:border-[#00f0ff]/60 hover:text-white md:hidden"
                      aria-label={copy.notifications.close}
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" /> {copy.notifications.close}
                    </button>
                  )}
                  {isNotificationsOpen && inboxView === "mentions" && unreadNotificationCount > 0 && (
                   <button
                     type="button"
                     onClick={() => void handleMarkAllNotificationsRead()}
                     className="inline-flex min-h-9 items-center gap-1.5 border border-[#00f0ff]/30 px-2.5 font-mono text-[9px] uppercase tracking-[0.12em] text-[#8ceeff] transition-colors hover:border-[#00f0ff] hover:text-white"
                   >
                     <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" /> {copy.notifications.markAllRead}
                   </button>
                 )}
               </div>
               {isNotificationsOpen && (
                  <div id="authors-world-notification-list" className="authors-world-inbox-content mt-3 border-t border-white/10 pt-3">
                     <div className="authors-world-inbox-tabs mb-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setInboxView("mentions")}
                         className={`authors-world-inbox-tab min-h-9 border px-3 font-mono text-[9px] font-bold uppercase tracking-[0.12em] transition-colors ${inboxView === "mentions" ? "is-active border-[#ffad7f]/70 bg-[#ffad7f]/10 text-[#ffd0ba]" : "border-white/15 text-white/45 hover:border-white/35 hover:text-white"}`}
                      >
                        <Bell className="mr-1.5 inline h-3.5 w-3.5" aria-hidden="true" /> {copy.notifications.title}
                        {unreadNotificationCount > 0 && <span className="ml-1.5 text-[#ffad7f]">({unreadNotificationCount})</span>}
                      </button>
                      <button
                        type="button"
                        onClick={() => setInboxView("direct")}
                         className={`authors-world-inbox-tab min-h-9 border px-3 font-mono text-[9px] font-bold uppercase tracking-[0.12em] transition-colors ${inboxView === "direct" ? "is-active border-[#00f0ff]/70 bg-[#00f0ff]/10 text-[#b9f7ff]" : "border-white/15 text-white/45 hover:border-white/35 hover:text-white"}`}
                      >
                        <Mail className="mr-1.5 inline h-3.5 w-3.5" aria-hidden="true" /> {copy.directMessages.title}
                        {directUnreadCount > 0 && <span className="ml-1.5 text-[#ffad7f]">({directUnreadCount})</span>}
                      </button>
                       <button
                         type="button"
                         onClick={() => setInboxView("general")}
                          className={`authors-world-inbox-tab min-h-9 border px-3 font-mono text-[9px] font-bold uppercase tracking-[0.12em] transition-colors ${inboxView === "general" ? "is-active border-[#8a2be2]/70 bg-[#8a2be2]/15 text-[#d7b6ff]" : "border-white/15 text-white/45 hover:border-white/35 hover:text-white"}`}
                       >
                         <MessageCircle className="mr-1.5 inline h-3.5 w-3.5" aria-hidden="true" /> {copy.notifications.generalChat}
                       </button>
                    </div>
                    {inboxView === "mentions" ? (
                      notificationsLoading ? (
                        <p className="font-mono text-xs text-white/45">{copy.notifications.loading}</p>
                      ) : notificationsError ? (
                        <p className="font-mono text-xs text-[#ffb184]">{notificationsError}</p>
                      ) : notifications.length === 0 ? (
                        <p className="font-mono text-xs leading-relaxed text-white/45">{copy.notifications.empty}</p>
                      ) : (
                        <div className="authors-world-message-scroll max-h-72 space-y-2 overflow-y-scroll pr-1 sm:max-h-[52vh]">
                          {notifications.map((notification) => (
                            <article
                              key={notification.id}
                              className={`authors-world-message-row flex gap-3 px-2 py-2 ${notification.isRead ? "is-read" : "is-unread"}`}
                            >
                              <MessagingAvatar name={notification.actor.displayName} avatarUrl={notification.actor.avatarUrl} size="md" />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                  <p className="min-w-0 font-mono text-xs leading-relaxed text-white/75">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (!notification.isRead) void handleMarkNotificationRead(notification.id);
                                        addressAuthor(notification.actor);
                                      }}
                                      className="font-bold text-[#ffad7f] underline decoration-[#ffad7f]/45 underline-offset-2 hover:text-white"
                                      aria-label={formatAuthorsWorldCopy(copy.chat.replyTo, { name: notification.actor.displayName })}
                                      title={formatAuthorsWorldCopy(copy.chat.replyTo, { name: notification.actor.displayName })}
                                    >
                                      {notification.actor.displayName}
                                    </button>{" "}
                                    {copy.notifications.mentionedYou}
                                  </p>
                                  {!notification.isRead && (
                                    <button
                                      type="button"
                                      onClick={() => void handleMarkNotificationRead(notification.id)}
                                      className="shrink-0 rounded-full p-1 text-[#8ceeff] transition-colors hover:bg-white/10 hover:text-white"
                                      aria-label={copy.notifications.markRead}
                                      title={copy.notifications.markRead}
                                    >
                                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                                    </button>
                                  )}
                                </div>
                                <div className="authors-world-message-bubble authors-world-message-bubble-incoming mt-1">
                                  <p className="whitespace-pre-wrap break-words font-mono text-[10px] leading-relaxed text-white/65">{notification.body}</p>
                                  <time className="mt-1 block text-right font-mono text-[9px] text-white/25" dateTime={notification.createdAt}>
                                    {new Date(notification.createdAt).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" })}
                                  </time>
                                </div>
                              </div>
                            </article>
                          ))}
                        </div>
                      )
                    ) : inboxView === "general" ? (
                      <div className="authors-world-thread flex min-h-0 flex-1 flex-col">
                        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 pb-3">
                          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#d7b6ff]">{copy.notifications.generalChat}</p>
                          <button
                            type="button"
                            onClick={() => setInboxView("direct")}
                            className="inline-flex min-h-9 items-center gap-1.5 border border-[#8a2be2]/45 px-2.5 font-mono text-[9px] uppercase tracking-[0.12em] text-[#d7b6ff] transition-colors hover:border-[#00f0ff]/70 hover:text-white"
                          >
                            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> {copy.directMessages.back}
                          </button>
                        </div>
                        <div className="authors-world-message-scroll mt-3 min-h-0 max-h-72 flex-1 space-y-3 overflow-y-scroll pr-1 sm:max-h-[52vh]">
                          {chatLoading ? (
                            <p className="font-mono text-xs text-white/45">{copy.chat.loading}</p>
                          ) : chatError ? (
                            <p className="font-mono text-xs text-[#ffb184]">{chatError}</p>
                          ) : chatMessages.length === 0 ? (
                            <p className="py-4 text-center font-mono text-xs text-white/45">{copy.chat.empty}</p>
                           ) : chatMessages.map((message) => (
                             <article key={message.id} className="authors-world-message-row flex gap-3 px-2 py-2">
                               <MessagingAvatar name={message.author.displayName} avatarUrl={message.author.avatarUrl} size="md" />
                               <div className="min-w-0 flex-1">
                                 <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                   <button
                                     type="button"
                                     onClick={() => addressAuthor(message.author)}
                                     className="font-mono text-xs font-bold text-[#8ceeff] transition-colors hover:text-white"
                                     aria-label={formatAuthorsWorldCopy(copy.chat.replyTo, { name: message.author.displayName })}
                                   >
                                     {message.author.displayName}
                                   </button>
                                   <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#ffad7f]/70">{message.author.role}</span>
                                 </div>
                                 <div className="authors-world-message-bubble authors-world-message-bubble-incoming mt-1">
                                   <p className="whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-white/75">
                                     <ChatMessageBody message={message} />
                                   </p>
                                   <time className="mt-1 block text-right font-mono text-[9px] text-white/25" dateTime={message.createdAt}>
                                     {new Date(message.createdAt).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" })}
                                   </time>
                                 </div>
                               </div>
                             </article>
                          ))}
                        </div>
                        <form onSubmit={handleSendChat} className="authors-world-composer mt-3 flex shrink-0 items-end gap-2 border-t border-white/10 pt-3">
                          <label className="min-w-0 flex-1">
                            <span className="sr-only">{copy.chat.placeholder}</span>
                             <input
                              ref={generalChatInputRef}
                               type="text"
                              value={chatDraft}
                              onChange={(event) => {
                                setChatDraft(event.target.value);
                                setChatCursorPosition(event.target.selectionStart ?? event.target.value.length);
                              }}
                              onSelect={(event) => setChatCursorPosition(event.currentTarget.selectionStart ?? event.currentTarget.value.length)}
                              maxLength={1000}
                              placeholder={copy.chat.placeholder}
                               enterKeyHint="send"
                               className="authors-world-composer-input h-11 w-full rounded-2xl border px-4 font-mono text-xs text-white outline-none placeholder:text-white/25 focus:border-[#8a2be2]/70"
                            />
                          </label>
                          <button
                            type="submit"
                            disabled={isSendingChat || !chatDraft.trim()}
                             className="authors-world-send-button inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border px-3 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-[#d7b6ff] disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label={isSendingChat ? copy.chat.sending : copy.chat.send}
                            title={isSendingChat ? copy.chat.sending : copy.chat.send}
                          >
                            <Send className="h-4 w-4" aria-hidden="true" />
                             <span>{copy.chat.send}</span>
                          </button>
                        </form>
                        {chatError && <p className="mt-2 font-mono text-xs text-[#ffb184]">{chatError}</p>}
                      </div>
                    ) : (
                      <div className={`authors-world-direct-layout ${directThread ? "has-thread" : ""}`}>
                        <div className="authors-world-conversation-list">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/40">{copy.directMessages.title}</p>
                            {directUnreadCount > 0 && <span className="font-mono text-[9px] text-[#ffad7f]">{formatAuthorsWorldCopy(copy.directMessages.unread, { count: directUnreadCount })}</span>}
                          </div>
                          {directLoading ? (
                            <p className="font-mono text-xs text-white/45">{copy.notifications.loading}</p>
                          ) : directError && !directThread ? (
                            <p className="font-mono text-xs text-[#ffb184]">{directError}</p>
                          ) : (
                            <div className="authors-world-message-scroll authors-world-conversation-scroll space-y-1 overflow-y-scroll pr-1">
                               <button
                                 type="button"
                                 onClick={() => {
                                   setDirectThread(null);
                                   setSelectedDirectSlug(null);
                                   setInboxView("general");
                                 }}
                                 className="authors-world-conversation-row authors-world-general-conversation-row"
                                 aria-label={`${copy.notifications.openGeneralChat}: ${copy.notifications.generalChat}`}
                               >
                                 <MessagingAvatar name={copy.notifications.generalChat} size="lg" />
                                 <span className="min-w-0 flex-1 text-left">
                                   <span className="block whitespace-nowrap font-mono text-xs font-bold text-[#d7b6ff]">{copy.notifications.generalChat}</span>
                                   <span className="mt-1 block whitespace-normal break-words font-mono text-[10px] leading-relaxed text-white/45">{copy.directMessage.modePublic}</span>
                                 </span>
                                 <MessageCircle className="h-4 w-4 shrink-0 text-[#d7b6ff]/70" aria-hidden="true" />
                               </button>
                               {directConversations.length === 0 && (
                                 <p className="px-2 py-3 font-mono text-xs leading-relaxed text-white/45">{copy.directMessages.empty}</p>
                               )}
                              {directConversations.map((conversation) => (
                                <button
                                  key={conversation.id}
                                  type="button"
                                  onClick={() => void openDirectConversation(conversation)}
                                  className={`authors-world-conversation-row ${conversation.unreadCount > 0 ? "has-unread" : ""} ${selectedDirectSlug === conversation.author.slug ? "is-selected" : ""}`}
                                  aria-label={`${copy.directMessages.open}: ${conversation.author.displayName}`}
                                >
                                  <MessagingAvatar name={conversation.author.displayName} avatarUrl={conversation.author.avatarUrl} size="lg" />
                                  <span className="min-w-0 flex-1 text-left">
                                    <span className="flex items-center justify-between gap-2">
                                      <span className="whitespace-nowrap font-mono text-xs font-bold text-[#d9fbff]">{conversation.author.displayName}</span>
                                      {conversation.lastMessage && (
                                        <time className="shrink-0 font-mono text-[9px] text-white/30" dateTime={conversation.lastMessage.createdAt}>
                                          {new Date(conversation.lastMessage.createdAt).toLocaleDateString(locale)}
                                        </time>
                                      )}
                                    </span>
                                    <span className="mt-1 block whitespace-normal break-words font-mono text-[10px] leading-relaxed text-white/45">
                                      {conversation.lastMessage?.body ?? copy.directMessages.empty}
                                    </span>
                                  </span>
                                  {conversation.unreadCount > 0 && (
                                    <span className="authors-world-unread-badge">{conversation.unreadCount}</span>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        {directThread && (
                          <div className="authors-world-thread flex min-h-0 flex-1 flex-col">
                            <div className="authors-world-thread-header flex shrink-0 items-center gap-3 border-b border-white/10 pb-3">
                              <button
                                type="button"
                                onClick={() => {
                                  setDirectThread(null);
                                  setSelectedDirectSlug(null);
                                }}
                                className="authors-world-thread-back inline-flex min-h-9 items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-[#8ceeff] hover:text-white"
                              >
                                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> {copy.directMessages.back}
                              </button>
                              <MessagingAvatar name={directThread.author.displayName} avatarUrl={directThread.author.avatarUrl} size="sm" />
                              <div className="min-w-0">
                                <p className="whitespace-nowrap font-mono text-xs font-bold text-[#d9fbff]">{directThread.author.displayName}</p>
                                <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#ffcf9e]">{copy.directMessages.privateLabel}</p>
                              </div>
                            </div>
                            <div className="authors-world-message-scroll authors-world-thread-scroll mt-3 min-h-0 flex-1 space-y-2 overflow-y-scroll pr-1">
                              {directThread.messages.length === 0 ? (
                                <p className="py-4 text-center font-mono text-xs text-white/45">{copy.directMessages.empty}</p>
                              ) : directThread.messages.map((message) => {
                                const isMine = message.sender.id === Number(myAuthor.id);
                                return (
                                  <article key={message.id} className={`authors-world-direct-message flex gap-2 ${isMine ? "is-mine" : "is-theirs"}`}>
                                    {!isMine && <MessagingAvatar name={message.sender.displayName} avatarUrl={message.sender.avatarUrl} size="sm" />}
                                    <div className="max-w-[88%] min-w-0">
                                      <div className={`authors-world-message-bubble ${isMine ? "authors-world-message-bubble-outgoing" : "authors-world-message-bubble-incoming"}`}>
                                        {!isMine && <p className="mb-1 font-mono text-[9px] font-bold text-[#ffad7f]">{message.sender.displayName}</p>}
                                        <p className="whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-white/80">{message.body}</p>
                                        <div className="mt-1 flex items-center justify-end gap-1 font-mono text-[9px] text-white/30">
                                          <time dateTime={message.createdAt}>
                                            {new Date(message.createdAt).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
                                          </time>
                                          {isMine && <CheckCheck className="h-3 w-3 text-[#8ceeff]/70" aria-hidden="true" />}
                                        </div>
                                      </div>
                                    </div>
                                  </article>
                                );
                              })}
                            </div>
                            <div className="authors-world-reply-mode mt-3 border-t border-white/10 pt-3">
                              <div className="flex flex-wrap gap-2" role="group" aria-label={copy.directMessage.title}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDirectSendMode("private");
                                    setDirectNotice(null);
                                  }}
                                  className={`authors-world-reply-mode-button ${directSendMode === "private" ? "is-active is-private" : ""}`}
                                >
                                  {copy.directMessage.modePrivate}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDirectSendMode("public");
                                    setDirectNotice(null);
                                  }}
                                  className={`authors-world-reply-mode-button ${directSendMode === "public" ? "is-active is-public" : ""}`}
                                >
                                  {copy.directMessage.modePublic}
                                </button>
                              </div>
                              <p className="mt-2 font-mono text-[10px] leading-relaxed text-white/45">
                                {formatAuthorsWorldCopy(
                                  directSendMode === "public" ? copy.directMessage.publicDescription : copy.directMessage.privateDescription,
                                  { name: directThread.author.displayName },
                                )}
                              </p>
                            </div>
                            <form onSubmit={sendDirectReply} className="authors-world-composer mt-3 flex shrink-0 items-end gap-2">
                              <label className="min-w-0 flex-1">
                                <span className="sr-only">{formatAuthorsWorldCopy(copy.directMessage.placeholder, { name: directThread.author.displayName })}</span>
                                <input
                                  type="text"
                                  value={directDraft}
                                  onChange={(event) => setDirectDraft(event.target.value)}
                                  maxLength={1000}
                                  placeholder={formatAuthorsWorldCopy(copy.directMessage.placeholder, { name: directThread.author.displayName })}
                                  enterKeyHint="send"
                                  className="authors-world-composer-input h-11 w-full rounded-2xl border px-4 font-mono text-xs text-white outline-none placeholder:text-white/25 focus:border-[#00f0ff]/70"
                                />
                              </label>
                              <button
                                type="submit"
                                disabled={isSendingDirect || !directDraft.trim()}
                                 className="authors-world-send-button inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border px-3 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-[#b9f7ff] disabled:cursor-not-allowed disabled:opacity-40"
                                 aria-label={isSendingDirect ? copy.directMessage.sending : directSendMode === "public" ? copy.directMessage.sendPublic : copy.directMessage.sendPrivate}
                                 title={isSendingDirect ? copy.directMessage.sending : directSendMode === "public" ? copy.directMessage.sendPublic : copy.directMessage.sendPrivate}
                              >
                                <Send className="h-4 w-4" aria-hidden="true" />
                                <span>{copy.chat.send}</span>
                              </button>
                            </form>
                             {directNotice && <p className="mt-2 font-mono text-xs leading-relaxed text-[#68f6a6]">{directNotice}</p>}
                            {directError && <p className="mt-2 font-mono text-xs text-[#ffb184]">{directError}</p>}
                          </div>
                        )}
                      </div>
                   )}
                 </div>
               )}
             </section>
           )}
        </div>

        <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
             <h2 className="font-creepster text-2xl tracking-[0.1em] text-[#ffcf9e] sm:text-3xl sm:tracking-[0.12em]">{copy.world.title}</h2>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
               {authorsLoading ? copy.world.connecting : formatAuthorsWorldCopy(copy.world.portals, { count: visibleAuthors.length })}
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-1.5 sm:items-end">
             <label className="authors-world-search-control flex min-h-11 items-center border px-3 sm:w-80">
               <span className="mr-2 font-mono text-[10px] font-bold uppercase tracking-widest text-[#b9f7ff]">{copy.world.search}</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                 placeholder={copy.world.searchPlaceholder}
                className="min-w-0 flex-1 bg-transparent font-mono text-xs text-white outline-none placeholder:text-white/25"
                 aria-label={copy.world.searchAria}
              />
            </label>
            <p role="status" className="min-h-4 font-mono text-[9px] uppercase tracking-[0.14em] text-[#00f0ff]/60">
              {search.trim()
                ? visibleAuthors.length > 0
                   ? formatAuthorsWorldCopy(copy.world.found, { name: visibleAuthors[0].name })
                   : copy.world.notFound
                 : copy.world.searchHint}
            </p>
          </div>
        </div>

        <section
          ref={worldViewportRef}
          onPointerDown={handleWorldPointerDown}
          onPointerMove={handleWorldPointerMove}
          onPointerUp={finishWorldPointerDrag}
          onPointerCancel={finishWorldPointerDrag}
          onWheelCapture={handleWorldWheel}
          className={`authors-world-surface relative h-[min(48dvh,420px)] min-h-[300px] overflow-hidden overscroll-none touch-none select-none sm:h-[min(70dvh,760px)] sm:min-h-[560px] ${
            isWorldDragging ? "cursor-grabbing" : "cursor-grab"
          }`}
          aria-label={copy.world.navigationAria}
        >
          {isMobileViewport ? (
            <img
              aria-hidden="true"
              src={authorGardenMistPoster}
              className="authors-world-garden-poster pointer-events-none absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <video
              aria-hidden="true"
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              poster={authorGardenMistPoster}
              className="authors-world-garden-video pointer-events-none absolute inset-0 h-full w-full object-cover"
            >
              <source src={authorGardenMist} type="video/mp4" />
            </video>
          )}
          <div
            aria-hidden="true"
            className="authors-world-surface-glow pointer-events-none absolute inset-0"
          />
          <div aria-hidden="true" className="authors-world-orbit authors-world-orbit-middle pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full" />

          <div
            className="absolute left-0 top-0 will-change-transform"
            style={{ transform: `translate3d(${worldPan.x}px, ${worldPan.y}px, 0)` }}
          >
            <div
              className="authors-world-map relative overflow-visible"
              style={{ width: `${worldSize.width}px`, height: `${worldSize.height}px`, zoom: worldZoom }}
            >
              <div aria-hidden="true" className="absolute left-[12%] top-[27%] h-px w-[74%] rotate-[9deg] bg-gradient-to-r from-transparent via-[#00f0ff]/35 to-transparent" />
              <div aria-hidden="true" className="absolute left-[6%] top-[64%] h-px w-[84%] -rotate-[13deg] bg-gradient-to-r from-transparent via-[#8a2be2]/35 to-transparent" />
              <div aria-hidden="true" className="absolute left-[48%] top-[8%] h-[82%] w-px rotate-[18deg] bg-gradient-to-b from-transparent via-[#00f0ff]/20 to-transparent" />
              <div aria-hidden="true" className="authors-world-orbit authors-world-orbit-inner absolute left-1/2 top-[42%] h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full" />
              <div aria-hidden="true" className="authors-world-gotf-dots absolute inset-0" />
              <div className="pointer-events-none absolute inset-x-0 top-4 text-center font-mono text-[9px] uppercase tracking-[0.35em] text-[#00f0ff]/35">
                 {copy.world.coordinates}
              </div>
              {visibleAuthors.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
                  <p className="max-w-sm font-mono text-sm leading-relaxed text-white/50">
                     {authorsError ?? copy.world.quiet}
                  </p>
                </div>
              ) : (
                  <>
                    {hoveredAuthorId && (
                      <button
                        type="button"
                         aria-label={copy.world.closePortal}
                        onClick={() => setHoveredAuthorId(null)}
                         className="absolute inset-0 z-[500] cursor-default bg-transparent transition-opacity duration-200"
                      />
                    )}
                    {visibleAuthors.map((author) => {
                      const authorIndex = authors.findIndex((item) => item.id === author.id);
                       const authorPosition = worldLayout.positions[authorIndex] ?? worldPositionFor(authorIndex, isCompactViewport);
                      const shouldShowMemories = !isCompactViewport || author.id === selectedAuthorId;
                      const memorySize = Math.max(42, 72 - Math.min(author.memories.length, 20) * 1.25);
                      return hoveredAuthorId && hoveredAuthorId !== author.id ? null : (
                        <div key={author.id}>
                          {shouldShowMemories && author.memories.map((memory, memoryIndex) => {
                            const position = memoryPositionFor(authorPosition, memoryIndex, author.memories.length, isCompactViewport);
                            return (
                              <div key={memory.id}>
                                <div
                                  aria-hidden="true"
                                  className="pointer-events-none absolute z-[140] h-px origin-left bg-gradient-to-r from-[#ffcf9e]/75 via-[#00f0ff]/45 to-transparent"
                                  style={{
                                    left: `${authorPosition.left}px`,
                                    top: `${authorPosition.top}px`,
                                    width: `${Math.hypot(position.left - authorPosition.left, position.top - authorPosition.top)}px`,
                                    transform: `rotate(${Math.atan2(position.top - authorPosition.top, position.left - authorPosition.left)}rad)`,
                                  }}
                                />
                                <MemoryNode
                                  memory={memory}
                                  position={position}
                                  size={memorySize}
                                  ariaLabel={`${memory.title}. ${copy.memory.open}`}
                                 onSelect={() => setLocation(`/author/${author.slug}/memory/${memory.id}`)}
                                />
                              </div>
                            );
                          })}
                          <AuthorNode
                            author={author}
                            ariaLabel={`${author.name}, ${author.role}. ${copy.selected.open}`}
                            position={authorPosition}
                            active={author.id === selectedAuthorId}
                            expanded={author.id === hoveredAuthorId}
                            locating={author.id === locatingAuthorId}
                            nodeRef={(node) => {
                              authorNodeRefs.current[author.id] = node;
                            }}
                            onHoverChange={(expanded) => setHoveredAuthorId(expanded ? author.id : null)}
                            onSelect={() => {
                              setSelectedAuthorId(author.id);
                              setLocation(`/author/${author.slug}`);
                            }}
                          />
                        </div>
                      );
                    })}
                  </>
              )}
            </div>
          </div>

          <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-3 p-3 sm:p-4">
            <div className="pointer-events-auto border border-[#00f0ff]/25 bg-black/20 px-3 py-2 backdrop-blur-sm">
              <p className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-[#b9f7ff]/75">
                <Move size={13} aria-hidden="true" />
                 {copy.world.drag}
              </p>
              <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.14em] text-white/35">
                GOTF // {Math.round(worldZoom * 100)}%
              </p>
            </div>
            <div className="pointer-events-auto flex items-center gap-1 border border-[#00f0ff]/25 bg-black/20 p-1 backdrop-blur-sm">
              <button
                type="button"
                 aria-label={copy.world.zoomOut}
                onClick={() => changeWorldZoom(worldZoom - WORLD_ZOOM_STEP)}
                className="inline-flex h-9 w-9 items-center justify-center border border-white/15 text-[#b9f7ff] transition-colors hover:border-[#00f0ff] hover:bg-[#00f0ff]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00f0ff]"
              >
                <ZoomOut size={16} />
              </button>
              <span className="min-w-12 text-center font-mono text-[10px] text-[#ffcf9e]">{Math.round(worldZoom * 100)}%</span>
              <button
                type="button"
                 aria-label={copy.world.zoomIn}
                onClick={() => changeWorldZoom(worldZoom + WORLD_ZOOM_STEP)}
                className="inline-flex h-9 w-9 items-center justify-center border border-white/15 text-[#b9f7ff] transition-colors hover:border-[#00f0ff] hover:bg-[#00f0ff]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00f0ff]"
              >
                <ZoomIn size={16} />
              </button>
              <button
                type="button"
                 aria-label={copy.world.center}
                onClick={() => centerWorld()}
                 title={copy.world.center}
                className="ml-1 inline-flex h-9 w-9 items-center justify-center border border-[#8a2be2]/45 text-[#d7b6ff] transition-colors hover:border-[#8a2be2] hover:bg-[#8a2be2]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a2be2]"
              >
                <LocateFixed size={16} />
              </button>
            </div>
          </div>
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="border border-white/10 bg-black/25 p-5">
             <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#ffad7f]">{copy.steps.heading}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
               {copy.steps.items.map(([number, title, text]: string[]) => (
                 <div key={number} className="authors-world-step-card">
                   <span className="authors-world-step-number font-mono text-[10px] text-[#b9f7ff]">{number}</span>
                  <h3 className="mt-2 font-creepster text-xl tracking-[0.12em] text-[#ffcf9e]">{title}</h3>
                   <p className="mt-1 font-mono text-xs leading-relaxed text-white/75">{text}</p>
                </div>
              ))}
            </div>
          </section>

          {selectedAuthor ? (
            <section className="border border-[#00f0ff]/35 bg-[#06111a]/75 p-5 shadow-[0_0_25px_rgba(0,240,255,0.1)]">
               <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#00f0ff]">{copy.selected.open}</p>
              <div className="mt-3 flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden border border-[#00f0ff]/50 bg-[radial-gradient(circle,rgba(0,240,255,0.24),rgba(10,5,24,0.95)_68%)] font-mono text-sm font-bold tracking-[0.14em] text-[#b9f7ff]">
                  {selectedAuthor.avatarUrl ? (
                     <img src={selectedAuthor.avatarUrl} alt={formatAuthorsWorldCopy(copy.selected.portrait, { name: selectedAuthor.name })} className="authors-world-avatar-image h-full w-full" />
                  ) : (
                    selectedAuthor.initials
                  )}
                </div>
                 <div className="min-w-0 flex-1">
                   <h2 className="break-words font-creepster text-2xl leading-tight tracking-[0.06em] text-white drop-shadow-[0_0_12px_rgba(255,45,149,0.55)] sm:text-3xl sm:tracking-[0.1em]">{selectedAuthor.name}</h2>
                   <p className="mt-1 break-words font-mono text-[10px] uppercase tracking-[0.14em] text-[#ffad7f] sm:tracking-[0.18em]">{selectedAuthor.role}</p>
                </div>
              </div>
              <p className="mt-5 font-mono text-sm leading-relaxed text-white/70">“{selectedAuthor.memory}”</p>
              {selectedAuthor.links.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {selectedAuthor.links.map((link) => (
                    <a
                      key={`${selectedAuthor.id}-${link.url}`}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border border-[#8a2be2]/60 bg-[#8a2be2]/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#d7b6ff] transition-colors hover:border-[#00f0ff] hover:bg-[#00f0ff]/10 hover:text-white"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              )}
              <Link
                href={`/author/${selectedAuthor.slug}`}
                className="mt-5 inline-flex min-h-11 max-w-full items-center justify-center border border-[#00f0ff]/65 bg-[#00f0ff]/10 px-4 text-center font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#b9f7ff] transition-colors hover:bg-[#00f0ff]/20 hover:text-white sm:tracking-[0.16em]"
              >
                 {copy.selected.openAll}
              </Link>
            </section>
          ) : (
            <section className="flex items-center border border-white/10 bg-black/25 p-5">
               <p className="font-mono text-sm leading-relaxed text-white/45">{copy.selected.choose}</p>
            </section>
          )}
        </div>

        <section
          id="authors-world-chat"
          className="mt-5 scroll-mt-6 border border-[#8a2be2]/55 bg-[#090711]/45 p-5 shadow-[inset_0_0_45px_rgba(138,43,226,0.08),0_0_28px_rgba(0,0,0,0.35)]"
          style={{
            backgroundImage: `linear-gradient(rgba(2, 4, 10, 0.42), rgba(2, 4, 10, 0.62)), url("${import.meta.env.BASE_URL}authors-room-background.png")`,
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundSize: "100% 100%, 100% 100%",
          }}
        >
          <div className="flex flex-col gap-4 border-b border-[#8a2be2]/25 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
               <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#ffad7f]">{copy.chat.eyebrow}</p>
              <h2 className="mt-2 font-creepster text-4xl tracking-[0.12em] text-[#d7b6ff] drop-shadow-[0_0_10px_rgba(138,43,226,0.55)]">
                 {copy.chat.title}
              </h2>
              <p className="mt-1 max-w-2xl font-mono text-xs leading-relaxed text-white/45">
                 {copy.chat.description}
              </p>
            </div>
            <div className="border border-[#00f0ff]/25 bg-black/30 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.16em] text-[#8ceeff]">
               {myAuthor ? copy.chat.connected : copy.chat.required}
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_250px]">
             <div className="min-h-56 border border-[#00f0ff]/20 bg-[#02070d]/90 p-3 sm:min-h-72">
              <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2 font-mono text-[9px] uppercase tracking-[0.16em] text-white/35">
                 <span>{copy.chat.room}</span>
                <span className="text-[#00f0ff]">{chatMessages.length}/100</span>
              </div>
               <div className="max-h-80 min-h-44 space-y-3 overflow-y-auto pr-2 [scrollbar-color:#8a2be244_#02070d] sm:max-h-96 sm:min-h-56">
                {chatLoading ? (
                   <p className="font-mono text-xs text-white/40">{copy.chat.loading}</p>
                ) : chatMessages.length === 0 ? (
                  <p className="font-mono text-xs leading-relaxed text-white/40">
                     {copy.chat.empty}
                  </p>
                ) : (
                  chatMessages.map((message) => {
                    const isOwnMessage = myAuthor?.id === String(message.author.id);
                    const isEditing = editingChatMessageId === message.id;
                    return (
                      <article key={message.id} className="border-l border-[#00f0ff]/35 pl-3">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <button
                            type="button"
                            onClick={() => addressAuthor(message.author)}
                            className="font-mono text-xs font-bold text-[#8ceeff] transition-colors hover:text-white"
                            aria-label={formatAuthorsWorldCopy(copy.chat.replyTo, { name: message.author.displayName })}
                            title={formatAuthorsWorldCopy(copy.chat.replyTo, { name: message.author.displayName })}
                          >
                            {message.author.displayName}
                          </button>
                          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#ffad7f]/70">{message.author.role}</span>
                          <time className="font-mono text-[9px] text-white/25" dateTime={message.createdAt}>
                            {new Date(message.createdAt).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
                          </time>
                          {message.editedAt && <span className="font-mono text-[9px] text-white/25">({copy.chat.edited})</span>}
                          {isOwnMessage && !isEditing && (
                            <span className="ml-auto flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingChatMessageId(message.id);
                                  setEditingChatDraft(message.body);
                                }}
                                className="p-1 text-white/35 transition-colors hover:text-[#8ceeff]"
                                aria-label={copy.chat.edit}
                                title={copy.chat.edit}
                              >
                                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDeleteChat(message.id)}
                                className="p-1 text-white/35 transition-colors hover:text-[#ffad7f]"
                                aria-label={copy.chat.delete}
                                title={copy.chat.delete}
                              >
                                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                              </button>
                            </span>
                          )}
                        </div>
                        {isEditing ? (
                          <form onSubmit={handleEditChat} className="mt-2 flex flex-col gap-2 sm:flex-row">
                            <input
                              value={editingChatDraft}
                              onChange={(event) => setEditingChatDraft(event.target.value)}
                              maxLength={1000}
                              autoFocus
                              className="min-h-10 min-w-0 flex-1 border border-[#00f0ff]/40 bg-black/35 px-2 font-mono text-sm text-white outline-none focus:border-[#00f0ff]"
                              aria-label={copy.chat.editInputLabel}
                            />
                            <span className="flex gap-2">
                              <button
                                type="submit"
                                disabled={isUpdatingChat || !editingChatDraft.trim()}
                                className="inline-flex min-h-10 items-center justify-center border border-[#00f0ff]/50 px-3 text-[#8ceeff] disabled:opacity-40"
                                aria-label={copy.chat.saveEdit}
                                title={copy.chat.saveEdit}
                              >
                                <Check className="h-4 w-4" aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingChatMessageId(null);
                                  setEditingChatDraft("");
                                }}
                                className="inline-flex min-h-10 items-center justify-center border border-white/15 px-3 text-white/55 hover:text-white"
                                aria-label={copy.chat.cancelEdit}
                                title={copy.chat.cancelEdit}
                              >
                                <X className="h-4 w-4" aria-hidden="true" />
                              </button>
                            </span>
                          </form>
                        ) : (
                          <p className="mt-1 whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-white/70">
                            <ChatMessageBody message={message} />
                          </p>
                        )}
                      </article>
                    );
                  })
                )}
              </div>
            </div>

            <aside className="border border-[#8a2be2]/25 bg-[#10091b]/65 p-4">
               <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#ffad7f]">{copy.chat.status}</p>
              <div className="mt-4 space-y-3 font-mono text-[10px] text-white/55">
                 {copy.chat.statusItems.map((item: string) => <p key={item}><span className="mr-2 text-[#00f0ff]">●</span>{item}</p>)}
              </div>
            </aside>
          </div>

          {chatError && (
            <p className="mt-3 border border-[#ff7043]/35 bg-[#ff7043]/5 px-3 py-2 font-mono text-xs text-[#ffb184]">{chatError}</p>
          )}

          {myAuthor ? (
            <form onSubmit={handleSendChat} className="mt-4 flex flex-col gap-3 sm:flex-row">
               <label className="sr-only" htmlFor="authors-world-chat-input">{copy.chat.inputLabel}</label>
              <div className="relative min-w-0 flex-1">
                <input
                  ref={chatInputRef}
                  id="authors-world-chat-input"
                  value={chatDraft}
                  onChange={(event) => {
                    setChatDraft(event.target.value);
                    setChatCursorPosition(event.target.selectionStart ?? event.target.value.length);
                    setMentionHighlightIndex(0);
                  }}
                  onClick={(event) => setChatCursorPosition(event.currentTarget.selectionStart ?? 0)}
                  onKeyUp={(event) => setChatCursorPosition(event.currentTarget.selectionStart ?? 0)}
                  onKeyDown={(event) => {
                    if (mentionCandidates.length === 0) return;
                    if (event.key === "ArrowDown") {
                      event.preventDefault();
                      setMentionHighlightIndex((current) => (current + 1) % mentionCandidates.length);
                    } else if (event.key === "ArrowUp") {
                      event.preventDefault();
                      setMentionHighlightIndex((current) => (current - 1 + mentionCandidates.length) % mentionCandidates.length);
                    } else if (event.key === "Enter") {
                      event.preventDefault();
                      selectMention(mentionCandidates[mentionHighlightIndex] ?? mentionCandidates[0]);
                    } else if (event.key === "Escape") {
                      setChatCursorPosition(0);
                    }
                  }}
                  maxLength={1000}
                  placeholder={formatAuthorsWorldCopy(copy.chat.placeholder, { name: myAuthor.name })}
                  className="min-h-12 w-full border border-white/15 bg-black/35 px-3 font-mono text-sm text-white outline-none placeholder:text-white/25 focus:border-[#00f0ff]/60"
                />
                {mentionCandidates.length > 0 && mentionContext && (
                  <div role="listbox" aria-label={copy.chat.mentionSuggestions} className="absolute inset-x-0 bottom-full z-30 mb-1 border border-[#00f0ff]/40 bg-[#06111a] p-1 shadow-[0_0_25px_rgba(0,240,255,0.16)]">
                    <p className="px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-white/35">{copy.chat.mentionSuggestions}</p>
                    {mentionCandidates.map((author, index) => (
                      <button
                        key={author.id}
                        type="button"
                        role="option"
                        aria-selected={index === mentionHighlightIndex}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => selectMention(author)}
                        className={`flex w-full items-center justify-between gap-3 px-2 py-2 text-left font-mono text-xs ${index === mentionHighlightIndex ? "bg-[#00f0ff]/15 text-[#b9f7ff]" : "text-white/65 hover:bg-white/5 hover:text-white"}`}
                      >
                        <span className="truncate">{author.name}</span>
                        <span className="shrink-0 text-[9px] text-white/35">@{author.slug}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={isSendingChat || !chatDraft.trim()}
                className="min-h-12 border border-[#00f0ff]/60 bg-[#00f0ff]/10 px-5 font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#b9f7ff] transition-all hover:bg-[#00f0ff]/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                 {isSendingChat ? copy.chat.sending : copy.chat.send}
              </button>
            </form>
          ) : (
            <p className="mt-4 border border-white/10 bg-black/20 px-3 py-3 font-mono text-xs leading-relaxed text-white/45">
               {copy.chat.needsPortal}{" "}
              <Link href="/sign-in" className="text-[#8ceeff] underline decoration-[#00f0ff]/50 underline-offset-4 hover:text-white">
                 {copy.chat.signIn}
              </Link>
            </p>
          )}
        </section>
      </div>

      {isRegistering && (
         <div className="fixed inset-0 z-[70] flex h-[100dvh] items-start justify-center overflow-hidden overscroll-none bg-[#02040a]/85 p-2 backdrop-blur-md sm:items-center sm:p-4">
           <div role="dialog" aria-modal="true" aria-labelledby="author-registration-title" className="my-2 max-h-[calc(100dvh-16px)] w-full max-w-xl touch-pan-y overflow-y-auto overscroll-contain border border-[#00f0ff]/55 bg-[#06111a]/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_0_45px_rgba(0,240,255,0.2)] sm:my-0 sm:max-h-[calc(100dvh-32px)] sm:p-7">
             <div className="flex items-start justify-between gap-4">
              <div>
                 <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#ffad7f]">{copy.editor.newPortal}</p>
                  <h2 id="author-registration-title" className="mt-2 font-creepster text-3xl tracking-[0.08em] text-[#00f0ff] sm:text-4xl sm:tracking-[0.1em]">{copy.editor.title}</h2>
              </div>
                <div className="flex shrink-0 items-center gap-2">
                  {myAuthor && (
                    <Link
                      href="/author-analytics"
                      onClick={() => setIsRegistering(false)}
                      className="inline-flex min-h-10 items-center gap-1.5 border border-[#ffcf9e]/55 bg-[#ffcf9e]/5 px-2.5 font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-[#ffcf9e] transition-colors hover:border-[#ffcf9e] hover:bg-[#ffcf9e]/15 hover:text-white sm:px-3"
                      aria-label={copy.editor.analyticsAria}
                      title={copy.editor.analyticsAria}
                    >
                      <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="hidden sm:inline">{copy.editor.analytics}</span>
                    </Link>
                  )}
                  <button type="button" onClick={() => setIsRegistering(false)} className="border border-white/15 px-3 py-2 font-mono text-xs text-white/55 transition-colors hover:border-[#00f0ff] hover:text-white" aria-label={copy.editor.closeAria}>
                    {copy.editor.close}
                  </button>
                </div>
            </div>
            <p className="author-copy mt-3 font-mono text-xs leading-relaxed text-white/55">
                 {copy.editor.description}
            </p>
            {profileSavedNotice && (
              <p role="status" className="save-notice mt-4 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em]">
                ✓ {profileSavedNotice}
              </p>
            )}
            {formError && (
              <p className="mt-4 border border-[#ff7043]/40 bg-[#ff7043]/5 px-3 py-2 font-mono text-xs leading-relaxed text-[#ffb184]">
                {formError}{" "}
                {formError.toLowerCase().includes("sign in") || formError.toLowerCase().includes("увій") ? (
                  <>
                     <Link href="/sign-in" className="text-[#8ceeff] underline underline-offset-4 hover:text-white">{copy.editor.signIn}</Link>
                     <span className="text-white/35"> {copy.editor.or} </span>
                     <Link href="/sign-up" className="text-[#ffcf9e] underline underline-offset-4 hover:text-white">{copy.editor.createAccount}</Link>
                  </>
                ) : null}
              </p>
            )}
            <form onSubmit={handleRegister} className="mt-6 space-y-4">
              <label className="block">
                 <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#b9f7ff]">{copy.editor.name}</span>
                 <input name="displayName" autoComplete="nickname" required value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} className="mt-2 min-h-11 w-full border border-white/15 bg-black/30 px-3 font-mono text-sm text-white outline-none transition-colors focus:border-[#00f0ff]/70" placeholder={copy.editor.namePlaceholder} />
              </label>
              <label className="block">
                 <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#b9f7ff]">{copy.editor.role}</span>
                 <input name="role" autoComplete="organization-title" required value={draft.role} onChange={(event) => setDraft((current) => ({ ...current, role: event.target.value }))} className="mt-2 min-h-11 w-full border border-white/15 bg-black/30 px-3 font-mono text-sm text-white outline-none transition-colors focus:border-[#00f0ff]/70" placeholder={copy.editor.rolePlaceholder} />
              </label>
              <label className="block">
                 <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#b9f7ff]">{copy.editor.memory}</span>
                 <textarea name="bio" autoComplete="off" required value={draft.memory} onChange={(event) => setDraft((current) => ({ ...current, memory: event.target.value }))} className="mt-2 min-h-24 w-full resize-y border border-white/15 bg-black/30 px-3 py-3 font-mono text-sm text-white outline-none transition-colors focus:border-[#00f0ff]/70" placeholder={copy.editor.memoryPlaceholder} />
              </label>
              <div className="block">
                 <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#b9f7ff]">{copy.editor.avatar}</span>
                <span className="mt-1 block font-mono text-[9px] leading-relaxed text-white/40">
                   {copy.editor.avatarHelp}
                </span>
                  <div className="mt-3 flex items-start gap-3 border border-white/10 bg-black/20 p-3 sm:items-center sm:gap-4">
                   <label className="group relative flex h-24 w-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-dashed border-[#00f0ff]/65 bg-[#00f0ff]/5 text-[#b9f7ff] transition-[border-radius,box-shadow] duration-300 hover:border-solid hover:border-[#00f0ff] hover:shadow-[0_0_24px_rgba(0,240,255,0.35)]">
                     {draft.avatarUrl ? (
                        <img src={draft.avatarUrl} alt={copy.editor.avatarPreview} className="authors-world-avatar-image h-full w-full rounded-full transition-transform duration-300 group-hover:scale-110" />
                     ) : (
                       <Plus className="h-8 w-8" aria-hidden="true" />
                     )}
                     <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/65 font-mono text-[8px] uppercase tracking-[0.12em] text-white opacity-0 transition-opacity group-hover:opacity-100">
                        {copy.editor.change}
                     </span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="sr-only"
                    disabled={isProcessingAvatar}
                    onChange={(event) => {
                      void handleAvatarFile(event.target.files?.[0]);
                      event.currentTarget.value = "";
                    }}
                  />
                   </label>
                    <div className="min-w-0 flex-1 font-mono text-[10px] leading-relaxed text-white/50">
                     <p className="font-bold uppercase tracking-[0.14em] text-[#b9f7ff]">
                        {isProcessingAvatar ? copy.editor.preparingAvatar : draft.avatarUrl ? copy.editor.avatarReady : copy.editor.pressPlus}
                     </p>
                       <p className="mt-1">{copy.editor.avatarDetails}</p>
                   </div>
                 </div>
                {avatarError && <p className="mt-2 font-mono text-[10px] text-[#ffb184]">{avatarError}</p>}
                <label className="mt-3 block">
                   <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/40">{copy.editor.directLink}</span>
                <input
                  name="avatarUrl"
                  type="text"
                  inputMode="url"
                  value={draft.avatarUrl}
                  onChange={(event) => setDraft((current) => ({ ...current, avatarUrl: event.target.value }))}
                  className="mt-2 min-h-11 w-full border border-white/15 bg-black/30 px-3 font-mono text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-[#00f0ff]/70"
                  placeholder="https://.../photo.jpg"
                />
                </label>
                {draft.avatarUrl.trim() && (
                  <span className="mt-3 flex items-center gap-3 border border-white/10 bg-black/20 p-3">
                    <img
                      src={draft.avatarUrl}
                       alt={copy.editor.photoPreview}
                      className="authors-world-avatar-image h-16 w-16 rounded-full border border-[#00f0ff]/45"
                    />
                    <span className="font-mono text-[10px] leading-relaxed text-white/45">
                       {copy.editor.photoPreviewHelp}
                    </span>
                  </span>
                )}
              </div>
              <div className="block">
                 <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#b9f7ff]">{copy.editor.background}</span>
                <span className="mt-1 block font-mono text-[9px] leading-relaxed text-white/40">
                   {copy.editor.backgroundHelp}
                </span>
                <label className="mt-3 flex min-h-14 cursor-pointer items-center justify-center gap-3 border border-dashed border-[#8a2be2]/65 bg-[#8a2be2]/8 px-4 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#e1c8ff] transition-colors hover:border-[#b98cff] hover:bg-[#8a2be2]/15">
                  <ImagePlus className="h-5 w-5" aria-hidden="true" />
                   {isProcessingBackground ? copy.editor.preparingBackground : copy.editor.addBackground}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="sr-only"
                    disabled={isProcessingBackground}
                    onChange={(event) => {
                      void handleBackgroundFile(event.target.files?.[0]);
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
                {backgroundError && <p className="mt-2 font-mono text-[10px] text-[#ffb184]">{backgroundError}</p>}
                <label className="mt-3 block">
                   <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/40">{copy.editor.directLink}</span>
                  <input
                    name="backgroundUrl"
                    type="text"
                    inputMode="url"
                    value={draft.backgroundUrl}
                    onChange={(event) => setDraft((current) => ({ ...current, backgroundUrl: event.target.value }))}
                    className="mt-2 min-h-11 w-full border border-white/15 bg-black/30 px-3 font-mono text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-[#8a2be2]/70"
                    placeholder="https://.../wide-background.jpg"
                  />
                </label>
                {draft.backgroundUrl.trim() && (
                   <div className="relative mt-3 h-32 overflow-hidden border border-[#8a2be2]/40 bg-[#07131b]" role="img" aria-label={copy.editor.backgroundPreviewAria}>
                    <img src={draft.backgroundUrl} alt="" className="absolute inset-0 h-full w-full object-cover object-center" />
                    <div className="relative flex h-full items-end bg-[linear-gradient(180deg,rgba(2,4,10,0.18),rgba(2,4,10,0.7))] p-3 font-mono text-[10px] uppercase tracking-[0.14em] text-white/70">
                       {copy.editor.backgroundPreview}
                    </div>
                  </div>
                )}
              </div>
              <fieldset className="border border-white/10 bg-black/20 p-3 sm:p-4">
                 <legend className="px-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#b9f7ff]">{copy.editor.platforms}</legend>
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <p className="font-mono text-[10px] leading-relaxed text-white/45">
                     {copy.editor.platformsHelp}
                  </p>
                  <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.14em] text-[#00f0ff]/55">
                     {formatAuthorsWorldCopy(copy.editor.rows, { count: draft.links.length })}
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {draft.links.length > 0 ? (
                    draft.links.map((link, linkIndex) => {
                      const option = platformOptionFor(link.platform);
                      const PlatformIcon = option.icon;

                      return (
                        <div key={`${link.platform}-${linkIndex}`} className="border border-white/10 bg-black/25 p-3">
                          <div className="grid gap-3 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.5fr)_auto] sm:items-end">
                            <label className="block min-w-0">
                               <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.14em] text-white/40">{formatAuthorsWorldCopy(copy.editor.platform, { number: linkIndex + 1 })}</span>
                              <span className="flex min-h-11 items-center border border-white/15 bg-[#06111a]/90 px-2.5 transition-colors focus-within:border-[#00f0ff]/70">
                                <PlatformIcon aria-hidden="true" className="mr-2 h-4 w-4 shrink-0" style={{ color: option.color }} />
                                <select
                                  value={link.platform}
                                  onChange={(event) => {
                                    const platform = event.target.value as PlatformKey;
                                    setDraft((current) => ({
                                      ...current,
                                      links: current.links.map((item, index) =>
                                        index === linkIndex
                                          ? { ...item, platform, customLabel: platform === "other" ? item.customLabel : "" }
                                          : item,
                                      ),
                                    }));
                                  }}
                                  className="min-w-0 flex-1 appearance-none bg-transparent font-mono text-xs text-white outline-none"
                                   aria-label={formatAuthorsWorldCopy(copy.editor.choosePlatform, { number: linkIndex + 1 })}
                                >
                                  {PLATFORM_OPTIONS.map((platform) => (
                                    <option key={platform.value} value={platform.value} className="bg-[#06111a] text-white">
                                       {copy.platformLabels[platform.value] ?? platform.label}
                                    </option>
                                  ))}
                                </select>
                              </span>
                            </label>

                            <label className="block min-w-0">
                               <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.14em] text-white/40">{copy.editor.profileAddress}</span>
                              <input
                                type="url"
                                value={link.url}
                                onChange={(event) => setDraft((current) => ({
                                  ...current,
                                  links: current.links.map((item, index) => index === linkIndex ? { ...item, url: event.target.value } : item),
                                }))}
                                className="min-h-11 w-full border border-white/15 bg-[#06111a]/90 px-3 font-mono text-xs text-white outline-none transition-colors placeholder:text-white/25 focus:border-[#00f0ff]/70"
                                placeholder={option.placeholder}
                                 aria-label={formatAuthorsWorldCopy(copy.editor.profileAddressAria, { number: linkIndex + 1 })}
                              />
                            </label>

                            <button
                              type="button"
                              onClick={() => setDraft((current) => ({
                                ...current,
                                links: current.links.filter((_, index) => index !== linkIndex),
                              }))}
                              className="inline-flex min-h-11 items-center justify-center gap-2 border border-[#ff7043]/35 px-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[#ffb184] transition-colors hover:border-[#ff7043] hover:bg-[#ff7043]/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7043] sm:w-11 sm:px-0"
                               aria-label={formatAuthorsWorldCopy(copy.editor.removePlatform, { number: linkIndex + 1 })}
                            >
                              <Trash2 aria-hidden="true" className="h-4 w-4" />
                               <span className="sm:hidden">{copy.editor.remove}</span>
                            </button>
                          </div>

                          {link.platform === "other" && (
                            <label className="mt-3 block">
                               <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.14em] text-white/40">{copy.editor.customPlatform}</span>
                              <input
                                value={link.customLabel}
                                onChange={(event) => setDraft((current) => ({
                                  ...current,
                                  links: current.links.map((item, index) => index === linkIndex ? { ...item, customLabel: event.target.value } : item),
                                }))}
                                className="min-h-10 w-full border border-white/15 bg-[#06111a]/90 px-3 font-mono text-xs text-white outline-none transition-colors placeholder:text-white/25 focus:border-[#00f0ff]/70"
                                 placeholder={copy.editor.customPlatformPlaceholder}
                              />
                            </label>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="border border-dashed border-white/15 px-3 py-4 font-mono text-xs text-white/40">
                       {copy.editor.noPlatforms}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setDraft((current) => ({ ...current, links: [...current.links, emptyPlatformLink()] }))}
                  className="mt-3 inline-flex min-h-10 items-center gap-2 border border-[#8a2be2]/60 bg-[#8a2be2]/10 px-3 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#d7b6ff] transition-all hover:border-[#00f0ff] hover:bg-[#00f0ff]/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00f0ff]"
                >
                  <Plus aria-hidden="true" className="h-4 w-4" />
                   {copy.editor.addPlatform}
                </button>
              </fieldset>
              <button type="submit" disabled={isSavingProfile} className="min-h-12 w-full border border-[#00f0ff]/70 bg-[#00f0ff]/10 font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#b9f7ff] transition-all hover:bg-[#00f0ff]/20 hover:text-white hover:shadow-[0_0_24px_rgba(0,240,255,0.35)] disabled:cursor-wait disabled:opacity-50">
                 {isSavingProfile ? copy.editor.connecting : myAuthor ? copy.editor.savePortal : copy.editor.openPortal}
              </button>
            </form>
            {myAuthor && (
              <section className="mt-8 border-t border-[#00f0ff]/20 pt-6">
                 <div className="border border-[#ffcf9e]/35 bg-[#140d18]/35 p-4">
                   <div className="flex items-end justify-between gap-3">
                     <div>
                       <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#ffcf9e]">{copy.memory.title}</p>
                       <h3 className="mt-1 font-creepster text-3xl tracking-[0.1em] text-[#ffcf9e]">{formatAuthorsWorldCopy(copy.memory.saved, { count: authoredMemories.length })}</h3>
                     </div>
                     <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/35">TREE // MEMORY</span>
                   </div>
                   <p className="mt-2 font-mono text-[10px] leading-relaxed text-white/45">{copy.memory.photoHelp}</p>
                   {memoryError && <p className="mt-3 border border-[#ff7043]/35 bg-[#ff7043]/5 px-3 py-2 font-mono text-xs text-[#ffb184]">{memoryError}</p>}
                   {memorySavedNotice && <p role="status" className="save-notice mt-3 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em]">✓ {memorySavedNotice}</p>}
                   {authoredMemories.length > 0 && (
                     <div className="mt-4 max-h-56 space-y-2 overflow-y-auto pr-1 [scrollbar-color:#ffcf9e55_#140d18]">
                       {authoredMemories.map((memory) => (
                         <div key={memory.id} className="flex items-center justify-between gap-3 border border-[#ffcf9e]/15 bg-black/20 p-3">
                           <div className="flex min-w-0 items-center gap-3">
                             <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#ffcf9e]/45 bg-[#140d18]">
                               {memory.imageUrl ? <img src={memory.imageUrl} alt="" className="h-full w-full object-cover" /> : <span className="font-creepster text-xs text-[#ffcf9e]">{memory.title.slice(0, 2)}</span>}
                             </div>
                             <div className="min-w-0">
                               <p className="truncate font-mono text-xs text-white">{memory.title} {memory.isHidden && <span className="text-[#ffad7f]">// hidden</span>}</p>
                               <p className="mt-1 line-clamp-1 font-mono text-[9px] text-white/40">{memory.description}</p>
                             </div>
                           </div>
                           <div className="flex shrink-0 gap-2">
                             <button
                               type="button"
                               onClick={() => {
                                 setMemorySavedNotice(null);
                                 setEditingMemoryId(memory.id);
                                  const savedMemory = creations.find((creation) => creation.id === memory.id);
                                  setMemoryDraft({
                                    title: memory.title,
                                    description: memory.description,
                                    poem: savedMemory?.poem ?? memory.poem,
                                    links: savedMemory?.links ?? memory.links,
                                    imageUrl: memory.imageUrl ?? "",
                                    isHidden: Boolean(memory.isHidden),
                                  });
                               }}
                               className="border border-white/15 px-2 py-2 font-mono text-[9px] uppercase text-white/60 hover:border-[#ffcf9e] hover:text-white"
                             >
                               {copy.memory.edit}
                             </button>
                             <button type="button" onClick={() => void handleDeleteMemory(memory.id)} className="border border-[#ff7043]/35 px-2 py-2 font-mono text-[9px] uppercase text-[#ffb184] hover:border-[#ff7043]">{copy.memory.remove}</button>
                           </div>
                         </div>
                       ))}
                     </div>
                   )}
                   <form onSubmit={handleSaveMemory} className="mt-4 grid gap-3 border border-[#ffcf9e]/15 bg-black/20 p-4">
                     <label className="block">
                       <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/45">{copy.memory.name}</span>
                       <input required value={memoryDraft.title} onChange={(event) => setMemoryDraft((current) => ({ ...current, title: event.target.value }))} className="mt-2 min-h-10 w-full border border-white/15 bg-[#140d18] px-3 font-mono text-xs text-white outline-none focus:border-[#ffcf9e]/70" placeholder={copy.memory.namePlaceholder} />
                     </label>
                     <label className="block">
                       <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/45">{copy.memory.story}</span>
                       <textarea required value={memoryDraft.description} onChange={(event) => setMemoryDraft((current) => ({ ...current, description: event.target.value }))} className="mt-2 min-h-24 w-full resize-y border border-white/15 bg-[#140d18] px-3 py-2 font-mono text-xs text-white outline-none focus:border-[#ffcf9e]/70" placeholder={copy.memory.storyPlaceholder} />
                     </label>
                      <label className="block">
                        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/45">{copy.memory.poem}</span>
                        <textarea value={memoryDraft.poem} onChange={(event) => setMemoryDraft((current) => ({ ...current, poem: event.target.value }))} className="mt-2 min-h-24 w-full resize-y border border-white/15 bg-[#140d18] px-3 py-2 font-serif text-sm leading-relaxed text-white outline-none focus:border-[#ffcf9e]/70" placeholder={copy.memory.poemPlaceholder} />
                      </label>
                      <label className="block">
                        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/45">{copy.memory.links}</span>
                        <textarea value={memoryDraft.links} onChange={(event) => setMemoryDraft((current) => ({ ...current, links: event.target.value }))} className="mt-2 min-h-20 w-full resize-y border border-white/15 bg-[#140d18] px-3 py-2 font-mono text-xs text-white outline-none focus:border-[#ffcf9e]/70" placeholder={copy.memory.linksPlaceholder} />
                      </label>
                     <div>
                       <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/45">{copy.memory.photo}</span>
                       <label className="mt-2 flex min-h-11 cursor-pointer items-center justify-center gap-2 border border-dashed border-[#ffcf9e]/55 bg-[#ffcf9e]/5 px-3 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#ffcf9e] hover:border-[#ffcf9e]">
                         {isProcessingMemory ? copy.memory.saving : memoryDraft.imageUrl ? copy.memory.photoReady : copy.memory.choosePhoto}
                         <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" disabled={isProcessingMemory} onChange={(event) => { void handleMemoryFile(event.target.files?.[0]); event.currentTarget.value = ""; }} />
                       </label>
                       {memoryDraft.imageUrl && <img src={memoryDraft.imageUrl} alt="" className="mt-3 h-24 w-24 rounded-full border border-[#ffcf9e]/45 object-cover" />}
                     </div>
                     <label className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-white/55">
                       <input type="checkbox" checked={memoryDraft.isHidden} onChange={(event) => setMemoryDraft((current) => ({ ...current, isHidden: event.target.checked }))} className="accent-[#ffcf9e]" />
                       {memoryDraft.isHidden ? "НЕ ПОКАЗУВАТИ ВІДВІДУВАЧАМ" : "ПОКАЗУВАТИ ВІДВІДУВАЧАМ"}
                     </label>
                     <div className="flex flex-wrap gap-2">
                       <button type="submit" disabled={isSavingMemory || isProcessingMemory} className="min-h-10 border border-[#ffcf9e]/70 bg-[#ffcf9e]/10 px-4 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#ffcf9e] hover:bg-[#ffcf9e]/20 disabled:opacity-50">{isSavingMemory ? copy.memory.saving : editingMemoryId ? copy.memory.saveChanges : copy.memory.save}</button>
                       {editingMemoryId && <button type="button" onClick={() => { setEditingMemoryId(null); setMemoryDraft(EMPTY_MEMORY_DRAFT); }} className="min-h-10 border border-white/15 px-4 font-mono text-[10px] uppercase text-white/55 hover:text-white">{copy.memory.cancel}</button>}
                     </div>
                   </form>
                 </div>
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#ffad7f]">{copy.creations.eyebrow}</p>
                    <h3 className="mt-1 font-creepster text-3xl tracking-[0.1em] text-[#d7b6ff]">{copy.creations.title}</h3>
                  </div>
                   <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/35">{formatAuthorsWorldCopy(copy.creations.saved, { count: authoredWorks.length })}</span>
                </div>
                <p className="mt-2 font-mono text-[10px] leading-relaxed text-white/45">
                  {copy.creations.help}
                </p>
                {creationError && <p className="mt-3 border border-[#ff7043]/35 bg-[#ff7043]/5 px-3 py-2 font-mono text-xs text-[#ffb184]">{creationError}</p>}
                {creationSavedNotice && (
                  <p role="status" className="save-notice mt-3 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em]">
                    ✓ {creationSavedNotice}
                  </p>
                )}
                 <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {authoredWorks.map((creation) => (
                      <div key={creation.id} className="flex items-center justify-between gap-3 border border-white/10 bg-black/20 p-3">
                        <div className="min-w-0">
                          <p className="truncate font-mono text-xs text-white">{creation.title}</p>
                          <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[#8ceeff]">{creation.platform} // {creation.kind}</p>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <button type="button" onClick={() => {
                            setCreationSavedNotice(null);
                            setEditingCreationId(creation.id);
                             setIsCreationComposerOpen(true);
                            setCreationDraft({
                              platform: (creation.platform as PlatformKey) || "other",
                              kind: (creation.kind as CreationDraft["kind"]) || "card",
                              title: creation.title,
                              description: creation.description,
                              imageUrl: creation.imageUrl ?? "",
                              contentUrl: creation.contentUrl ?? "",
                              audioObjectPath: creation.audioObjectPath ?? "",
                              audioFileName: creation.audioUrl ? copy.creations.attached : "",
                              audioSizeBytes: creation.audioSizeBytes ?? null,
                              audioDurationSeconds: creation.audioDurationSeconds ?? null,
                            });
                            setAudioFile(null);
                            setAudioError(null);
                          }} className="border border-white/15 px-2 py-2 font-mono text-[9px] uppercase text-white/60 hover:border-[#00f0ff] hover:text-white">{copy.creations.edit}</button>
                          <button type="button" onClick={() => void handleDeleteCreation(creation.id)} className="border border-[#ff7043]/35 px-2 py-2 font-mono text-[9px] uppercase text-[#ffb184] hover:border-[#ff7043]">{copy.creations.remove}</button>
                        </div>
                      </div>
                    ))}
                 </div>
                 {isCreationComposerOpen && <form onSubmit={handleSaveCreation} className="mt-4 grid gap-3 border border-[#00f0ff]/35 bg-black/20 p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/45">{copy.creations.platform}</span>
                      <select value={creationDraft.platform} onChange={(event) => setCreationDraft((current) => ({ ...current, platform: event.target.value as PlatformKey }))} className="mt-2 min-h-10 w-full border border-white/15 bg-[#06111a] px-3 font-mono text-xs text-white outline-none focus:border-[#00f0ff]/70">
                        {PLATFORM_OPTIONS.map((option) => <option key={option.value} value={option.value} className="bg-[#06111a]">{copy.platformLabels[option.value] ?? option.label}</option>)}
                      </select>
                    </label>
                    <label className="block">
                      <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/45">{copy.creations.format}</span>
                      <select value={creationDraft.kind} onChange={(event) => setCreationDraft((current) => ({ ...current, kind: event.target.value as CreationDraft["kind"] }))} className="mt-2 min-h-10 w-full border border-white/15 bg-[#06111a] px-3 font-mono text-xs text-white outline-none focus:border-[#00f0ff]/70">
                        <option value="banner" className="bg-[#06111a]">{copy.creations.banner}</option>
                        <option value="card" className="bg-[#06111a]">{copy.creations.card}</option>
                        <option value="creation" className="bg-[#06111a]">{copy.creations.creation}</option>
                      </select>
                    </label>
                  </div>
                  <label className="block">
                    <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/45">{copy.creations.titleLabel}</span>
                    <input required value={creationDraft.title} onChange={(event) => setCreationDraft((current) => ({ ...current, title: event.target.value }))} className="mt-2 min-h-10 w-full border border-white/15 bg-[#06111a] px-3 font-mono text-xs text-white outline-none focus:border-[#00f0ff]/70" placeholder={copy.creations.titlePlaceholder} />
                  </label>
                  <label className="block">
                    <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/45">{copy.creations.description}</span>
                    <textarea value={creationDraft.description} onChange={(event) => setCreationDraft((current) => ({ ...current, description: event.target.value }))} className="mt-2 min-h-20 w-full resize-y border border-white/15 bg-[#06111a] px-3 py-2 font-mono text-xs text-white outline-none focus:border-[#00f0ff]/70" placeholder={copy.creations.descriptionPlaceholder} />
                  </label>
                   <div className="border border-[#00f0ff]/25 bg-[#06111a]/70 p-3">
                     <div className="flex items-start gap-3">
                       <UploadCloud className="mt-0.5 h-5 w-5 shrink-0 text-[#b9f7ff]" aria-hidden="true" />
                       <div>
                          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#b9f7ff]">{copy.creations.uploadMp3}</span>
                         <p className="mt-1 font-mono text-[10px] leading-relaxed text-white/50">
                            {copy.creations.mp3Help}
                         </p>
                       </div>
                     </div>
                     <label className="mt-3 flex min-h-11 cursor-pointer items-center justify-center border border-dashed border-[#00f0ff]/55 bg-[#00f0ff]/5 px-3 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#b9f7ff] transition-colors hover:border-[#00f0ff] hover:bg-[#00f0ff]/10">
                        {audioFile ? formatAuthorsWorldCopy(copy.creations.selected, { name: audioFile.name }) : creationDraft.audioObjectPath ? copy.creations.replaceMp3 : copy.creations.chooseMp3}
                       <input
                         type="file"
                         accept=".mp3,audio/mpeg,audio/mp3"
                         className="sr-only"
                         disabled={isUploadingAudio || isSavingCreation}
                         onChange={(event) => {
                           void handleAudioFile(event.target.files?.[0]);
                           event.currentTarget.value = "";
                         }}
                       />
                     </label>
                     {(audioFile || creationDraft.audioObjectPath) && (
                       <p className="mt-2 font-mono text-[10px] text-[#8ceeff]">
                          {creationDraft.audioFileName || copy.creations.attached}
                         {creationDraft.audioSizeBytes ? ` // ${(creationDraft.audioSizeBytes / 1024 / 1024).toFixed(1)} ${lang === "en" ? "MB" : lang === "fr" ? "Mo" : "МБ"}` : ""}
                         {creationDraft.audioDurationSeconds ? ` // ${Math.round(creationDraft.audioDurationSeconds / 60)}:${String(Math.round(creationDraft.audioDurationSeconds % 60)).padStart(2, "0")}` : ""}
                       </p>
                     )}
                     {audioError && <p className="mt-2 font-mono text-[10px] text-[#ffb184]">{audioError}</p>}
                   </div>
                   <label className="block">
                      <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/45">{copy.creations.contentLink}</span>
                       <input type="url" value={creationDraft.contentUrl} onChange={(event) => setCreationDraft((current) => ({ ...current, contentUrl: event.target.value }))} className="mt-2 min-h-10 w-full border border-white/15 bg-[#06111a] px-3 font-mono text-xs text-white outline-none focus:border-[#00f0ff]/70" placeholder={creationDraft.platform === "suno" ? "https://suno.com/song/..." : copy.creations.contentPlaceholder} />
                  </label>
                  <label className="block">
                    <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/45">{copy.creations.cover}</span>
                    <input type="url" value={creationDraft.imageUrl} onChange={(event) => setCreationDraft((current) => ({ ...current, imageUrl: event.target.value }))} className="mt-2 min-h-10 w-full border border-white/15 bg-[#06111a] px-3 font-mono text-xs text-white outline-none focus:border-[#00f0ff]/70" placeholder="https://.../cover.jpg" />
                  </label>
                  <div className="flex flex-wrap gap-2">
                     <button type="submit" disabled={isSavingCreation || isUploadingAudio} className="min-h-10 border border-[#8a2be2]/70 bg-[#8a2be2]/15 px-4 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#d7b6ff] hover:border-[#00f0ff] hover:text-white disabled:opacity-50">{isUploadingAudio ? copy.creations.uploading : isSavingCreation ? copy.creations.saving : editingCreationId ? copy.creations.saveChanges : copy.creations.addWork}</button>
                       <button type="button" onClick={closeCreationComposer} disabled={isSavingCreation || isUploadingAudio} className="min-h-10 border border-white/15 px-4 font-mono text-[10px] uppercase text-white/55 hover:text-white disabled:opacity-50">{copy.creations.cancel}</button>
                  </div>
                </form>}
              </section>
            )}
          </div>
        </div>
      )}
    </main>
  );
}