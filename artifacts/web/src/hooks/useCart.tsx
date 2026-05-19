import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

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
  }, []);

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

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
