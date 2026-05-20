import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Check } from "lucide-react";

export interface CartLine {
  key: string;
  productId: string;
  name: string;
  price: number;
  qty: number;
  color?: { id: string; label: string; hex: string };
  size?: string;
  image?: string;
  mockup?: string;
}

interface CartContextValue {
  items: CartLine[];
  count: number;
  total: number;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  addItem: (item: Omit<CartLine, "key" | "qty"> & { qty?: number }) => void;
  removeItem: (key: string) => void;
  updateQty: (key: string, qty: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function makeKey(productId: string, colorId?: string, size?: string) {
  return `${productId}::${colorId ?? "-"}::${size ?? "-"}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [toast, setToast] = useState<{ name: string; ts: number } | null>(null);

  const addItem: CartContextValue["addItem"] = useCallback((item) => {
    const key = makeKey(item.productId, item.color?.id, item.size);
    const qty = item.qty ?? 1;
    setItems((prev) => {
      const existing = prev.find((l) => l.key === key);
      if (existing) {
        return prev.map((l) => (l.key === key ? { ...l, qty: l.qty + qty } : l));
      }
      return [...prev, { ...item, key, qty }];
    });
    setToast({ name: item.name, ts: Date.now() });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const removeItem = useCallback((key: string) => {
    setItems((prev) => prev.filter((l) => l.key !== key));
  }, []);

  const updateQty = useCallback((key: string, qty: number) => {
    setItems((prev) =>
      prev
        .map((l) => (l.key === key ? { ...l, qty: Math.max(1, qty) } : l))
        .filter((l) => l.qty > 0),
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const { count, total } = useMemo(() => {
    let c = 0;
    let t = 0;
    for (const l of items) {
      c += l.qty;
      t += l.qty * l.price;
    }
    return { count: c, total: t };
  }, [items]);

  const value: CartContextValue = {
    items,
    count,
    total,
    isOpen,
    open,
    close,
    addItem,
    removeItem,
    updateQty,
    clear,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
      {toast && (
        <div className="fixed top-6 right-6 z-[80] pointer-events-none">
          <div className="flex items-center gap-3 rounded-md border border-[#00f0ff]/60 bg-black/90 px-4 py-3 shadow-[0_0_24px_rgba(0,240,255,0.45)] animate-[fadeIn_0.2s_ease-out]">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#00f0ff]/15 text-[#00f0ff]">
              <Check size={16} />
            </span>
            <div className="font-mono text-sm">
              <div className="text-[#00f0ff] uppercase tracking-[0.2em] text-[11px]">Додано до кошика</div>
              <div className="text-white/80 truncate max-w-[260px]">{toast.name}</div>
            </div>
          </div>
        </div>
      )}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
