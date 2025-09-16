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
/* @__NO_SIDE_EFFECTS__ */
export function useContextStore<T>(value: T): StoreApi<T> {
  const stateRef = useRef(value);
  const listenersRef = useRef(new Map<() => void, ListenerData<T>>());
  const storeRef = useRef<StoreApi<T> | null>(null);
  const pendingValueRef = useRef<T | null>(null);

  const prevValue = stateRef.current;
  const hasChanged = !Object.is(prevValue, value);

  if (hasChanged) {
    stateRef.current = value;
    pendingValueRef.current = value;
  }

  useIsomorphicLayoutEffect(() => {
    if (pendingValueRef.current === null) return;

    const newValue = pendingValueRef.current;
    pendingValueRef.current = null;

    listenersRef.current.forEach((data, listener) => {
      try {
        const newSelected = data.selector(newValue);

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
 *
 * - Uses `useSyncExternalStore` for React 18+ compatibility.
 * - Only re-renders when the selected slice actually changes (via shallow compare).
 * - The `selector` function is kept in a ref to avoid unnecessary re-subscriptions.
 *
 * @template T Store state type
 * @template S Selected slice type
 *
 * @param context - The React context that provides a `StoreApi<T>`.
 * @param selector - Function that selects a slice of state from the store.
 * @param deps - Optional dependency array.
 *   - By default, the subscription is created once and never re-created.
 *   - If provided, the subscription will re-mount whenever the dependencies change.
 */
/* @__NO_SIDE_EFFECTS__ */
export function useShallowSelector<T, S>(
  context: Context<StoreApi<T> | null>,
  selector: Selector<T, S>,
  deps?: React.DependencyList
): S {
  const store = useContext<StoreApi<T> | null>(context);

  if (!store) {
    throw new Error(
      "useShallowSelector must be used within a Context.Provider"
    );
  }

  const selectorRef = useRef(selector);
  const isLocked = deps === undefined;

  useIsomorphicLayoutEffect(() => {
    if (!isLocked) {
      selectorRef.current = selector;
    }
  }, deps ?? []);

  const lastSelectedRef = useRef<{ hasValue: boolean; value?: S }>({
    hasValue: false,
  });

  const createSnapshot = () => {
    try {
      const state = store.getSnapshot();
      const selected = selectorRef.current(state);

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
  };

  const subscribe = useCallback((listener: () => void) => {
    const cleanup = store.subscribe(listener, selectorRef.current);
    return () => cleanup();
  }, deps ?? []);

  return useSyncExternalStore(subscribe, createSnapshot, createSnapshot);
}
