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
      <main className="min-h-[calc(100dvh-82px)] bg-[#120c0a] px-6 py-24 text-center font-mono text-sm uppercase tracking-[0.18em] text-[#ffcf9e]">
        ВІДКРИВАЄМО СТОРІНКУ ПАМ’ЯТІ...
      </main>
    );
  }

  if (error || !author || !memory) {
    return (
      <main className="min-h-[calc(100dvh-82px)] bg-[#120c0a] px-6 py-24 text-center text-[#f7dfb3]">
        <p className="font-mono text-sm text-[#ffb184]">{error ?? "Сторінка спогаду не знайдена."}</p>
        <Link href={`/author/${encodeURIComponent(params.slug)}`} className="mt-6 inline-flex items-center gap-2 border border-[#ffcf9e]/60 px-4 py-3 font-mono text-xs uppercase tracking-[0.14em] text-[#ffcf9e]">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Повернутися до світу автора
        </Link>
      </main>
    );
  }

  return (
    <main className="relative min-h-[calc(100dvh-82px)] overflow-hidden bg-[#120c0a] px-3 py-8 text-[#342018] sm:px-6 sm:py-12 lg:px-10">
      {author.backgroundUrl && (
        <img
          src={author.backgroundUrl}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center opacity-40"
        />
      )}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,207,158,0.22),transparent_38%),linear-gradient(180deg,rgba(18,12,10,0.56),rgba(18,12,10,0.94))]" />

      <div className="relative z-10 mx-auto max-w-5xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link href={`/author/${encodeURIComponent(author.slug)}`} className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#f7dfb3]/65 transition-colors hover:text-[#ffcf9e]">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Світ автора
          </Link>
          <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#ffcf9e]/55">MEMORY // {memory.id}</span>
        </div>

        <article className="author-memory-parchment relative isolate overflow-hidden px-5 py-10 shadow-[0_0_90px_rgba(255,207,158,0.2)] sm:px-12 sm:py-14 lg:px-20 lg:py-16">
          <div aria-hidden="true" className="pointer-events-none absolute inset-3 border border-[#6f4630]/35 sm:inset-6" />
          <div aria-hidden="true" className="pointer-events-none absolute -inset-x-8 top-1/2 h-40 -translate-y-1/2 rotate-[-4deg] bg-[#fff1c9]/20 blur-3xl" />

          <header className="relative z-10 max-w-3xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#6f4630]">Порваний пергамент // пам’ять автора</p>
            <h1 className="mt-5 font-creepster text-5xl leading-[0.95] tracking-[0.04em] text-[#39211a] sm:text-7xl">{memory.title}</h1>
            <div className="mt-5 flex items-center gap-3 border-y border-[#6f4630]/25 py-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#6f4630]/50 bg-[#d6b47c]/35 font-mono text-xs text-[#6f4630]">
                {author.avatarUrl ? <img src={author.avatarUrl} alt="" className="h-full w-full object-contain" /> : author.displayName.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate font-mono text-[10px] font-bold uppercase tracking-[0.17em] text-[#4b2b20]">{author.displayName}</p>
                <p className="mt-1 truncate font-mono text-[9px] uppercase tracking-[0.14em] text-[#6f4630]/75">{author.role}</p>
              </div>
            </div>
          </header>

          <div className="relative z-10 mt-9 grid gap-8 md:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] md:items-start">
            {memory.imageUrl && (
              <div className="mx-auto w-full max-w-sm rotate-[-1.5deg] bg-[#f4dfb3]/70 p-3 shadow-[0_8px_20px_rgba(61,32,18,0.22)] md:mx-0">
                <img src={memory.imageUrl} alt="" className="aspect-[4/3] w-full object-cover mix-blend-multiply" />
              </div>
            )}
            <div className={memory.imageUrl ? "" : "md:col-span-2 md:max-w-3xl"}>
              <p className="whitespace-pre-wrap font-serif text-xl leading-[1.85] text-[#3e2920] sm:text-2xl">{memory.description}</p>

              {memory.poem && (
                <section className="mt-9 border-t border-[#6f4630]/30 pt-6">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#6f4630]">Вірш</p>
                  <p className="mt-4 whitespace-pre-wrap font-serif text-xl italic leading-[1.9] text-[#3e2920] sm:text-2xl">{memory.poem}</p>
                </section>
              )}

              {links.length > 0 && (
                <section className="mt-9 border-t border-[#6f4630]/30 pt-6">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#6f4630]">Посилання</p>
                  <div className="mt-4 space-y-3">
                    {links.map((link) => (
                      <a key={link} href={link} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 break-all font-mono text-xs leading-relaxed text-[#6f4630] underline decoration-[#6f4630]/45 underline-offset-4 transition-colors hover:text-[#24150f]">
                        <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>{link}</span>
                      </a>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>

          <footer className="relative z-10 mt-12 border-t border-[#6f4630]/35 pt-5 font-mono text-[10px] uppercase tracking-[0.18em] text-[#6f4630]">
            {author.displayName} // {author.role}
          </footer>
        </article>
      </div>
    </main>
  );
}