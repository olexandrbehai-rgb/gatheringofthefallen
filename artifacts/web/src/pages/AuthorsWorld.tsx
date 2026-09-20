import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Globe2, ImagePlus, Link2, LocateFixed, LogIn, LogOut, Mail, Minus, Move, Music2, Plus, Trash2, UploadCloud, ZoomIn, ZoomOut } from "lucide-react";
import { motion } from "framer-motion";
import { useClerk, useUser } from "@clerk/react";
import type { IconType } from "react-icons";
import { SiBandcamp, SiInstagram, SiSuno, SiSpotify, SiSoundcloud, SiTiktok, SiYoutube, SiYoutubemusic } from "react-icons/si";
import { Link, useLocation } from "wouter";
import { useT } from "@/i18n/LanguageContext";
import { AUTHORS_WORLD_COPY, formatAuthorsWorldCopy } from "@/i18n/authorsWorld";

type AuthorLink = {
  label: string;
  url: string;
};

type PlatformKey = "website" | "spotify" | "suno" | "youtube-music" | "youtube" | "instagram" | "tiktok" | "bandcamp" | "soundcloud" | "audio" | "other";

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
  audioUrl?: string | null;
  audioObjectPath?: string | null;
  audioSizeBytes?: number | null;
  audioDurationSeconds?: number | null;
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

const API_ROOT = `${import.meta.env.BASE_URL}api`;

const WORLD_COLUMNS = 4;
const WORLD_CELL_WIDTH = 260;
const WORLD_CELL_HEIGHT = 220;
const WORLD_PADDING_X = 150;
const WORLD_PADDING_Y = 150;
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

