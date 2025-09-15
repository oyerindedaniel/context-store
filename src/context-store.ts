/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  Context,
  useContext,
  useRef,
  useSyncExternalStore,
  useCallback,
  useLayoutEffect,
  useEffect,
} from "react";

const IS_CLIENT = typeof window !== "undefined";

const useIsomorphicLayoutEffect = IS_CLIENT ? useLayoutEffect : useEffect;

/**
 * Selector function type: picks slice S from full state T.
 */
export type Selector<T, S> = (state: T) => S;

/**
 * Store interface that gets passed through React Context.
 */
export interface StoreApi<T> {
  getSnapshot: () => T;
  subscribe: (listener: () => void, selector: Selector<T, any>) => () => void;
}

/**
 * Listener data for tracking selector + last selected value.
 */
interface ListenerData<T> {
  selector: Selector<T, any>;
  lastValue: any;
}

/**
 * Shallow equality comparison for objects.
 */
function shallowEqual<T>(a: T, b: T): boolean {
  if (Object.is(a, b)) return true;

  if (
    typeof a !== "object" ||
    a === null ||
    typeof b !== "object" ||
    b === null
  ) {
    return false;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) {
      return false;
    }
    if (!Object.is((a as any)[key], (b as any)[key])) {
      return false;
    }
  }

  return true;
}

function logError(...args: unknown[]) {
  if (process.env.NODE_ENV === "development") {
    console.error("[ContextStore Error]", ...args);
  }
}

/**
 * Hook: Creates a stable store reference for any value that can be passed to React Context.
 * The store reference never changes - only the internal state updates.
 * Only notifies listeners whose selected slice actually changed.
 */
/* @__NO_SIDE_EFFECTS__ */ export function useContextStore<T>(
  value: T
): StoreApi<T> {
  const stateRef = useRef<T>(value);
  const listenersRef = useRef<Map<() => void, ListenerData<T>>>(new Map());
  const storeRef = useRef<StoreApi<T> | null>(null);

  const prevValue = stateRef.current;
  const hasChanged = !Object.is(prevValue, value);

  useIsomorphicLayoutEffect(() => {
    if (!hasChanged) return;

    stateRef.current = value;

    listenersRef.current.forEach((data, listener) => {
      try {
        const newSelected = data.selector(value);

        if (!shallowEqual(data.lastValue, newSelected)) {
          data.lastValue = newSelected;
          try {
            listener();
          } catch (listenerError) {
            throw listenerError;
          }
        }
      } catch (error) {
        logError("Error in selector", error);
      }
    });
  });

  if (!storeRef.current) {
    storeRef.current = {
      getSnapshot: () => stateRef.current,
      subscribe: (listener: () => void, selector: Selector<T, any>) => {
        let currentValue;

        try {
          currentValue = selector(stateRef.current);
        } catch (error) {
          logError("Error in initial selector call during subscription", error);
          currentValue = undefined;
        }

        listenersRef.current.set(listener, {
          selector,
          lastValue: currentValue,
        });
        return () => listenersRef.current.delete(listener);
      },
    };
  }

  return storeRef.current;
}

/**
 * Hook: select a slice from context store with shallow equality.
 * Only re-renders when the selected slice actually changes.
 */
/* @__NO_SIDE_EFFECTS__ */ export function useShallowSelector<T, S>(
  context: Context<StoreApi<T> | null>,
  selector: Selector<T, S>
): S {
  const store = useContext<StoreApi<T> | null>(context);

  if (!store) {
    throw new Error(
      "useShallowSelector must be used within a Context.Provider"
    );
  }

  const lastSelectedRef = useRef<{ hasValue: boolean; value?: S }>({
    hasValue: false,
  });

  const createSnapshot = useCallback(() => {
    try {
      const state = store.getSnapshot();
      const selected = selector(state);

      if (lastSelectedRef.current.hasValue) {
        const prev = lastSelectedRef.current.value as S;
        if (shallowEqual(prev, selected)) {
          return prev;
        }
      }

      lastSelectedRef.current = { hasValue: true, value: selected };
      return selected;
    } catch (error) {
      logError("Error in createSnapshot", error);
      return lastSelectedRef.current.hasValue
        ? (lastSelectedRef.current.value as S)
        : (undefined as S);
    }
  }, [store, selector]);

  const subscribe = useCallback(
    (listener: () => void) => {
      const cleanup = store.subscribe(listener, selector);
      return () => cleanup();
    },
    [store, selector]
  );

  return useSyncExternalStore(subscribe, createSnapshot, createSnapshot);
}
