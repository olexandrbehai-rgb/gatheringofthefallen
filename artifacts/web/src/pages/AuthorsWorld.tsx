import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Globe2, ImagePlus, Link2, Plus, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import type { IconType } from "react-icons";
import { SiBandcamp, SiInstagram, SiSpotify, SiSoundcloud, SiTiktok, SiYoutube, SiYoutubemusic } from "react-icons/si";
import { Link, useLocation } from "wouter";

type AuthorLink = {
  label: string;
  url: string;
};

type PlatformKey = "website" | "spotify" | "youtube-music" | "youtube" | "instagram" | "tiktok" | "bandcamp" | "soundcloud" | "other";

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
  position: { left: number; top: number };
};

type ChatMessage = {
  id: number;
  body: string;
  createdAt: string;
  author: {
    id: number;
    displayName: string;
    role: string;
    avatarUrl?: string | null;
  };
};

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
  imageUrl?: string | null;
  contentUrl?: string | null;
};

type CreationDraft = {
  platform: PlatformKey;
  kind: "card" | "banner" | "creation";
  title: string;
  description: string;
  imageUrl: string;
  contentUrl: string;
};

const API_ROOT = `${import.meta.env.BASE_URL}api`;

const WORLD_COLUMNS = 4;
const WORLD_CELL_WIDTH = 260;
const WORLD_CELL_HEIGHT = 220;
const WORLD_PADDING_X = 150;
const WORLD_PADDING_Y = 150;

function worldPositionFor(index: number) {
  const column = index % WORLD_COLUMNS;
  const row = Math.floor(index / WORLD_COLUMNS);

  return {
    left: WORLD_PADDING_X + column * WORLD_CELL_WIDTH,
    top: WORLD_PADDING_Y + row * WORLD_CELL_HEIGHT,
  };
}

function worldDimensions(authorCount: number) {
  const rows = Math.max(1, Math.ceil(Math.max(authorCount, 1) / WORLD_COLUMNS));

  return {
    width: Math.max(1040, WORLD_PADDING_X * 2 + (WORLD_COLUMNS - 1) * WORLD_CELL_WIDTH),
    height: Math.max(760, WORLD_PADDING_Y * 2 + (rows - 1) * WORLD_CELL_HEIGHT),
  };
}

type PlatformOption = {
  value: PlatformKey;
  label: string;
  placeholder: string;
  icon: IconType;
  color: string;
};

const PLATFORM_OPTIONS: PlatformOption[] = [
  { value: "website", label: "Сайт / портфоліо", placeholder: "https://твій-сайт.com", icon: Globe2, color: "#b9f7ff" },
  { value: "spotify", label: "Spotify", placeholder: "https://open.spotify.com/artist/...", icon: SiSpotify, color: "#1ed760" },
  { value: "youtube-music", label: "YouTube Music", placeholder: "https://music.youtube.com/channel/...", icon: SiYoutubemusic, color: "#ff0033" },
  { value: "youtube", label: "YouTube", placeholder: "https://youtube.com/@твій-канал", icon: SiYoutube, color: "#ff0033" },
  { value: "instagram", label: "Instagram", placeholder: "https://instagram.com/твій-профіль", icon: SiInstagram, color: "#e4405f" },
  { value: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@твій-профіль", icon: SiTiktok, color: "#69c9d0" },
  { value: "bandcamp", label: "Bandcamp", placeholder: "https://твій-лейбл.bandcamp.com", icon: SiBandcamp, color: "#629aa9" },
  { value: "soundcloud", label: "SoundCloud", placeholder: "https://soundcloud.com/твій-профіль", icon: SiSoundcloud, color: "#ff5500" },
  { value: "other", label: "Інший майданчик", placeholder: "https://посилання-на-профіль.com", icon: Link2, color: "#d7b6ff" },
];

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
  return compressedImageFromFile(file, 640, 0.82, "Іконка");
}

function compressedBackgroundFromFile(file: File) {
  return compressedImageFromFile(file, 1600, 0.78, "Фон профілю");
}

function mapApiAuthor(
  value: {
    id: number;
    displayName: string;
    role: string;
    bio: string;
    avatarUrl?: string | null;
    backgroundUrl?: string | null;
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
    position: value.position ?? worldPositionFor(index),
  };
}

