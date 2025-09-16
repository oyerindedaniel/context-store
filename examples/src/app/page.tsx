"use client";

import Demo from "@/components/app/demo";
import Demo2 from "@/components/app/demo2";
import { AppProvider } from "@/context/app-context";
import { GreetingProvider } from "@/context/greeting-provider";

export default function Home() {
  return (
    <div className="font-mono min-h-screen p-8 sm:p-20">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-xl font-bold">react-shallow-store demos</h1>
          <nav className="text-sm text-gray-500">
            Demo 1: Theme • Demo 2: Greeting
          </nav>
        </header>
        <AppProvider>
          <Demo />
        </AppProvider>
        <GreetingProvider>
          <Demo2 />
        </GreetingProvider>
      </div>
    </div>
  );
}
