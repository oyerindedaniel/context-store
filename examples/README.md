# Examples for react-shallow-store

This folder contains example Next.js usage of `react-shallow-store` with concrete, real-world scenarios.

- Development: run in this folder `pnpm install && pnpm dev`.
- The package README lives at the repository root and documents the library API.

## 1) Cart with optimistic updates and totals

This example shows an e-commerce cart with optimistic add/remove and derived totals. Components re-render only when the slice they select changes.

```tsx
// app/providers.tsx
"use client";
import { createContext, type ReactNode, useCallback, useState } from "react";
import { useContextStore, type StoreApi } from "react-shallow-store";

type CartItem = { id: string; name: string; price: number; qty: number };
type CartState = {
  items: CartItem[];
  isUpdating: boolean;
  addItem: (item: CartItem) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  clear: () => void;
};

export const CartContext = createContext<StoreApi<CartState> | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isUpdating, setUpdating] = useState(false);

  const serverDelay = (ok = true) =>
    new Promise<void>((resolve, reject) =>
      setTimeout(
        () => (ok ? resolve() : reject(new Error("server error"))),
        250
      )
    );

  const addItem = useCallback(async (item: CartItem) => {
    setUpdating(true);
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === item.id);
      if (idx === -1) return [...prev, item];
      const copy = prev.slice();
      copy[idx] = { ...copy[idx], qty: copy[idx].qty + item.qty };
      return copy;
    });
    try {
      await serverDelay(true);
    } finally {
      setUpdating(false);
    }
  }, []);

  const removeItem = useCallback(
    async (id: string) => {
      setUpdating(true);
      const prevSnapshot = items;
      setItems((prev) => prev.filter((i) => i.id !== id));
      try {
        await serverDelay(true);
      } catch {
        // rollback on failure
        setItems(prevSnapshot);
      } finally {
        setUpdating(false);
      }
    },
    [items]
  );

  const clear = useCallback(() => setItems([]), []);

  const store = useContextStore({
    items,
    isUpdating,
    addItem,
    removeItem,
    clear,
  });
  return <CartContext.Provider value={store}>{children}</CartContext.Provider>;
}

// app/cart-totals.tsx
("use client");
import { useShallowSelector } from "react-shallow-store";
import { CartContext } from "./providers";

export function CartTotals() {
  const totals = useShallowSelector(CartContext, (s) => ({
    count: s.items.reduce((n, i) => n + i.qty, 0),
    total: s.items.reduce((n, i) => n + i.qty * i.price, 0),
  }));
  return (
    <div>
      <div>Items: {totals.count}</div>
      <div>Total: ${totals.total.toFixed(2)}</div>
    </div>
  );
}

// app/cart-actions.tsx
("use client");
import { useShallowSelector } from "react-shallow-store";
import { CartContext } from "./providers";

export function CartActions() {
  const { addItem, removeItem, clear, isUpdating } = useShallowSelector(
    CartContext,
    (s) => ({
      addItem: s.addItem,
      removeItem: s.removeItem,
      clear: s.clear,
      isUpdating: s.isUpdating,
    })
  );

  return (
    <div>
      <button
        disabled={isUpdating}
        onClick={() => addItem({ id: "1", name: "Tea", price: 5, qty: 1 })}
      >
        Add Tea
      </button>
      <button disabled={isUpdating} onClick={() => removeItem("1")}>
        Remove Tea
      </button>
      <button disabled={isUpdating} onClick={clear}>
        Clear
      </button>
    </div>
  );
}
```

## 2) Theme with selector dependencies

This example shows how to use `useShallowSelector` with a dependency array.  
The `ThemeLabel` selector depends on the `prefix` prop, so it’s passed in `deps`.  
Without `deps`, the selector would stay locked to its initial closure.

```tsx
// app/theme-provider.tsx
"use client";
import { createContext, type ReactNode, useState } from "react";
import { useContextStore, type StoreApi } from "react-shallow-store";

type Theme = "light" | "dark";
type ThemeState = {
  theme: Theme;
  toggle: () => void;
};

export const ThemeContext = createContext<StoreApi<ThemeState> | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const toggle = () => setTheme((t) => (t === "light" ? "dark" : "light"));
  const store = useContextStore({ theme, toggle });
  return (
    <ThemeContext.Provider value={store}>{children}</ThemeContext.Provider>
  );
}

// app/theme-label.tsx
("use client");
import { useShallowSelector } from "react-shallow-store";
import { ThemeContext } from "./theme-provider";

export function ThemeLabel({ prefix }: { prefix: string }) {
  // selector depends on `prefix`, so we pass it in deps
  const label = useShallowSelector(
    ThemeContext,
    (s) => `${prefix}: ${s.theme}`,
    [prefix]
  );
  return <span>{label}</span>;
}

// app/theme-toggle.tsx
("use client");
import { useShallowSelector } from "react-shallow-store";
import { ThemeContext } from "./theme-provider";

export function ThemeToggle() {
  const toggle = useShallowSelector(ThemeContext, (s) => s.toggle);
  return <button onClick={toggle}>Toggle Theme</button>;
}
```
