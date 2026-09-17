import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Redirect } from "wouter";
import { useUser } from "@clerk/react";
import { GlitchButton } from "@/components/GlitchButton";

type Stats = {
  rangeDays: number;
  summary: {
    page_views: number;
    unique_visitors: number;
    total_events: number;
  };
  events: Array<{ event_name: string; count: number }>;
  daily: Array<{ day: string; page_views: number; visitors: number }>;
  topPages: Array<{ path: string; count: number }>;
  recentEvents: Array<{
    event_name: string;
    path: string;
    country: string;
    referrer: string;
    created_at: string;
  }>;
  trustedDevice: {
    registeredAt: string | null;
    recentEvents: Array<{
      event_type: "registered" | "replaced";
      created_at: string;
    }>;
    replacementBurst: {
      count: number;
      threshold: number;
      windowHours: number;
      warning: boolean;
    };
  };
};

type AccessError = {
  message: string;
  status: number;
};

const eventLabels: Record<string, string> = {
  page_viewed: "Перегляди сторінок",
  product_viewed: "Перегляди товарів",
  cart_item_added: "Додавання в кошик",
  cart_item_removed: "Видалення з кошика",
  checkout_started: "Початок оформлення",
  payment_redirect_created: "Переходи до оплати",
  checkout_failed: "Невдалі оплати",
  external_link_clicked: "Зовнішні посилання",
};

const deviceSecurityEventLabels: Record<string, string> = {
  registered: "Реєстрація довіреного пристрою",
  replaced: "Заміна довіреного пристрою",
};

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className={`apoc-card border bg-black/50 p-5 ${accent}`}>
      <div className="mb-2 text-xs uppercase tracking-[0.2em] text-white/60">{label}</div>
      <div className="font-creepster text-4xl text-white">{value.toLocaleString("uk-UA")}</div>
    </div>
  );
}

function countryLabel(value: string): string {
  if (!value || value === "unknown") return "Невідомо";
  if (/^[A-Z]{2}$/i.test(value)) {
    try {
      return new Intl.DisplayNames(["uk"], { type: "region" }).of(value.toUpperCase()) ?? value;
    } catch {
      return value;
    }
  }
  return value;
}

function referrerLabel(value: string): string {
  if (!value || value === "direct") return "Прямий перехід";
  if (value === "internal") return "Інша сторінка сайту";
  return value;
}

