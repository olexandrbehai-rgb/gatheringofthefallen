import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, ExternalLink } from "lucide-react";
import { useUser } from "@clerk/react";
import { Link, Redirect } from "wouter";
import { useT } from "@/i18n/LanguageContext";
import { GlitchButton } from "@/components/GlitchButton";

const API_ROOT = `${import.meta.env.BASE_URL}api`;

type Copy = {
  eyebrow: string;
  title: string;
  description: string;
  backToPortal: string;
  profile: string;
  loading: string;
  signIn: string;
  noPortal: string;
  failed: string;
  pageViews: string;
  uniqueVisitors: string;
  daily: string;
  sources: string;
  countries: string;
  recent: string;
  date: string;
  source: string;
  country: string;
  empty: string;
  direct: string;
  internal: string;
  unknown: string;
  views: string;
  visitors: string;
  privacy: string;
};

type AuthorAnalyticsData = {
  rangeDays: number;
  author: {
    slug: string;
    displayName: string;
    profilePath: string;
  };
  summary: {
    pageViews: number;
    uniqueVisitors: number;
  };
  daily: Array<{ day: string; pageViews: number; visitors: number }>;
  referrers: Array<{ referrer: string; count: number }>;
  countries: Array<{ country: string; count: number }>;
  recentViews: Array<{ createdAt: string; country: string; referrer: string }>;
};

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className={`border bg-black/50 p-5 ${accent}`}>
      <div className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-white/60">{label}</div>
      <div className="font-creepster text-4xl text-white">{value.toLocaleString("uk-UA")}</div>
    </div>
  );
}

function displayCountry(value: string, copy: Copy, lang: string) {
  if (!value || value === "unknown") return copy.unknown;
  if (/^[A-Z]{2}$/i.test(value)) {
    try {
      return new Intl.DisplayNames([lang === "ua" ? "uk" : lang], { type: "region" }).of(value.toUpperCase()) ?? value;
    } catch {
      return value;
    }
  }
  return value;
}

function displayReferrer(value: string, copy: Copy) {
  if (!value || value === "direct") return copy.direct;
  if (value === "internal") return copy.internal;
  return value;
}

