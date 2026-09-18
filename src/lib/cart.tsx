import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  addCartLine,
  CART_STORAGE_KEY,
  normalizeCart,
  parseCartStorage,
  updateCartQty,
  type CartLine,
} from "./cart-data";

export type { CartLine } from "./cart-data";

type CartContextValue = {
  lines: CartLine[];
  count: number;
  ready: boolean;
  add: (line: CartLine) => void;
  setQty: (productId: string, variantId: string | null, qty: number) => void;
  remove: (productId: string, variantId: string | null) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function sameLine(a: CartLine, productId: string, variantId: string | null) {
  return a.productId === productId && (a.variantId ?? null) === (variantId ?? null);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const current = localStorage.getItem(CART_STORAGE_KEY);
      if (current) setLines(parseCartStorage(current));
      else setLines(normalizeCart(JSON.parse(localStorage.getItem("lp-cart-v1") || "[]")));
    } catch {
      setLines([]);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ version: 2, lines }));
      localStorage.removeItem("lp-cart-v1");
    } catch {
      /* Storage can be unavailable in private browsing. The in-memory cart still works. */
    }
  }, [lines, hydrated]);

  const add = useCallback((line: CartLine) => {
    setLines((prev) => addCartLine(prev, line));
  }, []);

  const setQty = useCallback((productId: string, variantId: string | null, qty: number) => {
    setLines((prev) => updateCartQty(prev, productId, variantId, qty));
  }, []);

  const remove = useCallback((productId: string, variantId: string | null) => {
    setLines((prev) => prev.filter((l) => !sameLine(l, productId, variantId)));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count: lines.reduce((sum, l) => sum + l.qty, 0),
      ready: hydrated,
      add,
      setQty,
      remove,
      clear,
    }),
    [lines, hydrated, add, setQty, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
