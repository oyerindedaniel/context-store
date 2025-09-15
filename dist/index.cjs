'use strict';

var react = require('react');

// src/context-store.ts
var IS_CLIENT = typeof window !== "undefined";
var useIsomorphicLayoutEffect = IS_CLIENT ? react.useLayoutEffect : react.useEffect;
function shallowEqual(a, b) {
  if (Object.is(a, b)) return true;
  if (typeof a !== "object" || a === null || typeof b !== "object" || b === null) {
    return false;
  }
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) {
      return false;
    }
    if (!Object.is(a[key], b[key])) {
      return false;
    }
  }
  return true;
}
function logError(...args) {
  if (process.env.NODE_ENV === "development") {
    console.error("[ContextStore Error]", ...args);
  }
}
function useContextStore(value) {
  const stateRef = react.useRef(value);
  const listenersRef = react.useRef(/* @__PURE__ */ new Map());
  const storeRef = react.useRef(null);
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
          listener();
        }
      } catch (error) {
        logError("Error in selector", error);
      }
    });
  });
  if (!storeRef.current) {
    storeRef.current = {
      getSnapshot: () => stateRef.current,
      subscribe: (listener, selector) => {
        let currentValue;
        try {
          currentValue = selector(stateRef.current);
        } catch (error) {
          logError("Error in initial selector call during subscription", error);
          currentValue = void 0;
        }
        listenersRef.current.set(listener, {
          selector,
          lastValue: currentValue
        });
        return () => listenersRef.current.delete(listener);
      }
    };
  }
  return storeRef.current;
}
function useShallowSelector(context, selector) {
  const store = react.useContext(context);
  if (!store) {
    throw new Error(
      "useShallowSelector must be used within a Context.Provider"
    );
  }
  const lastSelectedRef = react.useRef({
    hasValue: false
  });
  const createSnapshot = react.useCallback(() => {
    try {
      const state = store.getSnapshot();
      const selected = selector(state);
      if (lastSelectedRef.current.hasValue) {
        const prev = lastSelectedRef.current.value;
        if (shallowEqual(prev, selected)) {
          return prev;
        }
      }
      console.log("dddhh");
      lastSelectedRef.current = { hasValue: true, value: selected };
      return selected;
    } catch (error) {
      logError("Error in createSnapshot", error);
      return lastSelectedRef.current.hasValue ? lastSelectedRef.current.value : void 0;
    }
  }, [store, selector]);
  const subscribe = react.useCallback(
    (listener) => {
      let cleanup = store.subscribe(listener, selector);
      return () => cleanup();
    },
    [store, selector]
  );
  return react.useSyncExternalStore(subscribe, createSnapshot, createSnapshot);
}

exports.useContextStore = useContextStore;
exports.useShallowSelector = useShallowSelector;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map