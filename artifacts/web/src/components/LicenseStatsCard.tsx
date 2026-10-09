import { useState } from "react";

type LicenseStats = {
  rangeDays: number;
  licenses: { total: number; active: number; last_7d: number; in_range: number };
  activations: { active_devices: number; total_devices_ever: number; deactivated: number; seen_7d: number };
  resets: {
    byOutcome: Array<{ outcome: string; count: number }>;
    daily: Array<{ day: string; licenses: number; activations: number; reset_requests: number; resets_confirmed: number }>;
    weekly: Array<{ week: string; reset_requests: number; resets_confirmed: number }>;
  };
  topRepeatEmails: Array<{ email: string; requests: number; confirmed: number; last_request: string }>;
};

const OUTCOME_LABELS: Record<string, string> = {
  sent: "Лист надіслано",
  confirmed: "Скинуто",
  no_license: "Пошта без ліцензії",
  rate_limited_email: "Ліміт пошти",
  rate_limited_ip: "Ліміт IP",
  email_failed: "Помилка листа",
};

/** Owner-only GOTF LIVE AI license stats. Loads on demand (button) to keep the main dashboard request unchanged. */
export function LicenseStatsCard() {
  const [stats, setStats] = useState<LicenseStats | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setState("loading");
    try {
      const r = await fetch(`${import.meta.env.BASE_URL}api/owner/license-stats?days=30`, { credentials: "same-origin" });
      const body = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(body.error || "Не вдалося завантажити");
      setStats(body as LicenseStats);
      setState("idle");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Помилка");
      setState("error");
    }
  };

  const resetsLast7 = stats?.resets.daily.slice(-7).reduce((n, d) => n + d.reset_requests, 0) ?? 0;

  return (
    <section className="apoc-card bg-black/40 p-5 font-mono md:p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="font-creepster text-3xl text-secondary">GOTF LIVE AI · ліцензії</h2>
        <button
          type="button"
          onClick={() => void load()}
          disabled={state === "loading"}
          className="border border-secondary/50 px-4 py-2 text-xs uppercase tracking-widest text-secondary hover:bg-secondary/20 disabled:opacity-50"
        >
          {state === "loading" ? "…" : stats ? "Оновити" : "Показати"}
        </button>
      </div>
      {state === "error" && <p className="text-sm text-red-300">{error}</p>}
      {stats && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Ліцензій всього", stats.licenses.total],
              ["Продано за 30 днів", stats.licenses.in_range],
              ["Активних пристроїв", stats.activations.active_devices],
              ["Запитів скидання (7 дн.)", resetsLast7],
            ].map(([label, value]) => (
              <div key={label} className="border border-white/10 bg-white/[0.03] p-4">
                <div className="text-[10px] uppercase tracking-widest text-white/50">{label}</div>
                <div className="mt-2 text-2xl text-white">{Number(value).toLocaleString("uk-UA")}</div>
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-6 md:grid-cols-2">
            <div>
              <div className="mb-2 text-[10px] uppercase tracking-widest text-white/50">Скидання за 30 днів</div>
              {stats.resets.byOutcome.map((o) => (
                <div key={o.outcome} className="flex justify-between border-b border-white/10 py-1 text-xs">
                  <span className="text-white/70">{OUTCOME_LABELS[o.outcome] ?? o.outcome}</span>
                  <strong className="text-secondary">{o.count}</strong>
                </div>
              ))}
              {!stats.resets.byOutcome.length && <p className="text-xs text-white/40">Запитів не було</p>}
              <div className="mb-2 mt-4 text-[10px] uppercase tracking-widest text-white/50">По тижнях (запити / скинуто)</div>
              {stats.resets.weekly.map((w) => (
                <div key={w.week} className="flex justify-between border-b border-white/10 py-1 text-xs">
                  <span className="text-white/70">{w.week}</span>
                  <span className="text-secondary">{w.reset_requests} / {w.resets_confirmed}</span>
                </div>
              ))}
            </div>
            <div>
              <div className="mb-2 text-[10px] uppercase tracking-widest text-white/50">Часто звертаються (90 днів)</div>
              {stats.topRepeatEmails.map((e) => (
                <div key={e.email} className="flex justify-between gap-2 border-b border-white/10 py-1 text-xs">
                  <span className="truncate text-white/70">{e.email}</span>
                  <strong className="text-secondary">{e.requests}</strong>
                </div>
              ))}
              {!stats.topRepeatEmails.length && <p className="text-xs text-white/40">Немає повторних звернень</p>}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