export default function OwnerAnalytics() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<AccessError | null>(null);
  const [recoveryStep, setRecoveryStep] = useState<"idle" | "confirming" | "recovering">("idle");
  const [recoveryError, setRecoveryError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}api/owner/activity`, {
      credentials: "same-origin",
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setError({
          message: payload.error || "Не вдалося завантажити статистику",
          status: response.status,
        });
        return;
      }
      setStats(await response.json() as Stats);
      setError(null);
    } catch (requestError: unknown) {
      setError({
        message: requestError instanceof Error ? requestError.message : "Помилка доступу",
        status: 0,
      });
    }
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const recoverDevice = async () => {
    setRecoveryStep("recovering");
    setRecoveryError(null);
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}api/owner/device/recover`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Не вдалося відновити доступ");
      }
      setRecoveryStep("idle");
      setStats(null);
      await loadStats();
    } catch (requestError: unknown) {
      setRecoveryStep("confirming");
      setRecoveryError(requestError instanceof Error ? requestError.message : "Не вдалося відновити доступ");
    }
  };

  const maxDailyViews = useMemo(
    () => Math.max(...(stats?.daily.map((item) => item.page_views) ?? [1]), 1),
    [stats],
  );

  if (!isLoaded) {
    return <div className="min-h-screen bg-[#050208] p-8 text-center font-mono text-primary">ПЕРЕВІРКА ДОСТУПУ...</div>;
  }
  if (!isSignedIn) return <Redirect to="/sign-in" />;

  return (
    <main className="min-h-screen bg-[#050208] px-4 py-8 text-foreground md:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-4 border-b border-primary/20 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 font-mono text-xs uppercase tracking-[0.3em] text-secondary">OWNER TRANSMISSION</div>
            <h1 className="glitch-text font-creepster text-4xl text-primary md:text-6xl">АКТИВНІСТЬ САЙТУ</h1>
            <p className="mt-3 font-mono text-sm text-white/60">
              Останні 30 днів · {user?.primaryEmailAddress?.emailAddress ?? "власник"}
            </p>
          </div>
          <Link href="/">
            <GlitchButton className="w-full text-sm sm:w-auto">Повернутися на сайт</GlitchButton>
          </Link>
        </header>

        {error ? (
          <div className="apoc-card border border-red-500/60 bg-red-950/30 p-6 font-mono text-red-200">
            <div className="mb-2 text-lg font-bold">ДОСТУП ЗАБОРОНЕНО</div>
            <p>{error.message}</p>
            {error.status === 403 && error.message === "Trusted device required" ? (
              <div className="mt-5 border-t border-red-300/20 pt-5">
                <p className="text-sm text-white/70">
                  Якщо довірений пристрій втрачено, власник може відкликати його та зареєструвати цей пристрій.
                  Старий пристрій одразу втратить доступ.
                </p>
                {recoveryStep === "idle" ? (
                  <GlitchButton
                    type="button"
                    className="mt-4 border-red-400/70 text-red-200 hover:bg-red-500/20"
                    onClick={() => setRecoveryStep("confirming")}
                  >
                    Почати відновлення
                  </GlitchButton>
                ) : recoveryStep === "confirming" ? (
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <button
                      type="button"
                      className="border border-red-400 bg-red-950/60 px-5 py-2 text-xs uppercase tracking-widest text-red-100 transition hover:bg-red-500/30"
                      onClick={() => void recoverDevice()}
                    >
                      Підтвердити відкликання
                    </button>
                    <button
                      type="button"
                      className="px-3 py-2 text-xs uppercase tracking-widest text-white/60 hover:text-white"
                      onClick={() => {
                        setRecoveryStep("idle");
                        setRecoveryError(null);
                      }}
                    >
                      Скасувати
                    </button>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-primary">ЗАМІНА ДОВІРЕНОГО ПРИСТРОЮ...</p>
                )}
                {recoveryError && <p className="mt-3 text-sm text-red-300">{recoveryError}</p>}
              </div>
            ) : (
              <p className="mt-3 text-sm text-white/60">Панель доступна лише для власника, вказаного під час налаштування.</p>
            )}
          </div>
        ) : !stats ? (
          <div className="apoc-card p-8 text-center font-mono text-primary">ЗАВАНТАЖЕННЯ ДАНИХ...</div>
        ) : (
          <>
            <section className="apoc-card mb-6 border border-secondary/40 bg-secondary/[0.06] p-5 font-mono md:p-6">
              <div className="text-xs uppercase tracking-[0.2em] text-secondary">Довірений пристрій</div>
              <div className="mt-2 text-lg text-white">
                {stats.trustedDevice.registeredAt
                  ? `Зареєстровано або замінено: ${new Date(stats.trustedDevice.registeredAt).toLocaleString("uk-UA", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`
                  : "Час реєстрації недоступний"}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-white/60">
                Заміна довіреного пристрою анулює cookie попереднього пристрою та одразу забирає його доступ.
              </p>
              {stats.trustedDevice.replacementBurst.warning && (
                <div
                  role="alert"
                  className="mt-4 border border-red-400/70 bg-red-950/50 p-4 text-red-100"
                >
                  <div className="text-xs font-bold uppercase tracking-[0.2em] text-red-300">
                    Попередження безпеки
                  </div>
                  <p className="mt-2 text-sm leading-relaxed">
                    За останні {stats.trustedDevice.replacementBurst.windowHours} годин зафіксовано{" "}
                    {stats.trustedDevice.replacementBurst.count} заміни довіреного пристрою.
                    Це може свідчити про підозрілу активність.
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-red-200/80">
                    Якщо ви не виконували всі ці заміни, негайно захистіть обліковий запис і зверніться до підтримки.
                  </p>
                </div>
              )}
              <div className="mt-5 border-t border-secondary/20 pt-4">
                <div className="mb-3 text-[10px] uppercase tracking-[0.2em] text-white/50">
                  Історія безпеки
                </div>
                <div className="space-y-2">
                  {stats.trustedDevice.recentEvents.map((event, index) => (
                    <div
                      key={`${event.created_at}-${event.event_type}-${index}`}
                      className="flex flex-col gap-1 border-l-2 border-secondary/50 bg-black/20 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <span className="text-sm text-white/80">
                        {deviceSecurityEventLabels[event.event_type] ?? event.event_type}
                      </span>
                      <time className="whitespace-nowrap text-xs text-secondary" dateTime={event.created_at}>
                        {new Date(event.created_at).toLocaleString("uk-UA", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </time>
                    </div>
                  ))}
                  {!stats.trustedDevice.recentEvents.length && (
                    <p className="text-xs text-white/50">Подій безпеки ще немає.</p>
                  )}
                </div>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-3">
              <StatCard label="Перегляди сторінок" value={stats.summary.page_views} accent="border-primary/50" />
              <StatCard label="Унікальні пристрої" value={stats.summary.unique_visitors} accent="border-secondary/60" />
              <StatCard label="Усі події" value={stats.summary.total_events} accent="border-[#ff6b35]/60" />
            </section>

            <section className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
              <div className="apoc-card bg-black/40 p-5 md:p-6">
                <h2 className="mb-6 font-creepster text-3xl text-primary">ДИНАМІКА ВІДВІДУВАНЬ</h2>
                <div className="flex h-56 items-end gap-1 border-b border-white/10 pb-2">
                  {stats.daily.map((item) => (
                    <div key={item.day} className="group flex h-full flex-1 flex-col justify-end">
                      <div
                        className="min-h-1 rounded-t bg-gradient-to-t from-secondary to-primary opacity-80 transition-all group-hover:opacity-100"
                        style={{ height: `${Math.max((item.page_views / maxDailyViews) * 100, item.page_views ? 8 : 2)}%` }}
                        title={`${item.day}: ${item.page_views} переглядів`}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex justify-between font-mono text-[10px] text-white/50">
                  <span>{stats.daily[0]?.day ?? "—"}</span>
                  <span>{stats.daily.at(-1)?.day ?? "—"}</span>
                </div>
              </div>

              <div className="apoc-card bg-black/40 p-5 md:p-6">
                <h2 className="mb-6 font-creepster text-3xl text-secondary">ПОДІЇ</h2>
                <div className="space-y-3">
                  {stats.events.map((event) => (
                    <div key={event.event_name} className="flex items-center justify-between gap-4 border-b border-white/10 pb-2 font-mono text-xs">
                      <span className="text-white/70">{eventLabels[event.event_name] ?? event.event_name}</span>
                      <strong className="text-primary">{event.count.toLocaleString("uk-UA")}</strong>
                    </div>
                  ))}
                  {!stats.events.length && <p className="font-mono text-sm text-white/50">Подій ще немає.</p>}
                </div>
              </div>
            </section>

            <section className="apoc-card mt-6 bg-black/40 p-5 md:p-6">
              <h2 className="mb-5 font-creepster text-3xl text-[#ff9b71]">НАЙПОПУЛЯРНІШІ СТОРІНКИ</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {stats.topPages.map((page) => (
                  <div key={page.path} className="border border-white/10 bg-white/[0.03] p-4 font-mono">
                    <div className="truncate text-sm text-white/80">{page.path}</div>
                    <div className="mt-2 text-2xl text-[#ff9b71]">{page.count.toLocaleString("uk-UA")}</div>
                    <div className="text-[10px] uppercase tracking-widest text-white/40">переглядів</div>
                  </div>
                ))}
                {!stats.topPages.length && <p className="font-mono text-sm text-white/50">Сторінок ще не переглядали.</p>}
              </div>
            </section>

            <section className="apoc-card mt-6 overflow-hidden bg-black/40 p-5 md:p-6">
              <h2 className="mb-5 font-creepster text-3xl text-primary">ОСТАННЯ АКТИВНІСТЬ</h2>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[780px] border-collapse font-mono text-xs">
                  <thead>
                    <tr className="border-b border-primary/30 text-left uppercase tracking-wider text-white/50">
                      <th className="px-3 py-3">Час</th>
                      <th className="px-3 py-3">Дія</th>
                      <th className="px-3 py-3">Сторінка</th>
                      <th className="px-3 py-3">Країна</th>
                      <th className="px-3 py-3">Звідки прийшли</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentEvents.map((event, index) => (
                      <tr key={`${event.created_at}-${index}`} className="border-b border-white/10 text-white/75">
                        <td className="whitespace-nowrap px-3 py-3 text-secondary">
                          {new Date(event.created_at).toLocaleString("uk-UA", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </td>
                        <td className="px-3 py-3">{eventLabels[event.event_name] ?? event.event_name}</td>
                        <td className="max-w-48 truncate px-3 py-3 text-primary">{event.path}</td>
                        <td className="px-3 py-3">{countryLabel(event.country)}</td>
                        <td className="max-w-52 truncate px-3 py-3">{referrerLabel(event.referrer)}</td>
                      </tr>
                    ))}
                    {!stats.recentEvents.length && (
                      <tr>
                        <td colSpan={5} className="px-3 py-8 text-center text-white/50">Подій ще немає.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}