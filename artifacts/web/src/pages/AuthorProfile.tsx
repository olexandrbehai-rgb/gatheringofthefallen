import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, ExternalLink, Pencil, Play, Plus, X } from "lucide-react";
import { useUser } from "@clerk/react";
import { Link, useLocation } from "wouter";
import { Mp3Player } from "@/components/Mp3Player";
import { useT } from "@/i18n/LanguageContext";
import { AUTHORS_WORLD_COPY, formatAuthorsWorldCopy } from "@/i18n/authorsWorld";
import { PLATFORM_OPTIONS, type PlatformKey } from "@/lib/authorPlatforms";

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
  poem: string;
  links: string;
  imageUrl?: string | null;
  contentUrl?: string | null;
  audioUrl?: string | null;
  audioObjectPath?: string | null;
  audioSizeBytes?: number | null;
  audioDurationSeconds?: number | null;
  createdAt?: string;
};

type InlineCreationDraft = {
  platform: PlatformKey;
  kind: "card" | "banner" | "creation";
  title: string;
  description: string;
  imageUrl: string;
  contentUrl: string;
};

const EMPTY_INLINE_CREATION: InlineCreationDraft = {
  platform: "youtube",
  kind: "banner",
  title: "",
  description: "",
  imageUrl: "",
  contentUrl: "",
};

const PLATFORM_LABELS: Record<string, string> = {
  website: "Сайт",
  spotify: "Spotify",
  suno: "Suno",
  "youtube-music": "YouTube Music",
  youtube: "YouTube",
  instagram: "Instagram",
  tiktok: "TikTok",
  bandcamp: "Bandcamp",
  soundcloud: "SoundCloud",
  audio: "MP3 / авторська музика",
  other: "Інше",
};

