import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "wouter";

type AuthorLink = {
  label: string;
  url: string;
};

type Author = {
  id: string;
  name: string;
  role: string;
  initials: string;
  memory: string;
  links: AuthorLink[];
  avatarUrl?: string | null;
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
  links: string;
};

const API_ROOT = `${import.meta.env.BASE_URL}api`;

const WORLD_POSITIONS = [
  { left: 11, top: 10 },
  { left: 38, top: 18 },
  { left: 68, top: 12 },
  { left: 84, top: 30 },
  { left: 19, top: 36 },
  { left: 51, top: 39 },
  { left: 73, top: 51 },
  { left: 8, top: 62 },
  { left: 35, top: 69 },
  { left: 59, top: 76 },
  { left: 86, top: 72 },
  { left: 24, top: 88 },
];

const SEED_AUTHORS: Author[] = [
  {
    id: "seed-ashen-voice",
    name: "Ashen Voice",
    role: "Музикант",
    initials: "AV",
    memory: "Залишаю тут пісню для тих, хто ще йде крізь попіл.",
    links: [
      { label: "Spotify", url: "https://open.spotify.com" },
      { label: "YouTube", url: "https://youtube.com" },
    ],
    position: WORLD_POSITIONS[0],
  },
  {
    id: "seed-mira-nocturne",
    name: "Mira Nocturne",
    role: "Авторка",
    initials: "MN",
    memory: "Мої історії починаються там, де закінчується світло.",
    links: [{ label: "Instagram", url: "https://instagram.com" }],
    position: WORLD_POSITIONS[1],
  },
  {
    id: "seed-rune-operator",
    name: "Rune Operator",
    role: "Продюсер",
    initials: "RO",
    memory: "Звук — це портал. Я залишив тут координати.",
    links: [
      { label: "Bandcamp", url: "https://bandcamp.com" },
      { label: "SoundCloud", url: "https://soundcloud.com" },
    ],
    position: WORLD_POSITIONS[2],
  },
  {
    id: "seed-velvet-ruins",
    name: "Velvet Ruins",
    role: "Візуальна авторка",
    initials: "VR",
    memory: "Кожна тінь має колір, якщо дивитися достатньо довго.",
    links: [{ label: "Portfolio", url: "https://behance.net" }],
    position: WORLD_POSITIONS[3],
  },
  {
    id: "seed-the-last-lantern",
    name: "The Last Lantern",
    role: "Письменник",
    initials: "LL",
    memory: "Тут пам’ятають не імена. Тут пам’ятають сліди.",
    links: [{ label: "Website", url: "https://example.com" }],
    position: WORLD_POSITIONS[4],
  },
  {
    id: "seed-echo-child",
    name: "Echo Child",
    role: "Музикантка",
    initials: "EC",
    memory: "Мій голос живе між грозою і тишею.",
    links: [{ label: "Spotify", url: "https://open.spotify.com" }],
    position: WORLD_POSITIONS[5],
  },
];

const EMPTY_DRAFT: AuthorDraft = {
  name: "",
  role: "",
  memory: "",
  links: "",
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

function platformLabel(url: string, index: number) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    return hostname.split(".")[0] || `Платформа ${index + 1}`;
  } catch {
    return `Платформа ${index + 1}`;
  }
}

function mapApiAuthor(
  value: {
    id: number;
    displayName: string;
    role: string;
    bio: string;
    avatarUrl?: string | null;
    platformLinks?: AuthorLink[];
  },
  index: number,
): Author {
  return {
    id: String(value.id),
    name: value.displayName,
    role: value.role,
    initials: initialsFor(value.displayName),
    memory: value.bio,
    links: Array.isArray(value.platformLinks) ? value.platformLinks : [],
    avatarUrl: value.avatarUrl,
    position: WORLD_POSITIONS[index % WORLD_POSITIONS.length],
  };
}

