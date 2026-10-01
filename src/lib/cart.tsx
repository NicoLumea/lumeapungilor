import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { storageGet, storageSet } from "@/lib/safe-storage";

export type CartLine = {
  productId: string;
  variantId: string | null;
  qty: number;
};

const STORAGE_KEY = "lp-cart-v1";

type CartContextValue = {
  lines: CartLine[];
  count: number;
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
      const raw = storageGet("local", STORAGE_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) {
        setLines(
          parsed
            .filter(
              (l): l is CartLine =>
                !!l &&
                typeof l === "object" &&
                typeof (l as CartLine).productId === "string" &&
                Number.isFinite((l as CartLine).qty) &&
                (l as CartLine).qty > 0,
            )
            .map((l) => ({ productId: l.productId, variantId: l.variantId ?? null, qty: l.qty })),
        );
      }
    } catch {
      /* ignore malformed cart */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    storageSet("local", STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  const add = useCallback((line: CartLine) => {
    setLines((prev) => {
      const existing = prev.find((l) => sameLine(l, line.productId, line.variantId));
      if (existing) {
        return prev.map((l) =>
          sameLine(l, line.productId, line.variantId) ? { ...l, qty: l.qty + line.qty } : l,
        );
      }
      return [...prev, { ...line, variantId: line.variantId ?? null }];
    });
  }, []);

  const setQty = useCallback((productId: string, variantId: string | null, qty: number) => {
    setLines((prev) =>
      prev.map((l) => (sameLine(l, productId, variantId) ? { ...l, qty } : l)),
    );
  }, []);

  const remove = useCallback((productId: string, variantId: string | null) => {
    setLines((prev) => prev.filter((l) => !sameLine(l, productId, variantId)));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count: lines.reduce((sum, l) => sum + l.qty, 0),
      add,
      setQty,
      remove,
      clear,
    }),
    [lines, add, setQty, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
