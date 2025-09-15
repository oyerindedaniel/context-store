import * as React from "react";
import { createContext } from "react";
import { cleanup } from "@testing-library/react";
import { vi, afterEach } from "vitest";
import { useContextStore, StoreApi } from "../../context-store";

export interface ProviderProps<T> {
  initial: T;
  onStore?: (store: StoreApi<T>) => void;
  children?: React.ReactNode;
}

export function createTestContext<T>() {
  const Ctx = createContext<StoreApi<T> | null>(null);

  function makeProvider(
    defaultButtons: Record<
      string,
      (setState: React.Dispatch<React.SetStateAction<T>>) => void
    >
  ) {
    return function Provider(props: ProviderProps<T>) {
      const [state, setState] = React.useState<T>(props.initial);
      const store = useContextStore<T>(state);

      React.useLayoutEffect(() => {
        if (props.onStore) props.onStore(store);
      }, [props.onStore, store]);

      return (
        <Ctx.Provider value={store}>
          {props.children}
          {Object.entries(defaultButtons).map(([id, fn]) => (
            <button key={id} data-testid={id} onClick={() => fn(setState)}>
              {id}
            </button>
          ))}
        </Ctx.Provider>
      );
    };
  }

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  return { Ctx, makeProvider };
}