function AuthorNode({
  author,
  active,
  onSelect,
}: {
  author: Author;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{ left: `${author.position.left}%`, top: `${author.position.top}%` }}
      className={`group absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2 text-center transition-transform duration-300 hover:z-30 hover:scale-110 focus-visible:z-30 focus-visible:outline-none ${
        active ? "z-30 scale-110" : ""
      }`}
      aria-label={`Відкрити світ автора ${author.name}`}
    >
      <span className={`relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border bg-[#07131b]/95 font-mono text-xs font-bold tracking-[0.16em] text-[#b9f7ff] shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all duration-300 group-hover:border-white group-hover:text-white group-hover:shadow-[0_0_28px_rgba(0,240,255,0.8)] ${
        active ? "border-white text-white shadow-[0_0_28px_rgba(0,240,255,0.8)]" : "border-[#00f0ff]/70"
      }`}>
        <span aria-hidden="true" className="absolute inset-1 rounded-full border border-dashed border-[#00f0ff]/50" />
        {author.avatarUrl ? (
          <img src={author.avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="relative">{author.initials}</span>
        )}
        <span aria-hidden="true" className="absolute -inset-2 rounded-full border border-[#8a2be2]/20 opacity-0 transition-opacity group-hover:opacity-100" />
      </span>
      <span className="max-w-28 truncate font-mono text-[10px] uppercase tracking-[0.16em] text-white/75 transition-colors group-hover:text-white">
        {author.name}
      </span>
      <span className="pointer-events-none absolute bottom-full left-1/2 mb-4 hidden w-52 -translate-x-1/2 rounded border border-[#00f0ff]/60 bg-[#050b12]/95 p-2 text-left shadow-[0_0_25px_rgba(0,240,255,0.28)] group-hover:block group-focus:block">
        <span className="mb-2 flex h-20 items-center justify-center border border-white/10 bg-[radial-gradient(circle_at_50%_30%,rgba(0,240,255,0.28),rgba(10,5,24,0.9)_65%)] font-mono text-[9px] uppercase tracking-[0.18em] text-[#8ceeff]">
          Портрет автора
        </span>
        <span className="block font-creepster text-lg tracking-[0.12em] text-[#00f0ff]">{author.name}</span>
        <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.16em] text-[#ffad7f]">{author.role}</span>
      </span>
    </button>
  );
}

