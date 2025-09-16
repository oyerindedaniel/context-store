# react-shallow-store

[![npm version](https://img.shields.io/npm/v/react-shallow-store)](https://www.npmjs.com/package/react-shallow-store)

Lightweight, fully-typed React context store with shallow selector support. Efficient re-rendering and ergonomic API.

## Install

```bash
# npm
npm install react-shallow-store

# pnpm
pnpm add react-shallow-store

# yarn
yarn add react-shallow-store

# bun
bun add react-shallow-store
```

## Features

- Tiny API surface → just two hooks to learn
- Shallow selector support → prevents unnecessary re-renders
- Fully typed → end-to-end TypeScript support
- Context based → no external dependencies
- React 18+ ready → works seamlessly with concurrent rendering

## API

### `useContextStore<T>(value: T): StoreApi<T>`

Creates a context-bound store from any value.

#### Parameters

- `value: T` — The initial state object (any serializable shape).

#### Returns

- `StoreApi<T>` — A store API object with `getSnapshot` and `subscribe` methods.

---

### `useShallowSelector<T, S>(context: React.Context<StoreApi<T>|null>, selector: (state: T) => S, deps?: React.DependencyList): S`

Selects a slice of state with shallow comparison.  
Re-renders only when the slice actually changes.

#### Parameters

- `context: React.Context<StoreApi<T>|null>` — A React context containing the store created by `useContextStore`.
- `selector: (state: T) => S` — A function that selects a slice of state from the store.
- `deps?: React.DependencyList` — Optional dependency array.
  - If provided, the selector is updated when dependencies change.
  - If omitted, the selector remains locked to its initial function.

#### Returns

- `S` — The selected slice of state.

## Basic usage

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

## License

This project is licensed under the [MIT License](./LICENSE).
