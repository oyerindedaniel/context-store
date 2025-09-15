## @oyeri/context-store

Lightweight, fully-typed React context store with shallow selector support. Efficient re-rendering and ergonomic API for React 18/19.

### Install

```bash
pnpm add @oyeri/context-store
```

### API

- `useContextStore<T>(value: T): StoreApi<T>`
- `useShallowSelector<T, S>(context: React.Context<StoreApi<T>|null>, selector: (state: T) => S): S`

### Basic usage

```tsx
import { createContext } from "react";
import {
  useContextStore,
  useShallowSelector,
  type StoreApi,
} from "@oyeri/context-store";

type AppState = { count: number; text: string };
const AppContext = createContext<StoreApi<AppState> | null>(null);

function Provider({ children }: { children: React.ReactNode }) {
  const store = useContextStore({ count: 0, text: "" });
  return <AppContext.Provider value={store}>{children}</AppContext.Provider>;
}

function Counter() {
  const count = useShallowSelector(AppContext, (s) => s.count);
  return <span>{count}</span>;
}
```

### License

MIT
