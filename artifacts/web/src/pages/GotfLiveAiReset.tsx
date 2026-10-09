import { useEffect, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { KeyRound, MailCheck, ShieldAlert } from "lucide-react";
import { GlitchButton } from "@/components/GlitchButton";

type Phase =
  | { kind: "form" }
  | { kind: "sending" }
  | { kind: "sent"; message: string }
  | { kind: "checking" }
  | { kind: "confirm"; email: string }
  | { kind: "confirming" }
  | { kind: "done"; deactivated: number; licenses: Array<{ key: string; max_devices: number }> }
  | { kind: "invalid"; message: string };

const API = `${import.meta.env.BASE_URL}api/license/reset`;

function readToken(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("token");
}

export default function GotfLiveAiReset() {
  const [token] = useState(readToken);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>(token ? { kind: "checking" } : { kind: "form" });

  useEffect(() => {
    if (!token) return;
    // GET only checks the link; the reset happens after the button click (POST),
    // so mail scanners that open links cannot reset anything.
    fetch(`${API}/confirm?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        const body = await r.json().catch(() => ({}));
        if (r.ok && body.valid) setPhase({ kind: "confirm", email: body.email });
        else setPhase({ kind: "invalid", message: body.error || "Посилання недійсне." });
      })
      .catch(() => setPhase({ kind: "invalid", message: "Немає зв'язку з сервером. Спробуйте ще раз." }));
  }, [token]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setPhase({ kind: "sending" });
    try {
      const r = await fetch(`${API}/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(body.error || "Не вдалося надіслати запит.");
        setPhase({ kind: "form" });
        return;
      }
      setPhase({ kind: "sent", message: body.message });
    } catch {
      setError("Немає зв'язку з сервером. Спробуйте ще раз.");
      setPhase({ kind: "form" });
    }
  };

  const confirm = async () => {
    setPhase({ kind: "confirming" });
    try {
      const r = await fetch(`${API}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const body = await r.json().catch(() => ({}));
      if (!r.ok) {
        setPhase({ kind: "invalid", message: body.error || "Не вдалося скинути активації." });
        return;
      }
      window.history.replaceState(null, "", window.location.pathname);
      setPhase({ kind: "done", deactivated: body.deactivated, licenses: body.licenses ?? [] });
    } catch {
      setPhase({ kind: "invalid", message: "Немає зв'язку з сервером. Спробуйте ще раз." });
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="container mx-auto max-w-2xl px-4 py-12 md:py-24">
      <h1 className="glitch-text mb-4 text-center font-creepster text-4xl text-primary md:text-6xl">Скидання ключа</h1>
      <p className="mb-10 text-center font-mono text-sm text-white/60">
        GOTF LIVE AI · перевстановили Windows або змінили комп'ютер і програма каже, що ліміт пристроїв вичерпано?
        Скиньте всі активації — і просто увійдіть знову з тією ж поштою та ключем.
      </p>

      <div className="apoc-card bg-black/40 p-8 font-mono backdrop-blur-sm">
        {(phase.kind === "form" || phase.kind === "sending") && (
          <form onSubmit={submit} className="flex flex-col gap-6">
            <div className="flex items-center gap-3 border-b border-secondary/20 pb-4 text-secondary">
              <KeyRound size={24} />
              <h2 className="text-lg font-bold uppercase tracking-widest">Пошта покупця</h2>
            </div>
            <label className="flex flex-col gap-2">
              <span className="text-xs text-muted-foreground">Пошта, з якої ви купували GOTF LIVE AI</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border border-border/50 bg-black/30 p-3 font-mono text-white outline-none focus:border-secondary"
                placeholder="you@example.com"
              />
            </label>
            {error && (
              <p role="alert" className="text-sm text-red-300">
                {error}
              </p>
            )}
            <GlitchButton
              type="submit"
              disabled={phase.kind === "sending"}
              className="w-full border-secondary py-4 text-secondary hover:border-secondary hover:bg-secondary/20 disabled:opacity-50"
            >
              {phase.kind === "sending" ? "Надсилаємо…" : "Надіслати посилання"}
            </GlitchButton>
            <p className="text-xs leading-relaxed text-white/40">
              Ми надішлемо лист із посиланням, яке діє 30 хвилин. Не більше 3 запитів на добу для однієї пошти.
            </p>
          </form>
        )}

        {phase.kind === "sent" && (
          <div className="flex flex-col items-center gap-4 text-center">
            <MailCheck size={40} className="text-secondary" />
            <p className="text-white">{phase.message}</p>
            <p className="text-xs text-white/50">Не бачите листа? Перевірте «Спам» і «Промоакції».</p>
          </div>
        )}

        {(phase.kind === "checking" || phase.kind === "confirming") && (
          <p className="text-center text-primary">{phase.kind === "checking" ? "Перевіряємо посилання…" : "Скидаємо активації…"}</p>
        )}

        {phase.kind === "confirm" && (
          <div className="flex flex-col gap-6 text-center">
            <ShieldAlert size={40} className="mx-auto text-primary" />
            <p className="text-white">
              Скинути активації на <b>всіх</b> комп'ютерах для пошти <b>{phase.email}</b>?
            </p>
            <p className="text-xs text-white/50">Після цього програма на старих комп'ютерах попросить увійти знову.</p>
            <GlitchButton type="button" onClick={() => void confirm()} className="w-full py-4">
              Так, скинути
            </GlitchButton>
          </div>
        )}

        {phase.kind === "done" && (
          <div className="flex flex-col gap-4 text-center">
            <MailCheck size={40} className="mx-auto text-secondary" />
            <p className="text-white">Готово. Звільнено пристроїв: {phase.deactivated}.</p>
            <p className="text-sm text-white/70">Відкрийте GOTF LIVE AI і увійдіть з тією ж поштою та ключем:</p>
            {phase.licenses.map((l) => (
              <div key={l.key} className="border border-secondary/40 bg-black/40 p-3 text-lg tracking-wider text-secondary">
                {l.key}
                <div className="text-[10px] uppercase tracking-widest text-white/40">до {l.max_devices} комп'ютерів</div>
              </div>
            ))}
          </div>
        )}

        {phase.kind === "invalid" && (
          <div className="flex flex-col gap-4 text-center">
            <p className="text-red-300">{phase.message}</p>
            <GlitchButton
              type="button"
              onClick={() => {
                window.history.replaceState(null, "", window.location.pathname);
                setPhase({ kind: "form" });
              }}
              className="w-full"
            >
              Надіслати новий запит
            </GlitchButton>
          </div>
        )}
      </div>
    </motion.div>
  );
}
