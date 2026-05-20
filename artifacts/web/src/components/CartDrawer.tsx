import { useEffect, useState } from "react";
import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { CheckoutModal } from "./CheckoutModal";

export function CartDrawer() {
  const { items, count, total, isOpen, close, removeItem, updateQty, clear } = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) close();
    };
    if (isOpen) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, close]);

  return (
    <>
      <div
        className={`fixed inset-0 z-[55] bg-black/70 backdrop-blur-sm transition-opacity ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={close}
        aria-hidden="true"
      />
      <aside
        className={`fixed top-0 right-0 z-[56] h-full w-full sm:w-[420px] bg-black border-l border-[#8a2be2]/40 shadow-[0_0_40px_rgba(138,43,226,0.45)] transform transition-transform duration-300 flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"}`}
        role="dialog"
        aria-modal="true"
        aria-label="Кошик"
      >
        <header className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <ShoppingBag size={20} className="text-[#00f0ff]" />
            <h2 className="font-creepster text-2xl text-white tracking-wide">КОШИК</h2>
            <span className="font-mono text-xs text-white/55">({count})</span>
          </div>
          <button
            onClick={close}
            aria-label="Закрити"
            className="w-9 h-9 flex items-center justify-center rounded-full border border-white/15 text-white/70 hover:text-white hover:border-[#00f0ff] transition-colors"
          >
            <X size={16} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center gap-3 text-white/45">
              <ShoppingBag size={56} strokeWidth={1} className="text-[#8a2be2]/60" />
              <p className="font-mono text-sm">Кошик поки порожній.</p>
              <p className="font-mono text-xs text-white/40">Додавай мерч, щоб тут з’явились товари.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((line) => (
                <li key={line.key} className="rounded border border-white/10 bg-black/60 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-sm text-white truncate">{line.name}</div>
                      <div className="mt-1 flex flex-wrap gap-1.5 text-[10px] font-mono uppercase tracking-[0.2em] text-white/55">
                        {line.color && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 border border-white/10 rounded-sm">
                            <span className="inline-block w-2 h-2 rounded-full border border-white/30" style={{ backgroundColor: line.color.hex }} />
                            {line.color.label}
                          </span>
                        )}
                        {line.size && (
                          <span className="px-1.5 py-0.5 border border-white/10 rounded-sm">{line.size}</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(line.key)}
                      className="text-white/45 hover:text-[#ff5a5a] transition-colors"
                      aria-label="Видалити"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQty(line.key, line.qty - 1)}
                        className="w-8 h-8 border border-white/15 flex items-center justify-center text-white/70 hover:text-[#00f0ff] hover:border-[#00f0ff]/60 transition-all"
                        aria-label="Менше"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="min-w-[1.75rem] text-center font-mono text-white">{line.qty}</span>
                      <button
                        onClick={() => updateQty(line.key, line.qty + 1)}
                        className="w-8 h-8 border border-white/15 flex items-center justify-center text-white/70 hover:text-[#00f0ff] hover:border-[#00f0ff]/60 transition-all"
                        aria-label="Більше"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <div className="font-mono text-[#00f0ff]">{line.price * line.qty} ₴</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="border-t border-white/10 px-5 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-white/55">Разом</span>
            <span className="font-mono text-2xl text-[#00f0ff]">{total} ₴</span>
          </div>
          <button
            disabled={items.length === 0}
            onClick={() => setCheckoutOpen(true)}
            className="w-full rounded border border-[#8a2be2]/70 bg-black px-5 py-3 font-mono text-sm uppercase tracking-[0.3em] text-[#00f0ff] hover:border-[#00f0ff] hover:text-white hover:shadow-[0_0_22px_rgba(0,240,255,0.55)] transition-all disabled:opacity-40 disabled:pointer-events-none"
          >
            Оформити замовлення
          </button>
          {items.length > 0 && (
            <button
              onClick={clear}
              className="w-full font-mono text-[11px] uppercase tracking-[0.3em] text-white/45 hover:text-white/80 transition-colors"
            >
              Очистити кошик
            </button>
          )}
        </footer>
      </aside>
      <CheckoutModal
        open={checkoutOpen}
        onClose={() => {
          setCheckoutOpen(false);
          close();
        }}
      />
    </>
  );
}
