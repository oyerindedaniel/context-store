"use client";

import { useMemo, useState } from "react";
import { useShallowSelector } from "react-shallow-store";
import { GreetingContext, type Locale } from "@/context/greeting-provider";

export default function Demo2() {
  const [prefix, setPrefix] = useState("Hello");

  const { locale, setLocale } = useShallowSelector(GreetingContext, (s) => ({
    locale: s.locale,
    setLocale: s.setLocale,
  }));

  const name = useShallowSelector(GreetingContext, (s) => s.user);

  const greeting = useShallowSelector(
    GreetingContext,
    (s) => `${prefix} ${s.user.firstName} ${s.user.lastName}! (${s.locale})`,
    [prefix]
  );

  const locales = useMemo(() => ["en", "es", "fr"] as const, []);

  return (
    <div className="space-y-3 border rounded-md p-4">
      <h2 className="font-semibold">Demo 2: Greeting with selector deps</h2>
      <div className="flex items-center gap-2">
        <label className="text-sm">Prefix</label>
        <input
          className="border px-2 py-1 rounded"
          value={prefix}
          onChange={(e) => setPrefix(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm">Locale</label>
        <select
          className="border px-2 py-1 rounded bg-white text-gray-900 dark:bg-neutral-900 dark:text-neutral-100"
          value={locale}
          onChange={(e) => setLocale(e.target.value as Locale)}
        >
          {locales.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>
      <p>
        <span>Name:</span> {name.firstName} {name.lastName}
      </p>
      <p className="text-lg">{greeting}</p>
    </div>
  );
}