function worldDimensions(authorCount: number, compact = false) {
  const columns = compact ? 1 : WORLD_COLUMNS;
  const rows = Math.max(1, Math.ceil(Math.max(authorCount, 1) / columns));

  return {
    width: compact ? 300 : Math.max(1040, WORLD_PADDING_X * 2 + (WORLD_COLUMNS - 1) * WORLD_CELL_WIDTH),
    height: compact ? Math.max(300, 200 + (rows - 1) * 170) : Math.max(760, WORLD_PADDING_Y * 2 + (rows - 1) * WORLD_CELL_HEIGHT),
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
  { value: "suno", label: "Suno", placeholder: "https://suno.com/song/...", icon: SiSuno, color: "#ff6bba" },
  { value: "youtube-music", label: "YouTube Music", placeholder: "https://music.youtube.com/channel/...", icon: SiYoutubemusic, color: "#ff0033" },
  { value: "youtube", label: "YouTube", placeholder: "https://youtube.com/@твій-канал", icon: SiYoutube, color: "#ff0033" },
  { value: "instagram", label: "Instagram", placeholder: "https://instagram.com/твій-профіль", icon: SiInstagram, color: "#e4405f" },
  { value: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@твій-профіль", icon: SiTiktok, color: "#69c9d0" },
  { value: "bandcamp", label: "Bandcamp", placeholder: "https://твій-лейбл.bandcamp.com", icon: SiBandcamp, color: "#629aa9" },
  { value: "soundcloud", label: "SoundCloud", placeholder: "https://soundcloud.com/твій-профіль", icon: SiSoundcloud, color: "#ff5500" },
  { value: "audio", label: "MP3 / авторська музика", placeholder: "", icon: Music2, color: "#b9f7ff" },
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
  audioObjectPath: "",
  audioFileName: "",
  audioSizeBytes: null,
  audioDurationSeconds: null,
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
      } ${locating ? "author-node-locating" : ""}`}
       style={{ left: `${nodePosition.left}px`, top: `${nodePosition.top}px`, transformOrigin: "left center" }}
      aria-label={ariaLabel}
    >
       <span className="relative flex h-16 w-16 items-center overflow-visible rounded-full border border-[#00f0ff]/70 bg-[#07131b]/95 text-left text-[#b9f7ff] shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-[width,height,border-radius,box-shadow] duration-300 group-hover:h-44 group-hover:w-96 group-hover:rounded-2xl group-hover:border-white group-hover:shadow-[0_0_36px_rgba(0,240,255,0.9)] group-focus-visible:h-44 group-focus-visible:w-96 group-focus-visible:rounded-2xl">
         <span className={`relative z-10 flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#00f0ff]/45 bg-[#07131b]/95 font-mono text-xs font-bold tracking-[0.16em] transition-[width,height,border-radius] duration-300 group-hover:h-full group-hover:w-36 group-hover:rounded-none group-hover:border-0 group-focus-visible:h-full group-focus-visible:w-36 group-focus-visible:rounded-none group-focus-visible:border-0 ${
          ""
        }`}>
          <span aria-hidden="true" className="absolute inset-1 rounded-full border border-dashed border-[#00f0ff]/50 transition-[inset,border-radius] duration-300 group-hover:inset-2 group-hover:rounded-xl group-focus-visible:inset-2 group-focus-visible:rounded-xl" />
          {author.avatarUrl ? (
            <img src={author.avatarUrl} alt="" className="h-full w-full bg-black/20 object-contain" />
          ) : (
            <Plus className="relative h-7 w-7 text-[#00f0ff]/80" aria-hidden="true" />
          )}
        </span>
        <span className="relative z-20 hidden min-w-0 flex-1 flex-col justify-center px-4 py-2 opacity-0 transition-opacity duration-200 group-hover:flex group-hover:opacity-100 group-focus-visible:flex group-focus-visible:opacity-100">
           <span className="truncate font-creepster text-2xl tracking-[0.08em] text-[#00f0ff] antialiased">{author.name}</span>
           <span className="mt-1 truncate font-mono text-[11px] uppercase tracking-[0.14em] text-[#ffad7f] antialiased">{author.role}</span>
           <span className="mt-3 line-clamp-3 font-mono text-[11px] leading-relaxed text-white/70 antialiased">{author.memory}</span>
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
  const [creations, setCreations] = useState<AuthorCreation[]>([]);
  const [creationDraft, setCreationDraft] = useState<CreationDraft>(EMPTY_CREATION_DRAFT);
  const [creationError, setCreationError] = useState<string | null>(null);
  const [isSavingCreation, setIsSavingCreation] = useState(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [creationSavedNotice, setCreationSavedNotice] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [editingCreationId, setEditingCreationId] = useState<number | null>(null);
  const [locatingAuthorId, setLocatingAuthorId] = useState<string | null>(null);
  const [isCompactViewport, setIsCompactViewport] = useState(false);
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
  const worldSize = useMemo(() => worldDimensions(authors.length, isCompactViewport), [authors.length, isCompactViewport]);
  const accountEmail = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress ?? "";

  const openAuthorPortal = () => {
    setFormError(null);
    setProfileSavedNotice(null);
    if (!authLoaded || !isSignedIn) {
      setLocation("/sign-in");
      return;
    }
    setIsRegistering(true);
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
    const updateViewport = () => setIsCompactViewport(mediaQuery.matches);
    updateViewport();
    mediaQuery.addEventListener("change", updateViewport);
    return () => mediaQuery.removeEventListener("change", updateViewport);
  }, []);

  useEffect(() => {
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
      if (active) setChatError(copy.errors.liveInterrupted);
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
      centerWorldOn(worldPositionFor(matchIndex, isCompactViewport));
    });
    const timeout = window.setTimeout(() => setLocatingAuthorId(null), 1400);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [authors, centerWorldOn, isCompactViewport, search]);

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
      setCreationSavedNotice(copy.notices.workSaved);
    } catch (error) {
      setCreationError(error instanceof Error ? error.message : copy.errors.saveWork);
    } finally {
      setIsUploadingAudio(false);
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
               <p className="mt-1 truncate font-mono text-[10px] text-white/55">
                 {!authLoaded
                    ? copy.account.checking
                   : isSignedIn
                      ? accountEmail || copy.account.verified
                      : copy.account.description}
               </p>
             </div>
             <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
               {!authLoaded ? (
                  <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/40">{copy.account.loading}</span>
               ) : isSignedIn ? (
                 <>
                   <button
                     type="button"
                     onClick={openAuthorPortal}
                     className="authors-world-compact-action authors-world-control-cyan inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 border px-3 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[#d9fbff] transition-all sm:flex-none"
                   >
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" /> {copy.account.myPortal}
                   </button>
                   <button
                     type="button"
                     onClick={() => void handleAuthorSignOut()}
                     className="authors-world-compact-action authors-world-control-orange inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 border px-3 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[#ffd0ba] transition-all sm:flex-none"
                   >
                      <LogOut className="h-3.5 w-3.5" aria-hidden="true" /> {copy.account.signOut}
                   </button>
                 </>
               ) : (
                 <>
                   <Link
                     href="/sign-in"
                      className="authors-world-compact-action authors-world-control-cyan inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 border px-3 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[#d9fbff] transition-all sm:flex-none"
                   >
                      <LogIn className="h-3.5 w-3.5" aria-hidden="true" /> {copy.account.signIn}
                   </Link>
                   <Link
                     href="/sign-up"
                      className="authors-world-compact-action authors-world-control-orange inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 border px-3 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[#ffe0c0] transition-all sm:flex-none"
                   >
                      <Mail className="h-3.5 w-3.5" aria-hidden="true" /> {copy.account.signUp}
                   </Link>
                 </>
               )}
             </div>
           </div>
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
                      return hoveredAuthorId && hoveredAuthorId !== author.id ? null : (
                        <AuthorNode
                          key={author.id}
                          author={author}
                          ariaLabel={`${author.name}, ${author.role}. ${copy.selected.open}`}
                          position={worldPositionFor(authorIndex, isCompactViewport)}
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
                     <img src={selectedAuthor.avatarUrl} alt={formatAuthorsWorldCopy(copy.selected.portrait, { name: selectedAuthor.name })} className="h-full w-full bg-black/20 object-contain" />
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
                  chatMessages.map((message) => (
                    <article key={message.id} className="border-l border-[#00f0ff]/35 pl-3">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <span className="font-mono text-xs font-bold text-[#8ceeff]">{message.author.displayName}</span>
                        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#ffad7f]/70">{message.author.role}</span>
                        <time className="font-mono text-[9px] text-white/25" dateTime={message.createdAt}>
                           {new Date(message.createdAt).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
                        </time>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-white/70">{message.body}</p>
                    </article>
                  ))
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
              <input
                id="authors-world-chat-input"
                value={chatDraft}
                onChange={(event) => setChatDraft(event.target.value)}
                maxLength={1000}
                 placeholder={formatAuthorsWorldCopy(copy.chat.placeholder, { name: myAuthor.name })}
                className="min-h-12 min-w-0 flex-1 border border-white/15 bg-black/35 px-3 font-mono text-sm text-white outline-none placeholder:text-white/25 focus:border-[#00f0ff]/60"
              />
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
         <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto overscroll-contain bg-[#02040a]/85 p-2 backdrop-blur-md sm:items-center sm:p-4">
           <div role="dialog" aria-modal="true" aria-labelledby="author-registration-title" className="my-2 max-h-[calc(100dvh-16px)] w-full max-w-xl overflow-y-auto border border-[#00f0ff]/55 bg-[#06111a]/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_0_45px_rgba(0,240,255,0.2)] sm:my-0 sm:max-h-[calc(100dvh-32px)] sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                 <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#ffad7f]">{copy.editor.newPortal}</p>
                  <h2 id="author-registration-title" className="mt-2 font-creepster text-3xl tracking-[0.08em] text-[#00f0ff] sm:text-4xl sm:tracking-[0.1em]">{copy.editor.title}</h2>
              </div>
               <button type="button" onClick={() => setIsRegistering(false)} className="border border-white/15 px-3 py-2 font-mono text-xs text-white/55 transition-colors hover:border-[#00f0ff] hover:text-white" aria-label={copy.editor.closeAria}>
                 {copy.editor.close}
              </button>
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
                        <img src={draft.avatarUrl} alt={copy.editor.avatarPreview} className="h-full w-full rounded-full object-cover transition-transform duration-300 group-hover:scale-110" />
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
                      className="h-16 w-16 rounded-full border border-[#00f0ff]/45 object-cover"
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
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#ffad7f]">{copy.creations.eyebrow}</p>
                    <h3 className="mt-1 font-creepster text-3xl tracking-[0.1em] text-[#d7b6ff]">{copy.creations.title}</h3>
                  </div>
                  <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/35">{formatAuthorsWorldCopy(copy.creations.saved, { count: creations.length })}</span>
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
                            setCreationSavedNotice(null);
                            setEditingCreationId(creation.id);
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
                )}
                <form onSubmit={handleSaveCreation} className="mt-4 grid gap-3 border border-white/10 bg-black/20 p-4">
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
                      {editingCreationId && <button type="button" onClick={() => { setEditingCreationId(null); setCreationSavedNotice(null); setAudioFile(null); setAudioError(null); setCreationDraft(EMPTY_CREATION_DRAFT); }} className="min-h-10 border border-white/15 px-4 font-mono text-[10px] uppercase text-white/55 hover:text-white">{copy.creations.cancel}</button>}
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