export default function AuthorAnalytics() {
  const { lang, tObj } = useT();
  const copy = tObj<Copy>("authorAnalytics");
  const { isLoaded, isSignedIn } = useUser();
  const [stats, setStats] = useState<AuthorAnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;
    try {
      const response = await fetch(`${API_ROOT}/authors-world/me/analytics`, { credentials: "include" });
      const payload = await response.json().catch(() => ({})) as AuthorAnalyticsData & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? copy.failed);
      setStats(payload);
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : copy.failed);
    }
  }, [copy.failed, isLoaded, isSignedIn]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const maxDailyViews = useMemo(
    () => Math.max(...(stats?.daily.map((item) => item.pageViews) ?? [1]), 1),
    [stats],
  );

  if (!isLoaded) {
    return <div className="min-h-screen bg-[#050208] p-8 text-center font-mono text-primary">{copy.loading}</div>;
  }
  if (!isSignedIn) return <Redirect to="/sign-in" />;

  return (
    <main className="min-h-screen bg-[#050208] px-4 py-8 text-foreground md:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-4 border-b border-primary/20 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 font-mono text-xs uppercase tracking-[0.3em] text-secondary">{copy.eyebrow}</div>
            <h1 className="glitch-text font-creepster text-4xl text-primary md:text-6xl">{copy.title}</h1>
            <p className="mt-3 max-w-2xl font-mono text-sm text-white/60">
              {stats ? `${stats.author.displayName} · ${copy.description}` : copy.description}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:min-w-56">
            <Link href="/authors-world">
              <GlitchButton className="w-full text-sm">{copy.backToPortal}</GlitchButton>
            </Link>
            {stats && (
              <Link
                href={stats.author.profilePath}
                className="inline-flex min-h-10 items-center justify-center gap-2 border border-primary/40 px-4 py-2 font-mono text-xs uppercase tracking-widest text-primary transition hover:border-primary hover:bg-primary/10"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /> {copy.profile}
              </Link>
            )}
          </div>
        </header>

        {error ? (
          <div className="border border-red-500/60 bg-red-950/30 p-6 font-mono text-red-200">
            <div className="mb-2 text-lg font-bold">{copy.failed}</div>
            <p>{error}</p>
            {error.toLowerCase().includes("portal") && <p className="mt-3 text-sm text-white/60">{copy.noPortal}</p>}
          </div>
        ) : !stats ? (
          <div className="border border-primary/30 bg-black/40 p-8 text-center font-mono text-primary">{copy.loading}</div>
        ) : (
          <>
            <div className="mb-3 font-mono text-xs uppercase tracking-[0.18em] text-white/45">
              {copy.description} · {stats.rangeDays} {lang === "ua" ? "днів" : "days"}
            </div>
            <section className="grid gap-4 md:grid-cols-2">
              <StatCard label={copy.pageViews} value={stats.summary.pageViews} accent="border-primary/50" />
              <StatCard label={copy.uniqueVisitors} value={stats.summary.uniqueVisitors} accent="border-secondary/60" />
            </section>

            <section className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
              <div className="border border-primary/25 bg-black/40 p-5 md:p-6">
                <h2 className="mb-6 font-creepster text-3xl text-primary">{copy.daily}</h2>
                <div className="flex h-56 items-end gap-1 border-b border-white/10 pb-2">
                  {stats.daily.length === 0 ? (
                    <p className="w-full text-center font-mono text-sm text-white/50">{copy.empty}</p>
                  ) : (
                    stats.daily.map((item) => (
                      <div key={item.day} className="group flex h-full flex-1 flex-col justify-end">
                        <div
                          className="min-h-1 rounded-t bg-gradient-to-t from-secondary to-primary opacity-80 transition-all group-hover:opacity-100"
                          style={{ height: `${Math.max((item.pageViews / maxDailyViews) * 100, item.pageViews ? 8 : 2)}%` }}
                          title={`${item.day}: ${item.pageViews} ${copy.views}`}
                        />
                      </div>
                    ))
                  )}
                </div>
                {stats.daily.length > 0 && (
                  <div className="mt-3 flex justify-between font-mono text-[10px] text-white/50">
                    <span>{stats.daily[0]?.day}</span>
                    <span>{stats.daily.at(-1)?.day}</span>
                  </div>
                )}
              </div>

              <div className="border border-secondary/25 bg-black/40 p-5 md:p-6">
                <h2 className="mb-6 font-creepster text-3xl text-secondary">{copy.sources}</h2>
                <div className="space-y-3">
                  {stats.referrers.map((item) => (
                    <div key={item.referrer} className="flex items-center justify-between gap-4 border-b border-white/10 pb-2 font-mono text-xs">
                      <span className="truncate text-white/70">{displayReferrer(item.referrer, copy)}</span>
                      <strong className="text-primary">{item.count.toLocaleString("uk-UA")}</strong>
                    </div>
                  ))}
                  {!stats.referrers.length && <p className="font-mono text-sm text-white/50">{copy.empty}</p>}
                </div>
              </div>
            </section>

            <section className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="border border-[#ff9b71]/40 bg-black/40 p-5 md:p-6">
                <h2 className="mb-5 font-creepster text-3xl text-[#ff9b71]">{copy.countries}</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {stats.countries.map((item) => (
                    <div key={item.country} className="border border-white/10 bg-white/[0.03] p-4 font-mono">
                      <div className="truncate text-sm text-white/80">{displayCountry(item.country, copy, lang)}</div>
                      <div className="mt-2 text-2xl text-[#ff9b71]">{item.count.toLocaleString("uk-UA")}</div>
                      <div className="text-[10px] uppercase tracking-widest text-white/40">{copy.views}</div>
                    </div>
                  ))}
                  {!stats.countries.length && <p className="font-mono text-sm text-white/50">{copy.empty}</p>}
                </div>
              </div>

              <div className="border border-primary/25 bg-black/40 p-5 md:p-6">
                <h2 className="mb-5 font-creepster text-3xl text-primary">{copy.recent}</h2>
                <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                  {stats.recentViews.map((view, index) => (
                    <div key={`${view.createdAt}-${index}`} className="border-l-2 border-primary/50 bg-black/25 px-3 py-2 font-mono text-xs">
                      <time className="text-primary" dateTime={view.createdAt}>
                        {new Date(view.createdAt).toLocaleString(lang === "ua" ? "uk-UA" : lang === "fr" ? "fr-FR" : "en-CA")}
                      </time>
                      <div className="mt-1 text-white/60">
                        {displayCountry(view.country, copy, lang)} · {displayReferrer(view.referrer, copy)}
                      </div>
                    </div>
                  ))}
                  {!stats.recentViews.length && <p className="font-mono text-sm text-white/50">{copy.empty}</p>}
                </div>
              </div>
            </section>

            <p className="mt-6 border border-white/10 bg-black/25 px-4 py-3 font-mono text-xs leading-relaxed text-white/45">
              {copy.privacy}
            </p>
          </>
        )}
      </div>
    </main>
  );
}