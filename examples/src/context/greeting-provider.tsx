"use client";

import { createContext, useState, useCallback, type ReactNode } from "react";
import { useContextStore, type StoreApi } from "react-shallow-store";

export type Locale = "en" | "es" | "fr";

type User = {
  firstName: string;
  lastName: string;
};

type GreetingState = {
  user: User;
  locale: Locale;
  setUser: (u: User) => void;
  setLocale: (l: Locale) => void;
};

export const GreetingContext = createContext<StoreApi<GreetingState> | null>(
  null
);

export function GreetingProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User>({
    firstName: "Ada",
    lastName: "Lovelace",
  });
  const [locale, setLocaleState] = useState<Locale>("en");

  const setUser = useCallback((u: User) => setUserState(u), []);
  const setLocale = useCallback((l: Locale) => setLocaleState(l), []);

  const store = useContextStore({ user, locale, setUser, setLocale });
  return (
    <GreetingContext.Provider value={store}>
      {children}
    </GreetingContext.Provider>
  );
}