function platformForLink(link: PlatformLink) {
  const haystack = `${link.label} ${link.url}`.toLowerCase();
  if (haystack.includes("suno.com") || haystack.includes("suno")) return "suno";
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
  const { lang, t } = useT();
  const { isLoaded: authLoaded, isSignedIn } = useUser();
  const copy = AUTHORS_WORLD_COPY[lang];
  const [author, setAuthor] = useState<Author | null>(null);
  const [creations, setCreations] = useState<Creation[]>([]);
  const [canEdit, setCanEdit] = useState(false);
  const [activePlatform, setActivePlatform] = useState("all");
  const [creationSearch, setCreationSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(24);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [inlineDraft, setInlineDraft] = useState<InlineCreationDraft>(EMPTY_INLINE_CREATION);
  const [inlineAudioFile, setInlineAudioFile] = useState<File | null>(null);
  const [inlineSaving, setInlineSaving] = useState(false);
  const [inlineUploading, setInlineUploading] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [inlineSavedNotice, setInlineSavedNotice] = useState<string | null>(null);
  const [messageDraft, setMessageDraft] = useState("");
  const [messageMode, setMessageMode] = useState<"public" | "private">("public");
  const [isMessageComposerOpen, setIsMessageComposerOpen] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [messageSent, setMessageSent] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

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

  const memories = useMemo(() => creations.filter((creation) => creation.kind === "memory"), [creations]);

  const tabs = useMemo(() => {
    const values = new Map<string, { label: string; url?: string }>();
    author?.platformLinks.forEach((link) => {
      const platform = platformForLink(link);
      values.set(platform, { label: PLATFORM_LABELS[platform] ?? link.label, url: link.url });
    });
    creations.filter((creation) => creation.kind !== "memory").forEach((creation) => {
      if (!values.has(creation.platform)) {
        values.set(creation.platform, { label: PLATFORM_LABELS[creation.platform] ?? creation.platform });
      }
    });
    return [...values.entries()].map(([platform, value]) => [platform, value.label, value.url] as const);
  }, [author, creations]);

  const visibleCreations = activePlatform === "all"
    ? creations.filter((creation) => creation.kind !== "memory")
    : creations.filter((creation) => creation.kind !== "memory" && creation.platform === activePlatform);
  const searchedCreations = visibleCreations.filter((creation) =>
    `${creation.title} ${creation.description}`.toLowerCase().includes(creationSearch.trim().toLowerCase()),
  );
  const pagedCreations = searchedCreations.slice(0, visibleCount);

  useEffect(() => {
    setVisibleCount(24);
  }, [activePlatform, creationSearch]);

  const openInlineComposer = () => {
    setInlineError(null);
    setInlineSavedNotice(null);
    setInlineDraft(EMPTY_INLINE_CREATION);
    setInlineAudioFile(null);
    setIsComposerOpen(true);
  };

  const closeInlineComposer = () => {
    if (inlineSaving || inlineUploading) return;
    setIsComposerOpen(false);
    setInlineError(null);
    setInlineAudioFile(null);
  };

  const handleInlineCreationSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = inlineDraft.title.trim();
    const contentUrl = inlineDraft.contentUrl.trim();
    if (!title || inlineSaving || inlineUploading) return;
    if (!contentUrl && !inlineAudioFile) {
      setInlineError(copy.errors.needWork);
      return;
    }

    setInlineError(null);
    setInlineSavedNotice(null);
    setInlineSaving(true);
    try {
      let audioObjectPath: string | null = null;
      if (inlineAudioFile) {
        if (inlineAudioFile.type !== "audio/mpeg" && !inlineAudioFile.name.toLowerCase().endsWith(".mp3")) {
          throw new Error(copy.errors.mp3Type);
        }
        if (inlineAudioFile.size > 20 * 1024 * 1024) {
          throw new Error(copy.errors.mp3Size);
        }
        setInlineUploading(true);
        const uploadUrlResponse = await fetch(`${API_ROOT}/authors-world/me/audio/upload-url`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: inlineAudioFile.name,
            size: inlineAudioFile.size,
            contentType: "audio/mpeg",
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
          body: inlineAudioFile,
        });
        if (!uploadResponse.ok) throw new Error(copy.errors.uploadMp3);
        audioObjectPath = uploadPayload.objectPath;
      }

      const response = await fetch(`${API_ROOT}/authors-world/me/creations`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...inlineDraft,
          title,
          description: inlineDraft.description.trim(),
          imageUrl: inlineDraft.imageUrl.trim(),
          contentUrl,
          audioObjectPath,
          audioDurationSeconds: null,
        }),
      });
      const payload = await response.json().catch(() => ({})) as {
        creation?: Creation;
        error?: string;
      };
      if (!response.ok || !payload.creation) {
        throw new Error(payload.error ?? copy.errors.saveWork);
      }

      setCreations((current) => [...current, payload.creation as Creation]);
      setActivePlatform(payload.creation.platform);
      setCreationSearch("");
      setVisibleCount(24);
      setInlineDraft(EMPTY_INLINE_CREATION);
      setInlineAudioFile(null);
      setIsComposerOpen(false);
      setInlineSavedNotice(copy.notices.workSaved);
    } catch (saveError) {
      setInlineError(saveError instanceof Error ? saveError.message : copy.errors.saveWork);
    } finally {
      setInlineUploading(false);
      setInlineSaving(false);
    }
  };

  const handleSendAuthorMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = messageDraft.trim();
    if (!author || !text || isSendingMessage) return;

    setMessageError(null);
    setMessageSent(false);
    setIsSendingMessage(true);
    try {
      const isPrivate = messageMode === "private";
      const response = await fetch(
        isPrivate ? `${API_ROOT}/authors-world/direct/${encodeURIComponent(author.slug)}` : `${API_ROOT}/authors-world/chat`,
        {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: isPrivate ? text : `@${author.slug} ${text}` }),
        },
      );
      const payload = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) {
        if (response.status === 401) throw new Error(copy.directMessage.signIn);
        if (response.status === 403) throw new Error(copy.directMessage.portalRequired);
        throw new Error(payload.error ?? (isPrivate ? copy.directMessage.privateFailed : copy.directMessage.failed));
      }
      setMessageDraft("");
      setMessageSent(true);
    } catch (sendError) {
      setMessageError(sendError instanceof Error
        ? sendError.message
        : messageMode === "private" ? copy.directMessage.privateFailed : copy.directMessage.failed);
    } finally {
      setIsSendingMessage(false);
    }
  };

  if (loading) {
    return <main className="min-h-[calc(100dvh-82px)] bg-[#03060b] px-6 py-20 text-center font-mono text-sm text-[#8ceeff]">{t("ui.loadingPortal")}</main>;
  }
  if (error || !author) {
    return (
      <main className="min-h-[calc(100dvh-82px)] bg-[#03060b] px-6 py-20 text-center text-white">
        <p className="font-mono text-sm text-[#ffb184]">{error ?? "Портал не знайдено."}</p>
        <Link href="/authors-world" className="mt-6 inline-flex border border-[#00f0ff]/60 px-4 py-3 font-mono text-xs text-[#b9f7ff]">{t("ui.backToAuthorsWorld")}</Link>
      </main>
    );
  }

  return (
    <main className="author-portal-readable relative min-h-[calc(100dvh-82px)] overflow-x-clip bg-[#03060b] px-3 py-7 text-white sm:px-6 sm:py-10 lg:px-10">
      {author.backgroundUrl && (
        <img
          src={author.backgroundUrl}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
        />
      )}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(2,4,10,0.58)_0%,rgba(2,4,10,0.48)_34%,rgba(2,4,10,0.86)_100%),radial-gradient(circle_at_50%_0%,rgba(0,240,255,0.18),transparent_38%),radial-gradient(circle_at_82%_58%,rgba(255,45,149,0.22),transparent_42%),radial-gradient(circle_at_12%_72%,rgba(142,255,92,0.14),transparent_34%)]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(0,240,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.06)_1px,transparent_1px)] [background-size:42px_42px]" />
      <div aria-hidden="true" className="author-neon-orb author-neon-orb-magenta pointer-events-none absolute -right-20 top-28 h-64 w-64 rounded-full" />
      <div aria-hidden="true" className="author-neon-orb author-neon-orb-lime pointer-events-none absolute -left-24 top-[52%] h-56 w-56 rounded-full" />
      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/authors-world" className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/50 hover:text-[#00f0ff]">← Сад авторів</Link>
          {canEdit && (
            <button type="button" onClick={() => setLocation("/authors-world?edit=1")} className="inline-flex items-center gap-2 border border-[#00f0ff]/60 bg-[#00f0ff]/10 px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#b9f7ff] hover:bg-[#00f0ff]/20">
              <Pencil className="h-3.5 w-3.5" /> Редагувати мій портал
            </button>
          )}
        </div>
        <header className="author-portal-hero mt-7 grid min-w-0 gap-5 rounded border border-[#00f0ff]/30 bg-[#020811]/78 p-4 backdrop-blur-md sm:mt-10 sm:gap-6 sm:p-5 md:grid-cols-[auto_minmax(0,1fr)] md:items-center">
          <div className="author-avatar-glow mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-[#00f0ff]/70 bg-[#07131b] font-mono text-2xl font-bold text-[#b9f7ff] sm:h-28 sm:w-28 md:mx-0">
            {author.avatarUrl ? <img src={author.avatarUrl} alt="" className="h-full w-full object-contain" /> : initialsFor(author.displayName)}
          </div>
          <div className="min-w-0 text-center md:text-left">
            <p className="break-all font-mono text-[9px] uppercase tracking-[0.16em] text-[#ffad7f] sm:text-[10px] sm:tracking-[0.28em]">Авторський портал // {author.slug}</p>
            <h1 className="author-portal-title mt-3 max-w-full break-words font-creepster text-[clamp(2.35rem,13vw,4.5rem)] leading-[0.94] tracking-[0.035em] sm:tracking-[0.06em]">{author.displayName}</h1>
            <p className="mt-3 break-words font-mono text-[11px] uppercase tracking-[0.13em] text-[#ffcf9e] sm:text-xs sm:tracking-[0.18em]">{author.role}</p>
            <p className="mt-5 max-w-3xl font-mono text-sm leading-relaxed text-white/65">“{author.bio}”</p>
          </div>
        </header>

          <div className="author-neon-panel mt-6 flex max-w-full flex-wrap gap-2 rounded border border-white/15 bg-[#020811]/78 p-3 backdrop-blur-md sm:mt-8">
          <button type="button" onClick={() => setActivePlatform("all")} className={`min-w-0 border px-3 py-3 font-mono text-[10px] uppercase tracking-[0.11em] sm:px-4 sm:tracking-[0.14em] ${activePlatform === "all" ? "border-[#00f0ff] bg-[#00f0ff]/15 text-white" : "border-white/15 text-white/55 hover:border-[#00f0ff]/50"}`}>{t("ui.allWorks")}</button>
           {tabs.map(([platform, label, url]) => (
             url ? (
               <a
                 key={platform}
                 href={url}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="inline-flex min-w-0 max-w-full items-center gap-1.5 break-words border border-[#ff2d95]/70 bg-[#ff2d95]/10 px-3 py-3 font-mono text-[10px] uppercase tracking-[0.11em] text-white hover:border-[#00f0ff] hover:bg-[#00f0ff]/10 sm:px-4 sm:tracking-[0.14em]"
               >
                 <span className="break-words">{label}</span>
                 <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
               </a>
             ) : (
               <button key={platform} type="button" onClick={() => setActivePlatform(platform)} className={`min-w-0 max-w-full break-words border px-3 py-3 font-mono text-[10px] uppercase tracking-[0.11em] sm:px-4 sm:tracking-[0.14em] ${activePlatform === platform ? "border-[#ff2d95] bg-[#ff2d95]/15 text-white" : "border-white/15 text-white/55 hover:border-[#ff2d95]/60"}`}>
                 {label}
               </button>
             )
          ))}
        </div>

        {author.platformLinks.length > 0 && (
           <div className="mt-4 flex max-w-full flex-wrap gap-2">
            {author.platformLinks.map((link) => (
               <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" className="relative z-0 inline-flex max-w-full shrink-0 items-center gap-2 whitespace-nowrap border border-white/10 bg-black/20 px-3 py-2 font-mono text-[10px] text-white/60 hover:z-10 hover:border-[#00f0ff]/50 hover:text-white">
                 <span className="min-w-0 truncate">{link.label}</span>
                 <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            ))}
          </div>
        )}

          <section className="author-neon-panel mt-6 rounded border border-[#00f0ff]/30 bg-[#020811]/78 p-4 backdrop-blur-md sm:p-5">
            <button
              type="button"
              onClick={() => setIsMessageComposerOpen((open) => !open)}
              className="inline-flex min-h-12 items-center border border-[#00f0ff]/70 bg-[#00f0ff]/10 px-5 font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#b9f7ff] transition-all hover:bg-[#00f0ff]/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00f0ff]"
              aria-expanded={isMessageComposerOpen}
            >
              {copy.directMessage.title}
            </button>
            {isMessageComposerOpen && (
              <>
                <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.22em] text-[#00f0ff]">
                  {formatAuthorsWorldCopy(copy.directMessage.eyebrow, { name: author.displayName })}
                </p>
                <p className="mt-2 max-w-2xl font-mono text-xs leading-relaxed text-white/55">
                   {formatAuthorsWorldCopy(
                     messageMode === "private" ? copy.directMessage.privateDescription : copy.directMessage.publicDescription,
                     { name: author.displayName },
                   )}
                </p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                  <fieldset className="grid shrink-0 gap-2 sm:w-56">
                    <legend className="sr-only">{copy.directMessage.title}</legend>
                    <label className={`flex min-h-11 cursor-pointer items-center gap-2 border px-3 py-2 font-mono text-[10px] leading-tight transition-colors ${messageMode === "public" ? "border-[#00f0ff]/70 bg-[#00f0ff]/10 text-[#b9f7ff]" : "border-white/15 text-white/55 hover:border-white/35"}`}>
                      <input
                        type="radio"
                        name="author-message-mode"
                        value="public"
                        checked={messageMode === "public"}
                        onChange={() => {
                          setMessageMode("public");
                          setMessageSent(false);
                          setMessageError(null);
                        }}
                        className="accent-[#00f0ff]"
                      />
                      {copy.directMessage.modePublic}
                    </label>
                    <label className={`flex min-h-11 cursor-pointer items-center gap-2 border px-3 py-2 font-mono text-[10px] leading-tight transition-colors ${messageMode === "private" ? "border-[#ffad7f]/70 bg-[#ffad7f]/10 text-[#ffd0ba]" : "border-white/15 text-white/55 hover:border-white/35"}`}>
                      <input
                        type="radio"
                        name="author-message-mode"
                        value="private"
                        checked={messageMode === "private"}
                        onChange={() => {
                          setMessageMode("private");
                          setMessageSent(false);
                          setMessageError(null);
                        }}
                        className="accent-[#ffad7f]"
                      />
                      {copy.directMessage.modePrivate}
                    </label>
                  </fieldset>
                  {authLoaded && isSignedIn ? (
                    <form onSubmit={handleSendAuthorMessage} className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-end">
                      <label className="min-w-0 flex-1">
                        <span className="sr-only">
                          {formatAuthorsWorldCopy(copy.directMessage.placeholder, { name: author.displayName })}
                        </span>
                        <textarea
                          value={messageDraft}
                          onChange={(event) => {
                            setMessageDraft(event.target.value);
                            setMessageError(null);
                            setMessageSent(false);
                          }}
                          maxLength={1000}
                          rows={3}
                          placeholder={formatAuthorsWorldCopy(copy.directMessage.placeholder, { name: author.displayName })}
                          className="min-h-24 w-full resize-y border border-white/15 bg-black/35 px-3 py-3 font-mono text-sm text-white outline-none placeholder:text-white/25 focus:border-[#00f0ff]/60"
                        />
                      </label>
                      <button
                        type="submit"
                        disabled={isSendingMessage || !messageDraft.trim()}
                        className="min-h-12 border border-[#00f0ff]/60 bg-[#00f0ff]/10 px-5 font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#b9f7ff] transition-all hover:bg-[#00f0ff]/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {isSendingMessage
                          ? copy.directMessage.sending
                          : messageMode === "private" ? copy.directMessage.sendPrivate : copy.directMessage.sendPublic}
                      </button>
                    </form>
                  ) : (
                    <p className="min-w-0 flex-1 border border-white/10 bg-black/20 px-3 py-3 font-mono text-xs leading-relaxed text-white/55">
                      {copy.directMessage.signIn}{" "}
                      <Link href="/sign-in" className="text-[#8ceeff] underline decoration-[#00f0ff]/50 underline-offset-4 hover:text-white">
                        {copy.directMessage.signInAction}
                      </Link>
                    </p>
                  )}
                </div>
                {messageSent && (
                  <p role="status" className="mt-3 border border-[#8effa0]/35 bg-[#8effa0]/10 px-3 py-2 font-mono text-xs text-[#c7ffd0]">
                     {messageMode === "private" ? copy.directMessage.privateSuccess : copy.directMessage.success}
                  </p>
                )}
                {messageError && (
                  <p role="alert" className="mt-3 border border-[#ff7043]/35 bg-[#ff7043]/5 px-3 py-2 font-mono text-xs text-[#ffb184]">
                    {messageError}
                    {messageError === copy.directMessage.portalRequired && (
                      <>
                        {" "}
                        <Link href="/authors-world?edit=1" className="text-[#b9f7ff] underline underline-offset-4">
                          {copy.directMessage.portalAction}
                        </Link>
                      </>
                    )}
                  </p>
                )}
              </>
            )}
          </section>

         {memories.length > 0 && (
           <section className="author-memory-panel mt-8 min-w-0 rounded border border-[#ffcf9e]/40 bg-[#160e16]/82 p-4 backdrop-blur-md sm:mt-10 sm:p-5">
             <div className="flex items-end justify-between gap-3 border-b border-[#ffcf9e]/15 pb-3">
               <div>
                 <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#ffcf9e]">Кристалічна сітка // {memories.length}</p>
                 <h2 className="mt-2 font-creepster text-3xl tracking-[0.08em] text-[#ffcf9e] sm:text-4xl">{t("ui.authorMemories")}</h2>
               </div>
               <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/35">{t("ui.memoryTree")}</span>
             </div>
             <div className="relative mt-5 flex flex-wrap items-center justify-center gap-5 py-3 sm:gap-8">
               <div className="author-memory-root relative z-10 flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#00f0ff]/70 bg-[#07131b] font-mono text-xs font-bold tracking-[0.14em] text-[#b9f7ff] shadow-[0_0_28px_rgba(0,240,255,0.25)]">
                 {author.avatarUrl ? <img src={author.avatarUrl} alt="" className="h-full w-full object-contain" /> : initialsFor(author.displayName)}
               </div>
               {memories.map((memory) => (
                 <button
                   key={memory.id}
                   type="button"
                    onClick={() => setLocation(`/author/${author.slug}/memory/${memory.id}`)}
                   className="author-memory-card group relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#ffcf9e]/65 bg-[#140d18] text-center shadow-[0_0_18px_rgba(255,207,158,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffcf9e]"
                   title={memory.title}
                 >
                   {memory.imageUrl ? <img src={memory.imageUrl} alt="" className="h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100" /> : <span className="px-2 font-creepster text-sm leading-tight text-[#ffcf9e]">{memory.title}</span>}
                   <span className="pointer-events-none absolute inset-1 rounded-full border border-dashed border-[#ffcf9e]/40" />
                 </button>
               ))}
             </div>
           </section>
         )}

         <section className="author-neon-panel mt-8 min-w-0 rounded border border-white/15 bg-[#020811]/78 p-4 backdrop-blur-md sm:mt-10 sm:p-5">
          <div className="flex min-w-0 flex-col gap-3 border-b border-white/10 pb-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#ffad7f]">{PLATFORM_LABELS[activePlatform] ?? activePlatform}</p>
              <h2 className="author-section-title mt-2 break-words font-creepster text-3xl tracking-[0.07em] sm:text-4xl sm:tracking-[0.1em]">{t("ui.authorWorks")}</h2>
       </div>
            <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">{searchedCreations.length} карток</span>
          </div>
          <label className="mt-4 flex min-h-11 max-w-xl items-center border border-white/15 bg-black/20 px-3 focus-within:border-[#00f0ff]/60">
            <span className="mr-3 font-mono text-[9px] uppercase tracking-[0.14em] text-white/35">{t("ui.search")}</span>
            <input value={creationSearch} onChange={(event) => setCreationSearch(event.target.value)} className="min-w-0 flex-1 bg-transparent font-mono text-xs text-white outline-none placeholder:text-white/25" placeholder={t("ui.workSearchPlaceholder")} aria-label={t("ui.searchWork")} />
          </label>
           {inlineSavedNotice && <p role="status" className="mt-4 border border-[#8effa0]/35 bg-[#8effa0]/10 px-3 py-2 font-mono text-xs text-[#c7ffd0]">{inlineSavedNotice}</p>}
           <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
             {canEdit && (
               <button type="button" onClick={openInlineComposer} className="group flex min-h-[230px] flex-col items-center justify-center gap-3 border border-dashed border-[#00f0ff]/60 bg-[#00f0ff]/[0.04] px-5 text-center transition-colors hover:border-[#ff2d95] hover:bg-[#ff2d95]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00f0ff]">
                 <span className="flex h-14 w-14 items-center justify-center rounded-full border border-[#00f0ff]/70 bg-[#00f0ff]/10 text-[#b9f7ff] shadow-[0_0_24px_rgba(0,240,255,0.18)] transition-transform group-hover:scale-110"><Plus className="h-7 w-7" /></span>
                 <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#b9f7ff]">{copy.creations.addWork}</span>
                 <span className="font-mono text-[10px] leading-relaxed text-white/40">{copy.creations.help}</span>
               </button>
             )}
             {searchedCreations.length === 0 ? (
               <div className="border border-dashed border-white/15 bg-black/20 p-8 text-center font-mono text-sm leading-relaxed text-white/45 sm:col-span-2 lg:col-span-3">
                 Тут ще немає опублікованих робіт у цьому розділі.
               </div>
             ) : pagedCreations.map((creation) => {
                const videoId = creation.contentUrl ? youtubeId(creation.contentUrl) : null;
                const preview = creation.imageUrl ?? (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null);
                const cardContent = (
                  <>
                    <div className="relative aspect-[16/9] overflow-hidden bg-[linear-gradient(135deg,rgba(0,240,255,0.14),rgba(138,43,226,0.22))]">
                      {preview && <img src={preview} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-105" />}
                      {videoId && <span className="absolute inset-0 flex items-center justify-center"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ff3d35]/90 text-white shadow-[0_0_22px_rgba(255,61,53,0.65)]"><Play className="ml-1 h-5 w-5 fill-current" /></span></span>}
                      <span className="absolute left-3 top-3 bg-black/70 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-[#b9f7ff]">{PLATFORM_LABELS[creation.platform] ?? creation.platform}</span>
                    </div>
                    <div className="p-4">
                      <h3 className="font-creepster text-2xl tracking-[0.08em] text-white">{creation.title}</h3>
                      {creation.description && <p className="mt-2 line-clamp-3 font-mono text-xs leading-relaxed text-white/55">{creation.description}</p>}
                      {creation.contentUrl && <span className="mt-4 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[#8ceeff]">{t("ui.openWork")} <ArrowUpRight className="h-3.5 w-3.5" /></span>}
                    </div>
                  </>
                );
                if (creation.audioUrl) {
                  return (
                    <article key={creation.id} className="overflow-hidden border border-[#00f0ff]/35 bg-[#07131b]/90 shadow-[0_0_18px_rgba(0,240,255,0.08)]">
                      <div className="p-3">
                        <Mp3Player src={creation.audioUrl} title={creation.title} durationSeconds={creation.audioDurationSeconds} />
                      </div>
                      <div className="px-4 pb-4">
                        {creation.description && <p className="font-mono text-xs leading-relaxed text-white/65">{creation.description}</p>}
                        {creation.contentUrl && <a href={creation.contentUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[#8ceeff]">{t("ui.openExtraLink")} <ArrowUpRight className="h-3.5 w-3.5" /></a>}
                      </div>
                    </article>
                  );
                }
                return (
                  <a key={creation.id} href={creation.contentUrl ?? "#"} target={creation.contentUrl ? "_blank" : undefined} rel="noopener noreferrer" className="group overflow-hidden border border-[#00f0ff]/20 bg-[#07131b]/80 transition-transform hover:-translate-y-1 hover:border-[#00f0ff]/70">
                    {cardContent}
                  </a>
                );
               })}
           </div>
           {isComposerOpen && (
             <form onSubmit={handleInlineCreationSubmit} className="mt-6 border border-[#00f0ff]/45 bg-[#020811]/90 p-4 shadow-[0_0_26px_rgba(0,240,255,0.08)] sm:p-5">
               <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-3">
                 <div>
                   <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#ffad7f]">{copy.creations.eyebrow}</p>
                   <h3 className="mt-2 font-creepster text-3xl tracking-[0.08em] text-white">{copy.creations.addWork}</h3>
                 </div>
                 <button type="button" onClick={closeInlineComposer} className="inline-flex h-10 w-10 items-center justify-center border border-white/15 text-white/55 hover:border-[#ff2d95] hover:text-white" aria-label={copy.creations.cancel}><X className="h-4 w-4" /></button>
               </div>
               <div className="mt-4 grid gap-3 md:grid-cols-2">
                 <label className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/45">
                   {copy.creations.platform}
                   <select value={inlineDraft.platform} onChange={(event) => setInlineDraft((current) => ({ ...current, platform: event.target.value as PlatformKey }))} className="mt-2 min-h-11 w-full border border-white/15 bg-[#06111a] px-3 font-mono text-xs normal-case tracking-normal text-white outline-none focus:border-[#00f0ff]/70">
                     {PLATFORM_OPTIONS.map((option) => <option key={option.value} value={option.value} className="bg-[#06111a]">{copy.platformLabels[option.value] ?? option.label}</option>)}
                   </select>
                 </label>
                 <label className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/45">
                   {copy.creations.format}
                   <select value={inlineDraft.kind} onChange={(event) => setInlineDraft((current) => ({ ...current, kind: event.target.value as InlineCreationDraft["kind"] }))} className="mt-2 min-h-11 w-full border border-white/15 bg-[#06111a] px-3 font-mono text-xs normal-case tracking-normal text-white outline-none focus:border-[#00f0ff]/70">
                     <option value="banner" className="bg-[#06111a]">{copy.creations.banner}</option>
                     <option value="card" className="bg-[#06111a]">{copy.creations.card}</option>
                     <option value="creation" className="bg-[#06111a]">{copy.creations.creation}</option>
                   </select>
                 </label>
                 <label className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/45 md:col-span-2">
                   {copy.creations.titleLabel}
                   <input required value={inlineDraft.title} onChange={(event) => setInlineDraft((current) => ({ ...current, title: event.target.value }))} className="mt-2 min-h-11 w-full border border-white/15 bg-[#06111a] px-3 font-mono text-xs normal-case tracking-normal text-white outline-none focus:border-[#00f0ff]/70" placeholder={copy.creations.titlePlaceholder} />
                 </label>
                 <label className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/45 md:col-span-2">
                   {copy.creations.description}
                   <textarea value={inlineDraft.description} onChange={(event) => setInlineDraft((current) => ({ ...current, description: event.target.value }))} className="mt-2 min-h-20 w-full resize-y border border-white/15 bg-[#06111a] px-3 py-2 font-mono text-xs normal-case tracking-normal text-white outline-none focus:border-[#00f0ff]/70" placeholder={copy.creations.descriptionPlaceholder} />
                 </label>
                 {inlineDraft.platform === "audio" && (
                   <label className="border border-[#8a2be2]/40 bg-[#8a2be2]/10 p-3 font-mono text-[9px] uppercase tracking-[0.14em] text-[#d7b6ff] md:col-span-2">
                     {copy.creations.uploadMp3}
                     <input type="file" accept=".mp3,audio/mpeg" onChange={(event) => setInlineAudioFile(event.target.files?.[0] ?? null)} className="mt-2 block w-full text-xs normal-case tracking-normal text-white file:mr-3 file:border-0 file:bg-[#8a2be2]/30 file:px-3 file:py-2 file:font-mono file:text-[10px] file:uppercase file:text-[#d7b6ff]" />
                     <span className="mt-2 block normal-case tracking-normal text-white/45">{copy.creations.mp3Help}</span>
                   </label>
                 )}
                 <label className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/45 md:col-span-2">
                   {copy.creations.contentLink}
                   <input type="url" value={inlineDraft.contentUrl} onChange={(event) => setInlineDraft((current) => ({ ...current, contentUrl: event.target.value }))} className="mt-2 min-h-11 w-full border border-white/15 bg-[#06111a] px-3 font-mono text-xs normal-case tracking-normal text-white outline-none focus:border-[#00f0ff]/70" placeholder={copy.creations.contentPlaceholder} />
                 </label>
                 <label className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/45 md:col-span-2">
                   {copy.creations.cover}
                   <input type="url" value={inlineDraft.imageUrl} onChange={(event) => setInlineDraft((current) => ({ ...current, imageUrl: event.target.value }))} className="mt-2 min-h-11 w-full border border-white/15 bg-[#06111a] px-3 font-mono text-xs normal-case tracking-normal text-white outline-none focus:border-[#00f0ff]/70" placeholder="https://.../cover.jpg" />
                 </label>
               </div>
               {inlineError && <p role="alert" className="mt-4 border border-[#ff6b7a]/40 bg-[#ff6b7a]/10 px-3 py-2 font-mono text-xs text-[#ffb8c0]">{inlineError}</p>}
               <div className="mt-4 flex flex-wrap gap-2">
                 <button type="submit" disabled={inlineSaving || inlineUploading} className="min-h-11 border border-[#8a2be2]/70 bg-[#8a2be2]/15 px-4 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#d7b6ff] hover:border-[#00f0ff] hover:text-white disabled:opacity-50">{inlineUploading ? copy.creations.uploading : inlineSaving ? copy.creations.saving : copy.creations.addWork}</button>
                 <button type="button" onClick={closeInlineComposer} disabled={inlineSaving || inlineUploading} className="min-h-11 border border-white/15 px-4 font-mono text-[10px] uppercase text-white/55 hover:text-white disabled:opacity-50">{copy.creations.cancel}</button>
               </div>
             </form>
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