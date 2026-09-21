import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useUser } from "@clerk/react";
import { AUTHORS_WORLD_COPY } from "@/i18n/authorsWorld";
import { useT } from "@/i18n/LanguageContext";

const API_ROOT = `${import.meta.env.BASE_URL}api`;

type CurrentAuthor = {
  slug?: string | null;
};

export default function MyPortal() {
  const [, setLocation] = useLocation();
  const { lang } = useT();
  const copy = AUTHORS_WORLD_COPY[lang];
  const { isLoaded, isSignedIn } = useUser();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setLocation("/sign-in");
      return;
    }

    let active = true;
    fetch(`${API_ROOT}/authors-world/me`, { credentials: "include" })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({})) as { author?: CurrentAuthor | null };
        if (!response.ok) throw new Error(copy.errors.openPortal);
        if (!active) return;
        if (payload.author?.slug) {
          setLocation(`/author/${encodeURIComponent(payload.author.slug)}`);
        } else {
          setLocation("/authors-world");
        }
      })
      .catch(() => {
        if (active) setError(copy.errors.openPortal);
      });

    return () => {
      active = false;
    };
  }, [copy.errors.openPortal, isLoaded, isSignedIn, setLocation]);

  if (error) {
    return (
      <main className="min-h-[calc(100dvh-82px)] bg-[#03060b] px-6 py-20 text-center">
        <p className="font-mono text-sm text-[#ffb184]">{error}</p>
        <Link href="/authors-world" className="mt-6 inline-flex border border-[#00f0ff]/60 px-4 py-3 font-mono text-xs text-[#b9f7ff]">
          {copy.nav.title}
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100dvh-82px)] bg-[#03060b] px-6 py-20 text-center font-mono text-sm text-[#8ceeff]">
      {copy.nav.checking}
    </main>
  );
}