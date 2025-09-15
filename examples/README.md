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

## 2) Feature flags + permissions (role-based UI)

Role/flags context that gates features. Components subscribe to a narrow slice so unrelated flag changes don’t re-render everything.

```tsx
// app/flags-provider.tsx
"use client";
import { createContext, type ReactNode, useCallback, useState } from "react";
import { useContextStore, type StoreApi } from "react-shallow-store";

type Role = "guest" | "user" | "admin";
type Flags = { dashboard: boolean; betaCheckout: boolean; auditLogs: boolean };
type FlagsState = {
  role: Role;
  flags: Flags;
  setRole: (r: Role) => void;
  setFlag: (k: keyof Flags, v: boolean) => void;
};

export const FlagsContext = createContext<StoreApi<FlagsState> | null>(null);

export function FlagsProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>("guest");
  const [flags, setFlags] = useState<Flags>({
    dashboard: true,
    betaCheckout: false,
    auditLogs: false,
  });

  const setRole = useCallback((r: Role) => setRoleState(r), []);
  const setFlag = useCallback(
    (k: keyof Flags, v: boolean) => setFlags((f) => ({ ...f, [k]: v })),
    []
  );

  const store = useContextStore({ role, flags, setRole, setFlag });
  return (
    <FlagsContext.Provider value={store}>{children}</FlagsContext.Provider>
  );
}

// app/secure-widgets.tsx
("use client");
import { useShallowSelector } from "react-shallow-store";
import { FlagsContext } from "./flags-provider";

export function AdminAuditLogs() {
  const canView = useShallowSelector(
    FlagsContext,
    (s) => s.role === "admin" && s.flags.auditLogs
  );
  if (!canView) return null;
  return <section>Audit Logs Widget</section>;
}

export function BetaCheckoutButton() {
  const enabled = useShallowSelector(FlagsContext, (s) => s.flags.betaCheckout);
  return <button disabled={!enabled}>Try Beta Checkout</button>;
}

export function SwitchRole() {
  const { role, setRole } = useShallowSelector(FlagsContext, (s) => ({
    role: s.role,
    setRole: s.setRole,
  }));
  return (
    <div>
      <span>Role: {role}</span>
      <button onClick={() => setRole("guest")}>Guest</button>
      <button onClick={() => setRole("user")}>User</button>
      <button onClick={() => setRole("admin")}>Admin</button>
    </div>
  );
}
```
