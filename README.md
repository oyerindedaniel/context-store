# react-shallow-store

[![npm version](https://img.shields.io/npm/v/react-shallow-store)](https://www.npmjs.com/package/react-shallow-store)

Lightweight, fully-typed React context store with shallow selector support. Efficient re-rendering and ergonomic API.

### Install

```bash
npm install react-shallow-store
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
} from "react-shallow-store";

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

For more real-world examples, see the [examples README](./examples/README.md).

### License

This project is licensed under the [MIT License](./LICENSE).
