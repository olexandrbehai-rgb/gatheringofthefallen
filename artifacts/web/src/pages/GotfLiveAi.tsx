import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { GlitchButton } from "@/components/GlitchButton";

type Purchase =
  | { kind: "none" }
  | { kind: "loading" }
  | { kind: "paid"; licenseKey: string; email: string; maxDevices: number; downloadUrl: string }
  | { kind: "pending" }
  | { kind: "error"; message: string };

const API = `${import.meta.env.BASE_URL}api/software`;

export default function GotfLiveAi() {
  const [purchase, setPurchase] = useState<Purchase>({ kind: "none" });
  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);
  const params = typeof window === "undefined" ? new URLSearchParams() : new URLSearchParams(window.location.search);
  const cancelled = params.get("payment") === "cancelled";

  useEffect(() => {
    const sessionId = params.get("session_id");
    if (params.get("payment") !== "success" || !sessionId) return;
    setPurchase({ kind: "loading" });
    fetch(`${API}/session?session_id=${encodeURIComponent(sessionId)}`)
      .then(async (r) => {
        const body = await r.json().catch(() => ({}));
        if (r.ok && body.status === "paid") setPurchase({ kind: "paid", ...body });
        else if (r.ok) setPurchase({ kind: "pending" });
        else setPurchase({ kind: "error", message: body.error || "Не вдалося перевірити оплату" });
      })
      .catch(() => setPurchase({ kind: "error", message: "Немає зв'язку з сервером" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buy = async () => {
    setBuying(true);
    setBuyError(null);
    try {
      const r = await fetch(`${API}/checkout`, { method: "POST" });
      const body = await r.json().catch(() => ({}));
      if (!r.ok || !body.url) throw new Error(body.error || "Не вдалося створити оплату");
      window.location.href = body.url;
    } catch (e) {
      setBuyError(e instanceof Error ? e.message : "Помилка");
      setBuying(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="container mx-auto max-w-4xl px-4 py-12 md:py-24">
      <h1 className="glitch-text mb-6 text-center font-creepster text-5xl text-primary md:text-7xl">GOTF LIVE AI</h1>
      <p className="mx-auto mb-10 max-w-2xl text-center font-mono text-white/70">
        Локальний AI-помічник для стрімерів: голосовий AI-чат українською і бот для TikTok LIVE, що відповідає на коментарі та
        дякує за подарунки. Працює офлайн на вашому комп'ютері.
      </p>

      {purchase.kind === "paid" ? (
        <div className="apoc-card mx-auto max-w-xl bg-black/40 p-8 text-center font-mono">
          <h2 className="mb-4 text-2xl uppercase tracking-widest text-secondary">Дякуємо за покупку!</h2>
          <p className="text-sm text-white/70">Ваш ліцензійний ключ (його також надіслано на {purchase.email}):</p>
          <div className="my-4 border border-secondary/40 bg-black/40 p-3 text-xl tracking-wider text-secondary">{purchase.licenseKey}</div>
          <a href={purchase.downloadUrl}>
            <GlitchButton type="button" className="w-full py-4">Завантажити Setup.exe</GlitchButton>
          </a>
          <p className="mt-4 text-xs text-white/50">
            Ключ працює на {purchase.maxDevices} комп'ютерах. Перевстановили Windows?{" "}
            <Link href="/gotf-live-ai/reset" className="text-primary underline">Скиньте активації тут</Link>.
          </p>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2">
          <div className="apoc-card bg-black/40 p-6 font-mono text-sm text-white/80">
            <h2 className="mb-4 text-lg uppercase tracking-widest text-secondary">Мінімальні вимоги</h2>
            <ul className="space-y-2">
              <li>Windows 10/11, 64-біт</li>
              <li>8 ГБ оперативної пам'яті</li>
              <li>4-ядерний процесор з AVX2</li>
              <li>3 ГБ вільного місця на диску</li>
            </ul>
          </div>
          <div className="apoc-card flex flex-col gap-4 bg-black/40 p-6 font-mono">
            <h2 className="text-lg uppercase tracking-widest text-secondary">Купити</h2>
            <p className="text-sm text-white/70">Разова оплата карткою через Stripe. Ключ і посилання на завантаження прийдуть на пошту.</p>
            {purchase.kind === "loading" && <p className="text-primary">Перевіряємо оплату…</p>}
            {purchase.kind === "pending" && <p className="text-primary">Оплата ще обробляється. Оновіть сторінку за хвилину.</p>}
            {purchase.kind === "error" && <p className="text-red-300">{purchase.message}</p>}
            {cancelled && <p className="text-white/60">Оплату скасовано.</p>}
            {buyError && <p className="text-red-300">{buyError}</p>}
            <GlitchButton type="button" disabled={buying} onClick={() => void buy()} className="mt-auto w-full py-4 disabled:opacity-50">
              {buying ? "Переходимо до оплати…" : "Купити"}
            </GlitchButton>
            <Link href="/gotf-live-ai/reset" className="text-center text-xs text-white/50 underline hover:text-primary">
              Вже купили й перевстановили Windows? Скинути ключ
            </Link>
          </div>
        </div>
      )}
    </motion.div>
  );
}
