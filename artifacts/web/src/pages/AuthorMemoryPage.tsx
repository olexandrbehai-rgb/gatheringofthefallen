import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Link } from "wouter";

const API_ROOT = `${import.meta.env.BASE_URL}api`;

type Author = {
  displayName: string;
  role: string;
  bio: string;
  avatarUrl?: string | null;
  backgroundUrl?: string | null;
  slug: string;
};

type Memory = {
  id: number;
  kind: string;
  title: string;
  description: string;
  poem: string;
  links: string;
  imageUrl?: string | null;
};

type AuthorResponse = {
  author?: Author;
  creations?: Memory[];
  error?: string;
};

function memoryLinksFor(value: string) {
  return value
    .split(/\r?\n/)
    .map((link) => link.trim())
    .filter((link) => /^https?:\/\/\S+$/i.test(link));
}

export default function AuthorMemoryPage({
  params,
}: {
  params: { slug: string; memoryId: string };
}) {
  const [author, setAuthor] = useState<Author | null>(null);
  const [memory, setMemory] = useState<Memory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fetch(`${API_ROOT}/authors-world/author/${encodeURIComponent(params.slug)}`, { credentials: "include" })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({})) as AuthorResponse;
        if (!response.ok || !payload.author) {
          throw new Error(payload.error ?? "Портал автора не знайдено.");
        }
        const memoryId = Number(params.memoryId);
        const nextMemory = (payload.creations ?? []).find(
          (creation) => creation.kind === "memory" && creation.id === memoryId,
        );
        if (!nextMemory) throw new Error("Цей спогад не знайдено.");
        if (!active) return;
        setAuthor(payload.author);
        setMemory(nextMemory);
      })
      .catch((requestError) => {
        if (active) setError(requestError instanceof Error ? requestError.message : "Сторінка спогаду недоступна.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [params.memoryId, params.slug]);

  const links = useMemo(() => memoryLinksFor(memory?.links ?? ""), [memory?.links]);

  if (loading) {
    return (
      <main className="min-h-[calc(100dvh-82px)] bg-[#03060b] px-6 py-24 text-center font-mono text-sm uppercase tracking-[0.18em] text-[#00f0ff]">
        ВІДКРИВАЄМО СТОРІНКУ ПАМ’ЯТІ...
      </main>
    );
  }

  if (error || !author || !memory) {
    return (
      <main className="min-h-[calc(100dvh-82px)] bg-[#03060b] px-6 py-24 text-center text-white">
        <p className="font-mono text-sm text-[#ffb184]">{error ?? "Сторінка спогаду не знайдена."}</p>
        <Link href={`/author/${encodeURIComponent(params.slug)}`} className="mt-6 inline-flex items-center gap-2 border border-[#00f0ff]/60 px-4 py-3 font-mono text-xs uppercase tracking-[0.14em] text-[#b9f7ff]">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Повернутися до світу автора
        </Link>
      </main>
    );
  }

  return (
    <main className="authors-world-readable relative min-h-[calc(100dvh-82px)] overflow-hidden bg-[#03060b] px-3 py-8 text-white sm:px-6 sm:py-12 lg:px-10">
      {author.backgroundUrl && (
        <img
          src={author.backgroundUrl}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center opacity-25 mix-blend-screen"
        />
      )}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,240,255,0.14),transparent_34%),radial-gradient(circle_at_86%_60%,rgba(255,45,149,0.18),transparent_38%),linear-gradient(180deg,rgba(3,6,11,0.55),rgba(3,6,11,0.98))]" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-24 h-72 w-72 rounded-full bg-[#ff2d95]/15 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -left-24 bottom-10 h-72 w-72 rounded-full bg-[#00f0ff]/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-5xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link href={`/author/${encodeURIComponent(author.slug)}`} className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/55 transition-colors hover:text-[#00f0ff]">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Світ автора
          </Link>
          <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#ff2d95]/75">MEMORY // {memory.id}</span>
        </div>

        <article className="author-memory-neon relative isolate overflow-hidden px-5 py-10 text-white sm:px-12 sm:py-14 lg:px-20 lg:py-16">
          <div aria-hidden="true" className="pointer-events-none absolute left-0 top-0 h-px w-1/2 bg-gradient-to-r from-transparent via-[#00f0ff] to-transparent shadow-[0_0_14px_#00f0ff]" />
          <div aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 h-px w-1/2 bg-gradient-to-r from-transparent via-[#ff2d95] to-transparent shadow-[0_0_14px_#ff2d95]" />

          <header className="relative z-10 max-w-3xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#00f0ff]">NEON MEMORY CHAMBER // AUTHOR WORLD</p>
            <h1 className="mt-5 break-words font-creepster text-5xl leading-[0.95] tracking-[0.04em] text-white drop-shadow-[0_0_16px_rgba(0,240,255,0.62)] sm:text-7xl">{memory.title}</h1>
            <div className="mt-5 flex items-center gap-3 border-y border-[#00f0ff]/25 py-3">
              <div className="author-memory-avatar flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#00f0ff]/75 bg-[#07131b] font-mono text-xs text-[#b9f7ff]">
                {author.avatarUrl ? <img src={author.avatarUrl} alt="" className="h-full w-full object-contain" /> : author.displayName.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate font-mono text-[10px] font-bold uppercase tracking-[0.17em] text-[#b9f7ff]">{author.displayName}</p>
                <p className="mt-1 truncate font-mono text-[9px] uppercase tracking-[0.14em] text-[#ffad7f]/80">{author.role}</p>
              </div>
            </div>
          </header>

          <div className="relative z-10 mt-9 grid gap-8 md:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] md:items-start">
            {memory.imageUrl && (
                <div className="author-memory-data-block mx-auto w-full max-w-sm p-3 md:mx-0">
                <img src={memory.imageUrl} alt="" className="aspect-[4/3] w-full object-cover opacity-90" />
              </div>
            )}
            <div className={memory.imageUrl ? "" : "md:col-span-2 md:max-w-3xl"}>
              <section className="author-memory-data-block p-5 sm:p-6">
                <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.22em] text-[#00f0ff]">MEMORY LOG // HISTORY</p>
                <p className="whitespace-pre-wrap font-serif text-xl leading-[1.85] text-white/90 sm:text-2xl">{memory.description}</p>
              </section>

              {memory.poem && (
                <section className="author-memory-data-block mt-5 border-l-2 border-[#ff2d95]/75 p-5 sm:p-6">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#ff2d95]">POEM // ВІРШ</p>
                  <p className="mt-4 whitespace-pre-wrap font-serif text-xl italic leading-[1.9] text-[#ffe6f2] sm:text-2xl">{memory.poem}</p>
                </section>
              )}

              {links.length > 0 && (
                <section className="author-memory-data-block mt-5 p-5 sm:p-6">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8eff5c]">LINKS // ПОСИЛАННЯ</p>
                  <div className="mt-4 space-y-3">
                    {links.map((link) => (
                      <a key={link} href={link} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 break-all font-mono text-xs leading-relaxed text-[#b9f7ff] underline decoration-[#00f0ff]/45 underline-offset-4 transition-colors hover:text-white">
                        <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>{link}</span>
                      </a>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>

          <footer className="relative z-10 mt-12 border-t border-[#00f0ff]/25 pt-5 font-mono text-[10px] uppercase tracking-[0.18em] text-[#b9f7ff]/65">
            {author.displayName} // {author.role}
          </footer>
        </article>
      </div>
    </main>
  );
}