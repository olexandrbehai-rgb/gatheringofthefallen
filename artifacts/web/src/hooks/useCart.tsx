import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

interface CartContextValue {
  count: number;
  add: () => void;
  reset: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);
  const add = useCallback(() => setCount((c) => c + 1), []);
  const reset = useCallback(() => setCount(0), []);
  return <CartContext.Provider value={{ count, add, reset }}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
