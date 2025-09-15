"use client";

import React, {
  createContext,
  useCallback,
  useState,
  type ReactNode,
} from "react";
import { StoreApi, useContextStore } from "react-shallow-store";

type AppState = {
  count: number;
  text: string;
  items: string[];
};

type AppHandlers = {
  increment: () => void;
  decrement: () => void;
  setText: (value: string) => void;
  addItem: (value: string) => void;
  clearItems: () => void;
  reset: () => void;
};

export type AppContextValue = AppState & AppHandlers;

export const AppContext = createContext<StoreApi<AppContextValue> | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);
  const [text, setTextState] = useState("");
  const [items, setItems] = useState<string[]>([]);

  const increment = useCallback(() => {
    setCount((c) => c + 1);
  }, []);
  const decrement = useCallback(() => setCount((c) => c - 1), []);
  const setText = useCallback((value: string) => setTextState(value), []);
  const addItem = useCallback((value: string) => {
    setItems((prev) => [...prev, value]);
  }, []);
  const clearItems = useCallback(() => setItems([]), []);
  const reset = useCallback(() => {
    setCount(0);
    setTextState("");
    setItems([]);
  }, []);

  const contextValue = {
    count,
    text,
    items,
    increment,
    decrement,
    setText,
    addItem,
    clearItems,
    reset,
  };

  const appStore = useContextStore(contextValue);

  return <AppContext.Provider value={appStore}>{children}</AppContext.Provider>;
}
