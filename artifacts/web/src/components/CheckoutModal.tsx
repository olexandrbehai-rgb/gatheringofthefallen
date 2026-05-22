import { useEffect, useState } from "react";
import { X, CheckCircle, Loader2 } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useCurrency, CURRENCIES } from "@/hooks/useCurrency";
import { priceOf } from "@/lib/pricing";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CheckoutModal({ open, onClose }: Props) {
  const { items, total, clear } = useCart();
  const { currency, countryCode, setCountry, format, formatIn } = useCurrency();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [street, setStreet] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      setSuccess(false);
      setError("");
    }
  }, [open]);

  if (!open) return null;

  const totalCad = items.reduce((s, l) => s + l.qty * priceOf(l.productType, "CAD"), 0);
  const isValid =
    name.trim() &&
    email.trim() &&
    phone.trim() &&
    city.trim() &&
    street.trim() &&
    postalCode.trim() &&
    items.length > 0;

  const countryMeta =
    CURRENCIES.find((c) => c.countryCode === countryCode) ?? CURRENCIES[0];
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || submitting) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`${apiBaseUrl}/api/cart-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            country: `${countryMeta.flag} ${countryMeta.name}`,
            countryCode,
            currency,
            city: city.trim(),
            street: street.trim(),
            postalCode: postalCode.trim(),
          },
          items: items.map((l) => ({
            productId: l.productId,
            productType: l.productType,
            name: l.name,
            size: l.size ?? "",
            qty: l.qty,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Помилка відправки");
      }
      clear();
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || "Не вдалося відправити замовлення");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3 bg-black/60 border border-white/15 text-white font-mono text-sm focus:border-[#00f0ff] focus:outline-none transition-colors placeholder:text-white/35";

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-2xl max-h-[92vh] overflow-auto rounded-lg border border-[#8a2be2]/50 bg-black shadow-[0_0_40px_rgba(138,43,226,0.5)]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/95 backdrop-blur">
          <h2 className="font-creepster text-2xl text-white tracking-wide">
            {success ? "ЗАМОВЛЕННЯ ПРИЙНЯТО" : "ОФОРМЛЕННЯ ЗАМОВЛЕННЯ"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Закрити"
            className="w-9 h-9 flex items-center justify-center rounded-full border border-white/15 text-white/70 hover:text-white hover:border-[#00f0ff] transition-colors"
          >
            <X size={16} />
          </button>
        </header>

        {success ? (
          <div className="p-8 text-center space-y-5">
            <CheckCircle size={64} className="mx-auto text-[#00f0ff]" />
            <h3 className="font-creepster text-3xl text-white">Дякуємо!</h3>
            <p className="font-mono text-sm text-white/70">
              Ми отримали ваше замовлення і зв'яжемось з вами на <span className="text-[#00f0ff]">{email}</span> або
              за телефоном для уточнення деталей доставки та оплати.
            </p>
            <button
              onClick={onClose}
              className="mt-4 inline-flex rounded border border-[#8a2be2]/70 bg-black px-6 py-3 font-mono text-sm uppercase tracking-[0.3em] text-[#00f0ff] hover:border-[#00f0ff] hover:text-white hover:shadow-[0_0_22px_rgba(0,240,255,0.55)] transition-all"
            >
              Закрити
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <section>
              <h3 className="font-mono text-xs uppercase tracking-[0.3em] text-[#8a2be2] mb-3">
                Ваше замовлення
              </h3>
              <ul className="space-y-2 rounded border border-white/10 bg-black/50 p-3">
                {items.length === 0 ? (
                  <li className="font-mono text-sm text-white/50 text-center py-3">
                    Кошик порожній
                  </li>
                ) : (
                  items.map((line) => {
                    const lineTotal = priceOf(line.productType, currency) * line.qty;
                    return (
                      <li key={line.key} className="flex items-center justify-between gap-3 font-mono text-sm">
                        <div className="min-w-0 flex-1">
                          <div className="text-white truncate">{line.name}</div>
                          <div className="text-white/45 text-[11px] uppercase tracking-[0.2em]">
                            {line.size ? `Розмір ${line.size} · ` : ""}× {line.qty}
                          </div>
                        </div>
                        <div className="text-[#00f0ff]">{format(lineTotal)}</div>
                      </li>
                    );
                  })
                )}
              </ul>
              <div className="mt-3 flex items-center justify-between font-mono">
                <span className="text-xs uppercase tracking-[0.3em] text-white/55">Разом</span>
                <div className="text-right">
                  <div className="text-2xl text-[#00f0ff]">{format(total)}</div>
                  {currency !== "CAD" && (
                    <div className="text-[11px] text-white/40">
                      ≈ {formatIn(totalCad, "CAD")}
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="font-mono text-xs uppercase tracking-[0.3em] text-[#8a2be2]">
                Контактні дані
              </h3>
              <input
                type="text"
                placeholder="Ім'я та прізвище *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={inputClass}
              />
              <input
                type="email"
                placeholder="Email *"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputClass}
              />
              <input
                type="tel"
                placeholder="Номер телефону *"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className={inputClass}
              />
            </section>

            <section className="space-y-3">
              <h3 className="font-mono text-xs uppercase tracking-[0.3em] text-[#8a2be2]">
                Адреса доставки
              </h3>
              <div>
                <label className="font-mono text-[11px] uppercase tracking-[0.25em] text-white/50 block mb-2">
                  Країна (визначає валюту)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {CURRENCIES.map((c) => {
                    const active = countryCode === c.countryCode;
                    return (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => setCountry(c.countryCode)}
                        className={`flex flex-col items-center gap-1 px-3 py-3 border font-mono text-xs transition-all ${active ? "border-[#00f0ff] bg-[#00f0ff]/10 text-white shadow-[0_0_16px_rgba(0,240,255,0.35)]" : "border-white/15 text-white/55 hover:border-[#8a2be2]/70 hover:text-white"}`}
                      >
                        <span className="text-2xl leading-none">{c.flag}</span>
                        <span className="uppercase tracking-[0.2em]">{c.code}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <input
                type="text"
                placeholder="Місто *"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                className={inputClass}
              />
              <input
                type="text"
                placeholder="Вулиця, будинок, квартира *"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                required
                className={inputClass}
              />
              <input
                type="text"
                placeholder="Поштовий індекс *"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                required
                className={inputClass}
              />
            </section>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-center">
                <p className="font-mono text-sm text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={!isValid || submitting}
              className="w-full rounded border border-[#8a2be2]/70 bg-black px-5 py-4 font-mono text-sm uppercase tracking-[0.3em] text-[#00f0ff] hover:border-[#00f0ff] hover:text-white hover:shadow-[0_0_22px_rgba(0,240,255,0.55)] transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Відправка...
                </>
              ) : (
                <>Відправити замовлення</>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