export default function AuthorsWorld() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [selectedAuthorId, setSelectedAuthorId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [draft, setDraft] = useState<AuthorDraft>(EMPTY_DRAFT);
  const [myAuthor, setMyAuthor] = useState<Author | null>(null);
  const [authorsLoading, setAuthorsLoading] = useState(true);
  const [authorsError, setAuthorsError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatDraft, setChatDraft] = useState("");
  const [chatLoading, setChatLoading] = useState(true);
  const [chatError, setChatError] = useState<string | null>(null);
  const [isSendingChat, setIsSendingChat] = useState(false);

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
            links: ownAuthor.links.map((link) => link.url).join("\n"),
          });
        }
      } catch (error) {
        if (!active) return;
        setAuthors(SEED_AUTHORS);
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

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    const name = draft.name.trim();
    const role = draft.role.trim();
    const memory = draft.memory.trim();
    if (!name || !role || !memory) return;

    const links = draft.links
      .split(/[\n,]+/)
      .map((url) => url.trim())
      .filter(Boolean)
      .map((url, linkIndex) => ({
        label: platformLabel(url, linkIndex),
        url: url.startsWith("http") ? url : `https://${url}`,
      }));

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
        links: savedAuthor.links.map((link) => link.url).join("\n"),
      });
      setIsRegistering(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Не вдалося відкрити портал.");
    } finally {
      setIsSavingProfile(false);
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
    <main className="relative min-h-[calc(100dvh-82px)] overflow-hidden bg-[#03060c] px-4 py-10 text-white sm:px-6 lg:px-10">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-80 [background-image:linear-gradient(rgba(0,240,255,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.07)_1px,transparent_1px),radial-gradient(circle_at_50%_20%,rgba(0,240,255,0.2),transparent_42%),radial-gradient(circle_at_80%_75%,rgba(138,43,226,0.2),transparent_38%)] [background-size:42px_42px,42px_42px,100%_100%,100%_100%]" />
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full border border-[#00f0ff]/20 shadow-[0_0_80px_rgba(0,240,255,0.12)]" />

      <div className="relative z-10 mx-auto max-w-7xl">
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
              {authorsLoading ? "підключення до мережі авторів..." : `${visibleAuthors.length} відкритих порталів // наведи курсор, щоб побачити автора`}
            </p>
          </div>
          <label className="flex min-h-10 items-center border border-white/15 bg-black/30 px-3 focus-within:border-[#00f0ff]/60 sm:w-72">
            <span className="mr-2 font-mono text-[10px] uppercase tracking-widest text-white/40">Пошук</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ім’я або роль"
              className="min-w-0 flex-1 bg-transparent font-mono text-xs text-white outline-none placeholder:text-white/25"
              aria-label="Пошук авторів"
            />
          </label>
        </div>

        <section className="relative h-[min(70dvh,760px)] min-h-[560px] overflow-y-auto border border-[#00f0ff]/25 bg-[#020811]/70 shadow-[inset_0_0_80px_rgba(0,240,255,0.06),0_0_35px_rgba(0,0,0,0.35)] [scrollbar-color:#00f0ff33_#020811]">
          <div className="relative min-h-[1200px] w-full min-w-[620px] overflow-hidden bg-[radial-gradient(circle_at_50%_36%,rgba(16,63,82,0.2),transparent_32%),linear-gradient(145deg,rgba(3,13,22,0.94),rgba(9,4,24,0.96))]">
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
                  onSelect={() => setSelectedAuthorId(author.id)}
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
                    <img src={selectedAuthor.avatarUrl} alt={`Портрет ${selectedAuthor.name}`} className="h-full w-full object-cover" />
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
              <div className="mt-5 flex flex-wrap gap-2">
                {selectedAuthor.links.length > 0 ? (
                  selectedAuthor.links.map((link) => (
                    <a
                      key={`${selectedAuthor.id}-${link.url}`}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border border-[#8a2be2]/60 bg-[#8a2be2]/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#d7b6ff] transition-colors hover:border-[#00f0ff] hover:bg-[#00f0ff]/10 hover:text-white"
                    >
                      {link.label}
                    </a>
                  ))
                ) : (
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">Майданчики ще не додані</span>
                )}
              </div>
            </section>
          ) : (
            <section className="flex items-center border border-white/10 bg-black/25 p-5">
              <p className="font-mono text-sm leading-relaxed text-white/45">Обери портал у світі, щоб відкрити автора.</p>
            </section>
          )}
        </div>

        <section id="authors-world-chat" className="mt-5 scroll-mt-6 border border-[#8a2be2]/45 bg-[#090711]/85 p-5 shadow-[inset_0_0_45px_rgba(138,43,226,0.08),0_0_28px_rgba(0,0,0,0.35)]">
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
              Створи або онови свій портал. Профіль збережеться у внутрішній базі сайту, автоматично з’явиться у світі авторів і дасть доступ до загального чату.
            </p>
            {formError && (
              <p className="mt-4 border border-[#ff7043]/40 bg-[#ff7043]/5 px-3 py-2 font-mono text-xs leading-relaxed text-[#ffb184]">
                {formError}{" "}
                {formError.toLowerCase().includes("sign in") || formError.toLowerCase().includes("увій") ? (
                  <Link href="/sign-in" className="text-[#8ceeff] underline underline-offset-4 hover:text-white">Увійти</Link>
                ) : null}
              </p>
            )}
            <form onSubmit={handleRegister} className="mt-6 space-y-4">
              <label className="block">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#b9f7ff]">Ім’я або псевдонім *</span>
                <input required value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} className="mt-2 min-h-11 w-full border border-white/15 bg-black/30 px-3 font-mono text-sm text-white outline-none transition-colors focus:border-[#00f0ff]/70" placeholder="Наприклад, Ashen Voice" />
              </label>
              <label className="block">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#b9f7ff]">Хто ти у цьому світі *</span>
                <input required value={draft.role} onChange={(event) => setDraft((current) => ({ ...current, role: event.target.value }))} className="mt-2 min-h-11 w-full border border-white/15 bg-black/30 px-3 font-mono text-sm text-white outline-none transition-colors focus:border-[#00f0ff]/70" placeholder="Музикант, авторка, художник..." />
              </label>
              <label className="block">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#b9f7ff]">Що ти залишаєш у пам’яті? *</span>
                <textarea required value={draft.memory} onChange={(event) => setDraft((current) => ({ ...current, memory: event.target.value }))} className="mt-2 min-h-24 w-full resize-y border border-white/15 bg-black/30 px-3 py-3 font-mono text-sm text-white outline-none transition-colors focus:border-[#00f0ff]/70" placeholder="Коротке послання або опис твоєї творчості" />
              </label>
              <label className="block">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#b9f7ff]">Твої майданчики</span>
                <textarea value={draft.links} onChange={(event) => setDraft((current) => ({ ...current, links: event.target.value }))} className="mt-2 min-h-20 w-full resize-y border border-white/15 bg-black/30 px-3 py-3 font-mono text-sm text-white outline-none transition-colors focus:border-[#00f0ff]/70" placeholder="Spotify, YouTube, Instagram — по одному посиланню в рядку" />
              </label>
              <button type="submit" disabled={isSavingProfile} className="min-h-12 w-full border border-[#00f0ff]/70 bg-[#00f0ff]/10 font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#b9f7ff] transition-all hover:bg-[#00f0ff]/20 hover:text-white hover:shadow-[0_0_24px_rgba(0,240,255,0.35)] disabled:cursor-wait disabled:opacity-50">
                {isSavingProfile ? "ПІДКЛЮЧЕННЯ ДО МЕРЕЖІ..." : myAuthor ? "ЗБЕРЕГТИ МІЙ ПОРТАЛ" : "ВІДКРИТИ МІЙ ПОРТАЛ"}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}