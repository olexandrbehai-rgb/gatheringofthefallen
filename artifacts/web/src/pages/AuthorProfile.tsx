import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, ExternalLink, Pencil, Play } from "lucide-react";
import { Link, useLocation } from "wouter";

const API_ROOT = `${import.meta.env.BASE_URL}api`;

type PlatformLink = { label: string; url: string };
type Author = {
  id: number;
  displayName: string;
  role: string;
  bio: string;
  avatarUrl?: string | null;
  backgroundUrl?: string | null;
  platformLinks: PlatformLink[];
  slug: string;
};
type Creation = {
  id: number;
  platform: string;
  kind: string;
  title: string;
  description: string;
  imageUrl?: string | null;
  contentUrl?: string | null;
};

const PLATFORM_LABELS: Record<string, string> = {
  website: "Сайт",
  spotify: "Spotify",
  "youtube-music": "YouTube Music",
  youtube: "YouTube",
  instagram: "Instagram",
  tiktok: "TikTok",
  bandcamp: "Bandcamp",
  soundcloud: "SoundCloud",
  other: "Інше",
};

function platformForLink(link: PlatformLink) {
  const haystack = `${link.label} ${link.url}`.toLowerCase();
  if (haystack.includes("youtube music") || haystack.includes("music.youtube")) return "youtube-music";
  if (haystack.includes("youtube")) return "youtube";
  if (haystack.includes("spotify")) return "spotify";
  if (haystack.includes("instagram")) return "instagram";
  if (haystack.includes("tiktok")) return "tiktok";
  if (haystack.includes("bandcamp")) return "bandcamp";
  if (haystack.includes("soundcloud")) return "soundcloud";
  if (haystack.includes("site") || haystack.includes("портф")) return "website";
  return "other";
}

function youtubeId(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "youtu.be") return parsed.pathname.slice(1).split("/")[0] || null;
    if (parsed.hostname.endsWith("youtube.com")) {
      return parsed.searchParams.get("v") ?? parsed.pathname.match(/\/(?:shorts|embed)\/([^/?]+)/)?.[1] ?? null;
    }
  } catch {
    return null;
  }
  return null;
}

function initialsFor(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "??";
}