function AuthorNode({
  author,
  active,
  locating,
  nodeRef,
  onSelect,
}: {
  author: Author;
  active: boolean;
  locating: boolean;
  nodeRef: (node: HTMLButtonElement | null) => void;
  onSelect: () => void;
}) {
  return (
    <motion.button
      type="button"
      ref={nodeRef}
      onClick={onSelect}
      whileHover={{ scale: 1.75 }}
      whileFocus={{ scale: 1.75 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className={`group absolute isolate z-[1000] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2 overflow-visible text-center transition-[filter] duration-300 hover:z-[1000] focus-visible:z-[1000] focus-visible:outline-none ${
        active ? "z-[210]" : ""
      } ${locating ? "author-node-locating" : ""}`}
      style={{ left: `${author.position.left}px`, top: `${author.position.top}px`, transformOrigin: "left center" }}
      aria-label={`${author.name}, ${author.role}. Відкрити портал автора`}
    >
      <span className="relative flex h-16 w-16 items-center overflow-visible rounded-full border border-[#00f0ff]/70 bg-[#07131b]/95 text-left text-[#b9f7ff] shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-[width,height,border-radius,box-shadow,transform] duration-300 group-hover:h-32 group-hover:w-72 group-hover:scale-105 group-hover:rounded-2xl group-hover:border-white group-hover:shadow-[0_0_36px_rgba(0,240,255,0.9)] group-focus-visible:h-32 group-focus-visible:w-72 group-focus-visible:rounded-2xl">
        <span className={`relative z-10 flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#00f0ff]/45 bg-[#07131b]/95 font-mono text-xs font-bold tracking-[0.16em] transition-[width,height,border-radius] duration-300 group-hover:h-full group-hover:w-28 group-hover:rounded-none group-hover:border-0 group-focus-visible:h-full group-focus-visible:w-28 group-focus-visible:rounded-none group-focus-visible:border-0 ${
          ""
        }`}>
          <span aria-hidden="true" className="absolute inset-1 rounded-full border border-dashed border-[#00f0ff]/50 transition-[inset,border-radius] duration-300 group-hover:inset-2 group-hover:rounded-xl group-focus-visible:inset-2 group-focus-visible:rounded-xl" />
          {author.avatarUrl ? (
            <img src={author.avatarUrl} alt="" className="h-full w-full bg-black/20 object-contain" />
          ) : (
            <span className="relative">{author.initials}</span>
          )}
        </span>
        <span className="relative z-20 hidden min-w-0 flex-1 flex-col justify-center px-4 py-2 opacity-0 transition-opacity duration-200 group-hover:flex group-hover:opacity-100 group-focus-visible:flex group-focus-visible:opacity-100">
          <span className="truncate font-creepster text-xl tracking-[0.08em] text-[#00f0ff]">{author.name}</span>
          <span className="mt-0.5 truncate font-mono text-[9px] uppercase tracking-[0.14em] text-[#ffad7f]">{author.role}</span>
          <span className="mt-2 line-clamp-2 font-mono text-[9px] leading-relaxed text-white/60">{author.memory}</span>
        </span>
      </span>
      <span className="max-w-28 truncate font-mono text-[10px] uppercase tracking-[0.16em] text-white/75 transition-colors group-hover:hidden group-focus-visible:hidden group-hover:text-white">
        {author.name}
      </span>
    </motion.button>
  );
}

export default function AuthorsWorld() {
  const [location, setLocation] = useLocation();
  const [authors, setAuthors] = useState<Author[]>([]);
  const [selectedAuthorId, setSelectedAuthorId] = useState<string | null>(null);
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
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatDraft, setChatDraft] = useState("");
  const [chatLoading, setChatLoading] = useState(true);
  const [chatError, setChatError] = useState<string | null>(null);
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [creations, setCreations] = useState<AuthorCreation[]>([]);
  const [creationDraft, setCreationDraft] = useState<CreationDraft>(EMPTY_CREATION_DRAFT);
  const [creationError, setCreationError] = useState<string | null>(null);
  const [isSavingCreation, setIsSavingCreation] = useState(false);
  const [editingCreationId, setEditingCreationId] = useState<number | null>(null);
  const [locatingAuthorId, setLocatingAuthorId] = useState<string | null>(null);
  const authorNodeRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const handleAvatarFile = async (file: File | undefined) => {
    if (!file) return;
    setAvatarError(null);
    setIsProcessingAvatar(true);
    try {
      const avatarUrl = await compressedAvatarFromFile(file);
      setDraft((current) => ({ ...current, avatarUrl }));
    } catch (error) {
      setAvatarError(error instanceof Error ? error.message : "Не вдалося підготувати іконку.");
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
      setBackgroundError(error instanceof Error ? error.message : "Не вдалося підготувати фон профілю.");
    } finally {
      setIsProcessingBackground(false);
    }
  };

  useEffect(() => {
    let active = true;

    const loadAuthors = async () => {
      try {
        const [authorsResponse, meResponse] = await Promise.all([
          fetch(`${API_ROOT}/authors-world/authors`, { credentials: "include" }),
          fetch(`${API_ROOT}/authors-world/me`, { credentials: "include" }),
        ]);
        if (!authorsResponse.ok || !meResponse.ok) {
          throw new Error("Не вдалося завантажити світ авторів.");
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
        }
      } catch (error) {
        if (!active) return;
        setAuthors([]);
        setAuthorsError(error instanceof Error ? error.message : "Не вдалося завантажити авторів.");
      } finally {
        if (active) setAuthorsLoading(false);
      }
    };

    void loadAuthors();
    return () => {
      active = false;
    };
  }, []);

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
    let active = true;

    const loadChat = async () => {
      try {
        const response = await fetch(`${API_ROOT}/authors-world/chat`, {
          credentials: "include",
        });
        if (!response.ok) throw new Error("Не вдалося підключитися до загального чату.");
        const payload = await response.json() as { messages?: ChatMessage[] };
        if (active) setChatMessages(Array.isArray(payload.messages) ? payload.messages : []);
      } catch (error) {
        if (active) {
          setChatError(error instanceof Error ? error.message : "Чат тимчасово недоступний.");
        }
      } finally {
        if (active) setChatLoading(false);
      }
    };

    void loadChat();
    const stream = new EventSource(`${API_ROOT}/authors-world/chat/stream`);
    stream.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as ChatMessage;
        if (!active) return;
        setChatMessages((current) =>
          current.some((item) => item.id === message.id)
            ? current
            : [...current, message].slice(-100),
        );
      } catch {
        // Ignore malformed events and keep the connection alive.
      }
    };
    stream.onerror = () => {
      if (active) setChatError("Live-з’єднання перервано. Спроба відновлення триває.");
    };

    return () => {
      active = false;
      stream.close();
    };
  }, []);

  const visibleAuthors = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return authors;
    return authors.filter((author) =>
      `${author.name} ${author.role} ${author.memory}`.toLowerCase().includes(query),
    );
  }, [authors, search]);

  const selectedAuthor = authors.find((author) => author.id === selectedAuthorId) ?? null;
  const worldSize = useMemo(() => worldDimensions(authors.length), [authors.length]);

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

    setSelectedAuthorId(match.id);
    setLocatingAuthorId(match.id);
    const frame = window.requestAnimationFrame(() => {
      authorNodeRefs.current[match.id]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
    });
    const timeout = window.setTimeout(() => setLocatingAuthorId(null), 1400);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [authors, search]);

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
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
      setFormError("Заповни, будь ласка, ім’я, роль і коротке послання.");
      (event.currentTarget.elements.namedItem(missingField) as HTMLInputElement | HTMLTextAreaElement | null)?.focus();
      return;
    }

    let links: AuthorLink[];
    try {
      links = platformLinksForDraft(draft.links);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Перевір адреси майданчиків.");
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
        throw new Error(payload.error ?? "Не вдалося відкрити портал.");
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
      setIsRegistering(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Не вдалося відкрити портал.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveCreation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!creationDraft.title.trim() || isSavingCreation) return;
    setCreationError(null);
    setIsSavingCreation(true);
    try {
      const endpoint = editingCreationId
        ? `${API_ROOT}/authors-world/me/creations/${editingCreationId}`
        : `${API_ROOT}/authors-world/me/creations`;
      const response = await fetch(endpoint, {
        method: editingCreationId ? "PATCH" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(creationDraft),
      });
      const payload = await response.json().catch(() => ({})) as {
        creation?: AuthorCreation;
        error?: string;
      };
      if (!response.ok || !payload.creation) {
        throw new Error(payload.error ?? "Не вдалося зберегти авторську роботу.");
      }
      setCreations((current) => editingCreationId
        ? current.map((item) => item.id === editingCreationId ? payload.creation as AuthorCreation : item)
        : [...current, payload.creation as AuthorCreation]);
      setCreationDraft(EMPTY_CREATION_DRAFT);
      setEditingCreationId(null);
    } catch (error) {
      setCreationError(error instanceof Error ? error.message : "Не вдалося зберегти авторську роботу.");
    } finally {
      setIsSavingCreation(false);
    }
  };

  const handleDeleteCreation = async (creationId: number) => {
    setCreationError(null);
    try {
      const response = await fetch(`${API_ROOT}/authors-world/me/creations/${creationId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(payload.error ?? "Не вдалося видалити авторську роботу.");
      }
      setCreations((current) => current.filter((item) => item.id !== creationId));
      if (editingCreationId === creationId) {
        setEditingCreationId(null);
        setCreationDraft(EMPTY_CREATION_DRAFT);
      }
    } catch (error) {
      setCreationError(error instanceof Error ? error.message : "Не вдалося видалити авторську роботу.");
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
        throw new Error(payload.error ?? "Повідомлення не відправлено.");
      }
      setChatMessages((current) =>
        current.some((item) => item.id === payload.message?.id)
          ? current
          : [...current, payload.message as ChatMessage].slice(-100),
      );
      setChatDraft("");
    } catch (error) {
      setChatError(error instanceof Error ? error.message : "Повідомлення не відправлено.");
    } finally {
      setIsSendingChat(false);
    }
  };

  return (
    <main className="relative min-h-[calc(100dvh-82px)] overflow-hidden bg-transparent px-4 py-10 text-white sm:px-6 lg:px-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(2,4,10,0.58)_0%,rgba(2,4,10,0.3)_34%,rgba(2,4,10,0.7)_100%),radial-gradient(circle_at_50%_14%,rgba(0,240,255,0.16),transparent_38%),radial-gradient(circle_at_82%_58%,rgba(138,43,226,0.18),transparent_42%)]"
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-80 [background-image:linear-gradient(rgba(0,240,255,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.07)_1px,transparent_1px),radial-gradient(circle_at_50%_20%,rgba(0,240,255,0.2),transparent_42%),radial-gradient(circle_at_80%_75%,rgba(138,43,226,0.2),transparent_38%)] [background-size:42px_42px,42px_42px,100%_100%,100%_100%]" />
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full border border-[#00f0ff]/20 shadow-[0_0_80px_rgba(0,240,255,0.12)]" />

      <div className="authors-world-readable relative z-10 mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-6 border-b border-[#00f0ff]/20 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link href="/" className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/45 transition-colors hover:text-[#00f0ff]">
              ← Повернутися до Gathering Of The Fallen
            </Link>
            <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.32em] text-[#ffad7f]">Інтерактивний архів // точка входу</p>
            <h1 className="mt-2 font-creepster text-5xl tracking-[0.08em] text-[#00f0ff] drop-shadow-[0_0_18px_rgba(0,240,255,0.5)] sm:text-7xl">
              Інший світ
            </h1>
            <p className="mt-2 max-w-2xl font-mono text-sm leading-relaxed text-white/65 sm:text-base">
              Світ авторів, музики та історій. Знайди голос, який залишився у пам’яті, або залиш тут власний слід.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => document.getElementById("authors-world-chat")?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="inline-flex min-h-12 items-center justify-center border border-[#8a2be2]/70 bg-[#8a2be2]/10 px-5 font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#d7b6ff] transition-all hover:border-white hover:bg-[#8a2be2]/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a2be2]"
            >
              Загальний чат
            </button>
            <button
              type="button"
              onClick={() => {
                setFormError(null);
                setIsRegistering(true);
              }}
              className="inline-flex min-h-12 items-center justify-center border border-[#00f0ff]/70 bg-[#00f0ff]/10 px-5 font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#b9f7ff] shadow-[0_0_18px_rgba(0,240,255,0.18)] transition-all hover:border-white hover:bg-[#00f0ff]/20 hover:text-white hover:shadow-[0_0_28px_rgba(0,240,255,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00f0ff]"
            >
              {myAuthor ? "Редагувати мій портал" : "Залишитися у спогаді"}
            </button>
          </div>
        </div>

        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-creepster text-3xl tracking-[0.12em] text-[#ffcf9e]">Світ авторів</h2>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
              {authorsLoading ? "підключення до мережі авторів..." : `${visibleAuthors.length} відкритих порталів // наведи курсор, щоб збільшити портал`}
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-1.5 sm:items-end">
            <label className="flex min-h-10 items-center border border-white/15 bg-black/30 px-3 focus-within:border-[#00f0ff]/60 sm:w-80">
              <span className="mr-2 font-mono text-[10px] uppercase tracking-widest text-white/40">Пошук</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="ім’я або роль"
                className="min-w-0 flex-1 bg-transparent font-mono text-xs text-white outline-none placeholder:text-white/25"
                aria-label="Пошук авторів"
              />
            </label>
            <p role="status" className="min-h-4 font-mono text-[9px] uppercase tracking-[0.14em] text-[#00f0ff]/60">
              {search.trim()
                ? visibleAuthors.length > 0
                  ? `GPS // знайдено: ${visibleAuthors[0].name}`
                  : "GPS // портал не знайдено"
                : "Введи ім’я — світ знайде портал"}
            </p>
          </div>
        </div>

        <section className="relative h-[min(70dvh,760px)] min-h-[560px] overflow-auto border border-[#00f0ff]/25 bg-[#020811]/70 shadow-[inset_0_0_80px_rgba(0,240,255,0.06),0_0_35px_rgba(0,0,0,0.35)] [scrollbar-color:#00f0ff33_#020811]">
          <div
            className="relative overflow-visible bg-[radial-gradient(circle_at_50%_36%,rgba(16,63,82,0.2),transparent_32%),linear-gradient(145deg,rgba(3,13,22,0.94),rgba(9,4,24,0.96)]"
            style={{ width: `${worldSize.width}px`, height: `${worldSize.height}px` }}
          >
            <div aria-hidden="true" className="absolute left-[12%] top-[27%] h-px w-[74%] rotate-[9deg] bg-gradient-to-r from-transparent via-[#00f0ff]/35 to-transparent" />
            <div aria-hidden="true" className="absolute left-[6%] top-[64%] h-px w-[84%] -rotate-[13deg] bg-gradient-to-r from-transparent via-[#8a2be2]/35 to-transparent" />
            <div aria-hidden="true" className="absolute left-[48%] top-[8%] h-[82%] w-px rotate-[18deg] bg-gradient-to-b from-transparent via-[#00f0ff]/20 to-transparent" />
            <div aria-hidden="true" className="absolute left-1/2 top-[42%] h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#00f0ff]/15 shadow-[0_0_65px_rgba(0,240,255,0.12)]" />
            <div className="absolute inset-x-0 top-4 text-center font-mono text-[9px] uppercase tracking-[0.35em] text-[#00f0ff]/35">
              Координати пам’яті // колесо для подорожі
            </div>

            {visibleAuthors.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
                <p className="max-w-sm font-mono text-sm leading-relaxed text-white/50">
                  {authorsError ?? "Цей сектор ще мовчить. Спробуй інший запит або залиш власний слід."}
                </p>
              </div>
            ) : (
              visibleAuthors.map((author) => (
                <AuthorNode
                  key={author.id}
                  author={author}
                  active={author.id === selectedAuthorId}
                  locating={author.id === locatingAuthorId}
                  nodeRef={(node) => {
                    authorNodeRefs.current[author.id] = node;
                  }}
                  onSelect={() => {
                    setSelectedAuthorId(author.id);
                    setLocation(`/author/${author.slug}`);
                  }}
                />
              ))
            )}
          </div>
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="border border-white/10 bg-black/25 p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#ffad7f]">Як це працює</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {[
                ["01", "Знайди", "Скануй світ і відкривай нові імена."],
                ["02", "Зайди", "Натисни на портал і подивись світ автора."],
                ["03", "Залишся", "Додай власну історію та свої майданчики."],
              ].map(([number, title, text]) => (
                <div key={number} className="border-l border-[#00f0ff]/45 pl-3">
                  <span className="font-mono text-[10px] text-[#00f0ff]">{number}</span>
                  <h3 className="mt-2 font-creepster text-xl tracking-[0.12em] text-[#ffcf9e]">{title}</h3>
                  <p className="mt-1 font-mono text-xs leading-relaxed text-white/45">{text}</p>
                </div>
              ))}
            </div>
          </section>

          {selectedAuthor ? (
            <section className="border border-[#00f0ff]/35 bg-[#06111a]/75 p-5 shadow-[0_0_25px_rgba(0,240,255,0.1)]">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#00f0ff]">Відкритий портал</p>
              <div className="mt-3 flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden border border-[#00f0ff]/50 bg-[radial-gradient(circle,rgba(0,240,255,0.24),rgba(10,5,24,0.95)_68%)] font-mono text-sm font-bold tracking-[0.14em] text-[#b9f7ff]">
                  {selectedAuthor.avatarUrl ? (
                    <img src={selectedAuthor.avatarUrl} alt={`Портрет ${selectedAuthor.name}`} className="h-full w-full bg-black/20 object-contain" />
                  ) : (
                    selectedAuthor.initials
                  )}
                </div>
                <div>
                  <h2 className="font-creepster text-3xl tracking-[0.1em] text-white">{selectedAuthor.name}</h2>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#ffad7f]">{selectedAuthor.role}</p>
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
                className="mt-5 inline-flex min-h-11 items-center border border-[#00f0ff]/65 bg-[#00f0ff]/10 px-4 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#b9f7ff] transition-colors hover:bg-[#00f0ff]/20 hover:text-white"
              >
                Відкрити всі роботи автора
              </Link>
            </section>
          ) : (
            <section className="flex items-center border border-white/10 bg-black/25 p-5">
              <p className="font-mono text-sm leading-relaxed text-white/45">Обери портал у світі, щоб відкрити автора.</p>
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
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#ffad7f]">Local network // authors world</p>
              <h2 className="mt-2 font-creepster text-4xl tracking-[0.12em] text-[#d7b6ff] drop-shadow-[0_0_10px_rgba(138,43,226,0.55)]">
                Загальний чат
              </h2>
              <p className="mt-1 max-w-2xl font-mono text-xs leading-relaxed text-white/45">
                Одна внутрішня кімната для всіх авторів. Повідомлення залишаються на цьому сайті й не передаються у зовнішні месенджери.
              </p>
            </div>
            <div className="border border-[#00f0ff]/25 bg-black/30 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.16em] text-[#8ceeff]">
              {myAuthor ? "Портал підключений до мережі" : "Для повідомлень потрібен портал"}
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_250px]">
            <div className="min-h-72 border border-[#00f0ff]/20 bg-[#02070d]/90 p-3">
              <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2 font-mono text-[9px] uppercase tracking-[0.16em] text-white/35">
                <span>Головна кімната // усі автори</span>
                <span className="text-[#00f0ff]">{chatMessages.length}/100</span>
              </div>
              <div className="max-h-96 min-h-56 space-y-3 overflow-y-auto pr-2 [scrollbar-color:#8a2be244_#02070d]">
                {chatLoading ? (
                  <p className="font-mono text-xs text-white/40">Синхронізація історії повідомлень...</p>
                ) : chatMessages.length === 0 ? (
                  <p className="font-mono text-xs leading-relaxed text-white/40">
                    У мережі поки тихо. Відкрий портал і залиш перше повідомлення.
                  </p>
                ) : (
                  chatMessages.map((message) => (
                    <article key={message.id} className="border-l border-[#00f0ff]/35 pl-3">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <span className="font-mono text-xs font-bold text-[#8ceeff]">{message.author.displayName}</span>
                        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#ffad7f]/70">{message.author.role}</span>
                        <time className="font-mono text-[9px] text-white/25" dateTime={message.createdAt}>
                          {new Date(message.createdAt).toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })}
                        </time>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-white/70">{message.body}</p>
                    </article>
                  ))
                )}
              </div>
            </div>

            <aside className="border border-[#8a2be2]/25 bg-[#10091b]/65 p-4">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#ffad7f]">Стан локальної мережі</p>
              <div className="mt-4 space-y-3 font-mono text-[10px] text-white/55">
                <p><span className="mr-2 text-[#00f0ff]">●</span>Автори бачать імена та ніки одне одного.</p>
                <p><span className="mr-2 text-[#00f0ff]">●</span>Історія зберігається у спільній кімнаті.</p>
                <p><span className="mr-2 text-[#00f0ff]">●</span>Канал працює тільки всередині сайту.</p>
              </div>
            </aside>
          </div>

          {chatError && (
            <p className="mt-3 border border-[#ff7043]/35 bg-[#ff7043]/5 px-3 py-2 font-mono text-xs text-[#ffb184]">{chatError}</p>
          )}

          {myAuthor ? (
            <form onSubmit={handleSendChat} className="mt-4 flex flex-col gap-3 sm:flex-row">
              <label className="sr-only" htmlFor="authors-world-chat-input">Повідомлення у загальний чат</label>
              <input
                id="authors-world-chat-input"
                value={chatDraft}
                onChange={(event) => setChatDraft(event.target.value)}
                maxLength={1000}
                placeholder={`Написати від імені ${myAuthor.name}...`}
                className="min-h-12 min-w-0 flex-1 border border-white/15 bg-black/35 px-3 font-mono text-sm text-white outline-none placeholder:text-white/25 focus:border-[#00f0ff]/60"
              />
              <button
                type="submit"
                disabled={isSendingChat || !chatDraft.trim()}
                className="min-h-12 border border-[#00f0ff]/60 bg-[#00f0ff]/10 px-5 font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#b9f7ff] transition-all hover:bg-[#00f0ff]/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isSendingChat ? "ВІДПРАВЛЕННЯ..." : "НАДІСЛАТИ"}
              </button>
            </form>
          ) : (
            <p className="mt-4 border border-white/10 bg-black/20 px-3 py-3 font-mono text-xs leading-relaxed text-white/45">
              Щоб писати у внутрішньому чаті, створи авторський портал після входу на сайт.{" "}
              <Link href="/sign-in" className="text-[#8ceeff] underline decoration-[#00f0ff]/50 underline-offset-4 hover:text-white">
                Увійти
              </Link>
            </p>
          )}
        </section>
      </div>

      {isRegistering && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#02040a]/85 p-4 backdrop-blur-md">
          <div role="dialog" aria-modal="true" aria-labelledby="author-registration-title" className="max-h-[calc(100dvh-32px)] w-full max-w-xl overflow-y-auto border border-[#00f0ff]/55 bg-[#06111a]/95 p-5 shadow-[0_0_45px_rgba(0,240,255,0.2)] sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#ffad7f]">Новий портал</p>
                <h2 id="author-registration-title" className="mt-2 font-creepster text-4xl tracking-[0.1em] text-[#00f0ff]">Залишитися у спогаді</h2>
              </div>
              <button type="button" onClick={() => setIsRegistering(false)} className="border border-white/15 px-3 py-2 font-mono text-xs text-white/55 transition-colors hover:border-[#00f0ff] hover:text-white" aria-label="Закрити форму">
                ЗАКРИТИ
              </button>
            </div>
              <p className="mt-3 font-mono text-xs leading-relaxed text-white/55">
               Створи або онови свій портал. Профіль збережеться у внутрішній базі сайту, автоматично з’явиться у світі авторів і дасть доступ до загального чату. Для публікації потрібен звичайний акаунт із email та паролем.
            </p>
            {formError && (
              <p className="mt-4 border border-[#ff7043]/40 bg-[#ff7043]/5 px-3 py-2 font-mono text-xs leading-relaxed text-[#ffb184]">
                {formError}{" "}
                {formError.toLowerCase().includes("sign in") || formError.toLowerCase().includes("увій") ? (
                  <>
                    <Link href="/sign-in" className="text-[#8ceeff] underline underline-offset-4 hover:text-white">Увійти</Link>
                    <span className="text-white/35"> або </span>
                    <Link href="/sign-up" className="text-[#ffcf9e] underline underline-offset-4 hover:text-white">створити акаунт</Link>
                  </>
                ) : null}
              </p>
            )}
            <form onSubmit={handleRegister} className="mt-6 space-y-4">
              <label className="block">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#b9f7ff]">Ім’я або псевдонім *</span>
                <input name="displayName" autoComplete="nickname" required value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} className="mt-2 min-h-11 w-full border border-white/15 bg-black/30 px-3 font-mono text-sm text-white outline-none transition-colors focus:border-[#00f0ff]/70" placeholder="Твоє ім’я або назва проєкту" />
              </label>
              <label className="block">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#b9f7ff]">Хто ти у цьому світі *</span>
                <input name="role" autoComplete="organization-title" required value={draft.role} onChange={(event) => setDraft((current) => ({ ...current, role: event.target.value }))} className="mt-2 min-h-11 w-full border border-white/15 bg-black/30 px-3 font-mono text-sm text-white outline-none transition-colors focus:border-[#00f0ff]/70" placeholder="Музикант, авторка, художник..." />
              </label>
              <label className="block">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#b9f7ff]">Що ти залишаєш у пам’яті? *</span>
                <textarea name="bio" autoComplete="off" required value={draft.memory} onChange={(event) => setDraft((current) => ({ ...current, memory: event.target.value }))} className="mt-2 min-h-24 w-full resize-y border border-white/15 bg-black/30 px-3 py-3 font-mono text-sm text-white outline-none transition-colors focus:border-[#00f0ff]/70" placeholder="Коротке послання або опис твоєї творчості" />
              </label>
              <div className="block">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#b9f7ff]">Іконка профілю</span>
                <span className="mt-1 block font-mono text-[9px] leading-relaxed text-white/40">
                  Додай свій малюнок. У світі він буде маленьким, а при наведенні повністю розгорнеться разом з інформацією автора.
                </span>
                <label className="mt-3 flex min-h-14 cursor-pointer items-center justify-center gap-3 border border-dashed border-[#00f0ff]/55 bg-[#00f0ff]/5 px-4 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#b9f7ff] transition-colors hover:border-[#00f0ff] hover:bg-[#00f0ff]/12">
                  <ImagePlus className="h-5 w-5" aria-hidden="true" />
                  {isProcessingAvatar ? "ПІДГОТОВКА ІКОНКИ..." : "ДОДАТИ ІКОНКУ ПРОФІЛЮ"}
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
                {avatarError && <p className="mt-2 font-mono text-[10px] text-[#ffb184]">{avatarError}</p>}
                <label className="mt-3 block">
                  <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/40">Або пряме посилання</span>
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
                      alt="Попередній перегляд фото профілю"
                      className="h-16 w-16 rounded-full border border-[#00f0ff]/45 object-cover"
                    />
                    <span className="font-mono text-[10px] leading-relaxed text-white/45">
                      Попередній перегляд. Після збереження фото з’явиться у світі авторів і чаті.
                    </span>
                  </span>
                )}
              </div>
              <div className="block">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#b9f7ff]">Фон профілю</span>
                <span className="mt-1 block font-mono text-[9px] leading-relaxed text-white/40">
                  Завантаж широке зображення — воно стане атмосферним тлом твоєї сторінки автора.
                </span>
                <label className="mt-3 flex min-h-14 cursor-pointer items-center justify-center gap-3 border border-dashed border-[#8a2be2]/65 bg-[#8a2be2]/8 px-4 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#e1c8ff] transition-colors hover:border-[#b98cff] hover:bg-[#8a2be2]/15">
                  <ImagePlus className="h-5 w-5" aria-hidden="true" />
                  {isProcessingBackground ? "ПІДГОТОВКА ФОНУ..." : "ДОДАТИ ФОН ПРОФІЛЮ"}
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
                  <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/40">Або пряме посилання</span>
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
                  <div className="relative mt-3 h-32 overflow-hidden border border-[#8a2be2]/40 bg-[#07131b]" role="img" aria-label="Попередній перегляд фону профілю">
                    <img src={draft.backgroundUrl} alt="" className="absolute inset-0 h-full w-full object-cover object-center" />
                    <div className="relative flex h-full items-end bg-[linear-gradient(180deg,rgba(2,4,10,0.18),rgba(2,4,10,0.7))] p-3 font-mono text-[10px] uppercase tracking-[0.14em] text-white/70">
                      Попередній перегляд широкого фону
                    </div>
                  </div>
                )}
              </div>
              <fieldset className="border border-white/10 bg-black/20 p-3 sm:p-4">
                <legend className="px-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#b9f7ff]">Твої майданчики</legend>
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <p className="font-mono text-[10px] leading-relaxed text-white/45">
                    Додай окрему адресу для кожного профілю. Порожні рядки не збережуться.
                  </p>
                  <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.14em] text-[#00f0ff]/55">
                    {draft.links.length} {draft.links.length === 1 ? "рядок" : "рядки"}
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
                              <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.14em] text-white/40">Майданчик {linkIndex + 1}</span>
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
                                  aria-label={`Вибрати майданчик ${linkIndex + 1}`}
                                >
                                  {PLATFORM_OPTIONS.map((platform) => (
                                    <option key={platform.value} value={platform.value} className="bg-[#06111a] text-white">
                                      {platform.label}
                                    </option>
                                  ))}
                                </select>
                              </span>
                            </label>

                            <label className="block min-w-0">
                              <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.14em] text-white/40">Адреса профілю</span>
                              <input
                                type="url"
                                value={link.url}
                                onChange={(event) => setDraft((current) => ({
                                  ...current,
                                  links: current.links.map((item, index) => index === linkIndex ? { ...item, url: event.target.value } : item),
                                }))}
                                className="min-h-11 w-full border border-white/15 bg-[#06111a]/90 px-3 font-mono text-xs text-white outline-none transition-colors placeholder:text-white/25 focus:border-[#00f0ff]/70"
                                placeholder={option.placeholder}
                                aria-label={`Адреса профілю ${linkIndex + 1}`}
                              />
                            </label>

                            <button
                              type="button"
                              onClick={() => setDraft((current) => ({
                                ...current,
                                links: current.links.filter((_, index) => index !== linkIndex),
                              }))}
                              className="inline-flex min-h-11 items-center justify-center gap-2 border border-[#ff7043]/35 px-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[#ffb184] transition-colors hover:border-[#ff7043] hover:bg-[#ff7043]/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7043] sm:w-11 sm:px-0"
                              aria-label={`Видалити майданчик ${linkIndex + 1}`}
                            >
                              <Trash2 aria-hidden="true" className="h-4 w-4" />
                              <span className="sm:hidden">Видалити</span>
                            </button>
                          </div>

                          {link.platform === "other" && (
                            <label className="mt-3 block">
                              <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.14em] text-white/40">Назва майданчика</span>
                              <input
                                value={link.customLabel}
                                onChange={(event) => setDraft((current) => ({
                                  ...current,
                                  links: current.links.map((item, index) => index === linkIndex ? { ...item, customLabel: event.target.value } : item),
                                }))}
                                className="min-h-10 w-full border border-white/15 bg-[#06111a]/90 px-3 font-mono text-xs text-white outline-none transition-colors placeholder:text-white/25 focus:border-[#00f0ff]/70"
                                placeholder="Наприклад, Telegram або Patreon"
                              />
                            </label>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="border border-dashed border-white/15 px-3 py-4 font-mono text-xs text-white/40">
                      Поки що немає адрес. Додай перший майданчик нижче.
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setDraft((current) => ({ ...current, links: [...current.links, emptyPlatformLink()] }))}
                  className="mt-3 inline-flex min-h-10 items-center gap-2 border border-[#8a2be2]/60 bg-[#8a2be2]/10 px-3 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#d7b6ff] transition-all hover:border-[#00f0ff] hover:bg-[#00f0ff]/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00f0ff]"
                >
                  <Plus aria-hidden="true" className="h-4 w-4" />
                  Додати майданчик
                </button>
              </fieldset>
              <button type="submit" disabled={isSavingProfile} className="min-h-12 w-full border border-[#00f0ff]/70 bg-[#00f0ff]/10 font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#b9f7ff] transition-all hover:bg-[#00f0ff]/20 hover:text-white hover:shadow-[0_0_24px_rgba(0,240,255,0.35)] disabled:cursor-wait disabled:opacity-50">
                {isSavingProfile ? "ПІДКЛЮЧЕННЯ ДО МЕРЕЖІ..." : myAuthor ? "ЗБЕРЕГТИ МІЙ ПОРТАЛ" : "ВІДКРИТИ МІЙ ПОРТАЛ"}
              </button>
            </form>
            {myAuthor && (
              <section className="mt-8 border-t border-[#00f0ff]/20 pt-6">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#ffad7f]">Публічні роботи</p>
                    <h3 className="mt-1 font-creepster text-3xl tracking-[0.1em] text-[#d7b6ff]">Банери та картки</h3>
                  </div>
                  <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/35">{creations.length} збережено</span>
                </div>
                <p className="mt-2 font-mono text-[10px] leading-relaxed text-white/45">
                  Додай посилання на окрему роботу. Відвідувачі побачать її у вкладці відповідного майданчика, зокрема у вкладці YouTube.
                </p>
                {creationError && <p className="mt-3 border border-[#ff7043]/35 bg-[#ff7043]/5 px-3 py-2 font-mono text-xs text-[#ffb184]">{creationError}</p>}
                {creations.length > 0 && (
                  <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1 [scrollbar-color:#00f0ff55_#06111a]">
                    {creations.map((creation) => (
                      <div key={creation.id} className="flex items-center justify-between gap-3 border border-white/10 bg-black/20 p-3">
                        <div className="min-w-0">
                          <p className="truncate font-mono text-xs text-white">{creation.title}</p>
                          <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[#8ceeff]">{creation.platform} // {creation.kind}</p>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <button type="button" onClick={() => {
                            setEditingCreationId(creation.id);
                            setCreationDraft({
                              platform: (creation.platform as PlatformKey) || "other",
                              kind: (creation.kind as CreationDraft["kind"]) || "card",
                              title: creation.title,
                              description: creation.description,
                              imageUrl: creation.imageUrl ?? "",
                              contentUrl: creation.contentUrl ?? "",
                            });
                          }} className="border border-white/15 px-2 py-2 font-mono text-[9px] uppercase text-white/60 hover:border-[#00f0ff] hover:text-white">Змінити</button>
                          <button type="button" onClick={() => void handleDeleteCreation(creation.id)} className="border border-[#ff7043]/35 px-2 py-2 font-mono text-[9px] uppercase text-[#ffb184] hover:border-[#ff7043]">Видалити</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <form onSubmit={handleSaveCreation} className="mt-4 grid gap-3 border border-white/10 bg-black/20 p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/45">Майданчик</span>
                      <select value={creationDraft.platform} onChange={(event) => setCreationDraft((current) => ({ ...current, platform: event.target.value as PlatformKey }))} className="mt-2 min-h-10 w-full border border-white/15 bg-[#06111a] px-3 font-mono text-xs text-white outline-none focus:border-[#00f0ff]/70">
                        {PLATFORM_OPTIONS.map((option) => <option key={option.value} value={option.value} className="bg-[#06111a]">{option.label}</option>)}
                      </select>
                    </label>
                    <label className="block">
                      <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/45">Формат</span>
                      <select value={creationDraft.kind} onChange={(event) => setCreationDraft((current) => ({ ...current, kind: event.target.value as CreationDraft["kind"] }))} className="mt-2 min-h-10 w-full border border-white/15 bg-[#06111a] px-3 font-mono text-xs text-white outline-none focus:border-[#00f0ff]/70">
                        <option value="banner" className="bg-[#06111a]">Банер</option>
                        <option value="card" className="bg-[#06111a]">Картка</option>
                        <option value="creation" className="bg-[#06111a]">Творіння</option>
                      </select>
                    </label>
                  </div>
                  <label className="block">
                    <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/45">Назва роботи *</span>
                    <input required value={creationDraft.title} onChange={(event) => setCreationDraft((current) => ({ ...current, title: event.target.value }))} className="mt-2 min-h-10 w-full border border-white/15 bg-[#06111a] px-3 font-mono text-xs text-white outline-none focus:border-[#00f0ff]/70" placeholder="Назва пісні, відео або проєкту" />
                  </label>
                  <label className="block">
                    <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/45">Опис</span>
                    <textarea value={creationDraft.description} onChange={(event) => setCreationDraft((current) => ({ ...current, description: event.target.value }))} className="mt-2 min-h-20 w-full resize-y border border-white/15 bg-[#06111a] px-3 py-2 font-mono text-xs text-white outline-none focus:border-[#00f0ff]/70" placeholder="Коротко про цю роботу" />
                  </label>
                  <label className="block">
                    <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/45">Посилання на роботу *</span>
                    <input required type="url" value={creationDraft.contentUrl} onChange={(event) => setCreationDraft((current) => ({ ...current, contentUrl: event.target.value }))} className="mt-2 min-h-10 w-full border border-white/15 bg-[#06111a] px-3 font-mono text-xs text-white outline-none focus:border-[#00f0ff]/70" placeholder="https://youtube.com/watch?v=..." />
                  </label>
                  <label className="block">
                    <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/45">Обкладинка (необов’язково)</span>
                    <input type="url" value={creationDraft.imageUrl} onChange={(event) => setCreationDraft((current) => ({ ...current, imageUrl: event.target.value }))} className="mt-2 min-h-10 w-full border border-white/15 bg-[#06111a] px-3 font-mono text-xs text-white outline-none focus:border-[#00f0ff]/70" placeholder="https://.../cover.jpg" />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button type="submit" disabled={isSavingCreation} className="min-h-10 border border-[#8a2be2]/70 bg-[#8a2be2]/15 px-4 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#d7b6ff] hover:border-[#00f0ff] hover:text-white disabled:opacity-50">{isSavingCreation ? "ЗБЕРЕЖЕННЯ..." : editingCreationId ? "ЗБЕРЕГТИ ЗМІНИ" : "ДОДАТИ РОБОТУ"}</button>
                    {editingCreationId && <button type="button" onClick={() => { setEditingCreationId(null); setCreationDraft(EMPTY_CREATION_DRAFT); }} className="min-h-10 border border-white/15 px-4 font-mono text-[10px] uppercase text-white/55 hover:text-white">Скасувати</button>}
                  </div>
                </form>
              </section>
            )}
          </div>
        </div>
      )}
    </main>
  );
}