export default function AuthorProfile({ params }: { params: { slug: string } }) {
  const [, setLocation] = useLocation();
  const [author, setAuthor] = useState<Author | null>(null);
  const [creations, setCreations] = useState<Creation[]>([]);
  const [canEdit, setCanEdit] = useState(false);
  const [activePlatform, setActivePlatform] = useState("all");
  const [creationSearch, setCreationSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(24);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`${API_ROOT}/authors-world/author/${encodeURIComponent(params.slug)}`, { credentials: "include" })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({})) as {
          author?: Author;
          creations?: Creation[];
          canEdit?: boolean;
          error?: string;
        };
        if (!response.ok || !payload.author) throw new Error(payload.error ?? "Портал автора не знайдено.");
        if (!active) return;
        setAuthor(payload.author);
        setCreations(Array.isArray(payload.creations) ? payload.creations : []);
        setCanEdit(Boolean(payload.canEdit));
        const firstPlatform = payload.creations?.[0]?.platform;
        if (firstPlatform) setActivePlatform(firstPlatform);
      })
      .catch((requestError) => {
        if (active) setError(requestError instanceof Error ? requestError.message : "Портал автора недоступний.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [params.slug]);

  const tabs = useMemo(() => {
    const values = new Map<string, string>();
    author?.platformLinks.forEach((link) => {
      const platform = platformForLink(link);
      values.set(platform, PLATFORM_LABELS[platform] ?? link.label);
    });
    creations.forEach((creation) => {
      if (!values.has(creation.platform)) values.set(creation.platform, PLATFORM_LABELS[creation.platform] ?? creation.platform);
    });
    return [...values.entries()];
  }, [author, creations]);

  const visibleCreations = activePlatform === "all"
    ? creations
    : creations.filter((creation) => creation.platform === activePlatform);
  const searchedCreations = visibleCreations.filter((creation) =>
    `${creation.title} ${creation.description}`.toLowerCase().includes(creationSearch.trim().toLowerCase()),
  );
  const pagedCreations = searchedCreations.slice(0, visibleCount);

  useEffect(() => {
    setVisibleCount(24);
  }, [activePlatform, creationSearch]);

  if (loading) {
    return <main className="min-h-[calc(100dvh-82px)] bg-[#03060b] px-6 py-20 text-center font-mono text-sm text-[#8ceeff]">ПІДКЛЮЧЕННЯ ДО ПОРТАЛУ...</main>;
  }
  if (error || !author) {
    return (
      <main className="min-h-[calc(100dvh-82px)] bg-[#03060b] px-6 py-20 text-center text-white">
        <p className="font-mono text-sm text-[#ffb184]">{error ?? "Портал не знайдено."}</p>
        <Link href="/authors-world" className="mt-6 inline-flex border border-[#00f0ff]/60 px-4 py-3 font-mono text-xs text-[#b9f7ff]">Повернутися до світу авторів</Link>
      </main>
    );
  }

  return (
    <main className="relative min-h-[calc(100dvh-82px)] overflow-hidden bg-[#03060b] px-4 py-10 text-white sm:px-6 lg:px-10">
      {author.backgroundUrl && (
        <img
          src={author.backgroundUrl}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
        />
      )}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(2,4,10,0.58)_0%,rgba(2,4,10,0.48)_34%,rgba(2,4,10,0.86)_100%),radial-gradient(circle_at_50%_0%,rgba(0,240,255,0.18),transparent_38%),radial-gradient(circle_at_82%_58%,rgba(138,43,226,0.2),transparent_42%)]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(0,240,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.06)_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/authors-world" className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/50 hover:text-[#00f0ff]">← Світ авторів</Link>
          {canEdit && (
            <button type="button" onClick={() => setLocation("/authors-world?edit=1")} className="inline-flex items-center gap-2 border border-[#00f0ff]/60 bg-[#00f0ff]/10 px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#b9f7ff] hover:bg-[#00f0ff]/20">
              <Pencil className="h-3.5 w-3.5" /> Редагувати мій портал
            </button>
          )}
        </div>
        <header className="mt-10 grid gap-6 border-b border-[#00f0ff]/25 pb-8 md:grid-cols-[auto_1fr] md:items-center">
          <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-[#00f0ff]/70 bg-[#07131b] font-mono text-2xl font-bold text-[#b9f7ff] shadow-[0_0_34px_rgba(0,240,255,0.25)]">
            {author.avatarUrl ? <img src={author.avatarUrl} alt="" className="h-full w-full object-contain" /> : initialsFor(author.displayName)}
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#ffad7f]">Авторський портал // {author.slug}</p>
            <h1 className="mt-2 font-creepster text-6xl tracking-[0.08em] text-[#00f0ff]">{author.displayName}</h1>
            <p className="mt-1 font-mono text-xs uppercase tracking-[0.18em] text-[#ffcf9e]">{author.role}</p>
            <p className="mt-5 max-w-3xl font-mono text-sm leading-relaxed text-white/65">“{author.bio}”</p>
          </div>
        </header>

        <div className="mt-8 flex flex-wrap gap-2">
          <button type="button" onClick={() => setActivePlatform("all")} className={`border px-4 py-3 font-mono text-[10px] uppercase tracking-[0.14em] ${activePlatform === "all" ? "border-[#00f0ff] bg-[#00f0ff]/15 text-white" : "border-white/15 text-white/55 hover:border-[#00f0ff]/50"}`}>Усі роботи</button>
          {tabs.map(([platform, label]) => (
            <button key={platform} type="button" onClick={() => setActivePlatform(platform)} className={`border px-4 py-3 font-mono text-[10px] uppercase tracking-[0.14em] ${activePlatform === platform ? "border-[#8a2be2] bg-[#8a2be2]/20 text-white" : "border-white/15 text-white/55 hover:border-[#8a2be2]/60"}`}>
              {label}
            </button>
          ))}
        </div>

        {author.platformLinks.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {author.platformLinks.map((link) => (
              <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 border border-white/10 bg-black/20 px-3 py-2 font-mono text-[10px] text-white/60 hover:border-[#00f0ff]/50 hover:text-white">
                {link.label} <ExternalLink className="h-3 w-3" />
              </a>
            ))}
          </div>
        )}

        <section className="mt-10">
          <div className="flex items-end justify-between gap-4 border-b border-white/10 pb-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#ffad7f]">{PLATFORM_LABELS[activePlatform] ?? activePlatform}</p>
              <h2 className="mt-2 font-creepster text-4xl tracking-[0.1em] text-[#ffcf9e]">Авторські роботи</h2>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">{searchedCreations.length} карток</span>
          </div>
          <label className="mt-4 flex min-h-11 max-w-xl items-center border border-white/15 bg-black/20 px-3 focus-within:border-[#00f0ff]/60">
            <span className="mr-3 font-mono text-[9px] uppercase tracking-[0.14em] text-white/35">Пошук</span>
            <input value={creationSearch} onChange={(event) => setCreationSearch(event.target.value)} className="min-w-0 flex-1 bg-transparent font-mono text-xs text-white outline-none placeholder:text-white/25" placeholder="назва або опис роботи" aria-label="Пошук авторських робіт" />
          </label>
          {searchedCreations.length === 0 ? (
            <div className="mt-6 border border-dashed border-white/15 bg-black/20 p-8 text-center font-mono text-sm leading-relaxed text-white/45">
              Тут ще немає опублікованих робіт у цьому розділі.
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pagedCreations.map((creation) => {
                const videoId = creation.contentUrl ? youtubeId(creation.contentUrl) : null;
                const preview = creation.imageUrl ?? (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null);
                return (
                  <a key={creation.id} href={creation.contentUrl ?? "#"} target={creation.contentUrl ? "_blank" : undefined} rel="noopener noreferrer" className="group overflow-hidden border border-[#00f0ff]/20 bg-[#07131b]/80 transition-transform hover:-translate-y-1 hover:border-[#00f0ff]/70">
                    <div className="relative aspect-[16/9] overflow-hidden bg-[linear-gradient(135deg,rgba(0,240,255,0.14),rgba(138,43,226,0.22))]">
                      {preview && <img src={preview} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-105" />}
                      {videoId && <span className="absolute inset-0 flex items-center justify-center"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ff3d35]/90 text-white shadow-[0_0_22px_rgba(255,61,53,0.65)]"><Play className="ml-1 h-5 w-5 fill-current" /></span></span>}
                      <span className="absolute left-3 top-3 bg-black/70 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-[#b9f7ff]">{PLATFORM_LABELS[creation.platform] ?? creation.platform}</span>
                    </div>
                    <div className="p-4">
                      <h3 className="font-creepster text-2xl tracking-[0.08em] text-white">{creation.title}</h3>
                      {creation.description && <p className="mt-2 line-clamp-3 font-mono text-xs leading-relaxed text-white/55">{creation.description}</p>}
                      {creation.contentUrl && <span className="mt-4 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[#8ceeff]">Відкрити роботу <ArrowUpRight className="h-3.5 w-3.5" /></span>}
                    </div>
                  </a>
                );
              })}
            </div>
          )}
          {pagedCreations.length < searchedCreations.length && (
            <button type="button" onClick={() => setVisibleCount((count) => count + 24)} className="mt-6 min-h-11 border border-[#00f0ff]/55 bg-[#00f0ff]/10 px-5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#b9f7ff] hover:bg-[#00f0ff]/20">
              Показати ще {Math.min(24, searchedCreations.length - pagedCreations.length)} робіт
            </button>
          )}
        </section>
      </div>
    </main>
  );
}