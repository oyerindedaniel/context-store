"use client";

import React, { useState } from "react";
import { AppContext, AppProvider } from "@/context/app-context";
import { useShallowSelector } from "react-shallow-store";

function CounterControls() {
  const { count, increment, decrement, reset } = useShallowSelector(
    AppContext,
    (state) => ({
      count: state.count,
      increment: state.increment,
      decrement: state.decrement,
      reset: state.reset,
    })
  );

  return (
    <div className="flex items-center gap-2">
      <button
        className="rounded border px-2 py-1 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
        onClick={decrement}
      >
        -
      </button>
      <span className="min-w-[3ch] text-center">{count}</span>
      <button
        className="rounded border px-2 py-1 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
        onClick={increment}
      >
        +
      </button>
      <button
        className="rounded border px-2 py-1 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
        onClick={reset}
      >
        Reset
      </button>
    </div>
  );
}

function TextInput() {
  const { text, setText } = useShallowSelector(AppContext, (state) => ({
    text: state.text,
    setText: state.setText,
  }));

  return (
    <input
      className="rounded border px-2 py-1 text-sm w-full"
      placeholder="Type text..."
      value={text}
      onChange={(e) => setText(e.target.value)}
    />
  );
}

function ItemsList() {
  const { items, addItem, clearItems } = useShallowSelector(
    AppContext,
    (state) => ({
      items: state.items,
      addItem: state.addItem,
      clearItems: state.clearItems,
    })
  );
  const [local, setLocal] = useState("");
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          className="rounded border px-2 py-1 text-sm flex-1"
          value={local}
          placeholder="Add item"
          onChange={(e) => setLocal(e.target.value)}
        />
        <button
          className="rounded border px-2 py-1 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
          onClick={() => {
            if (local) {
              addItem(local);
              setLocal("");
            }
          }}
        >
          Add
        </button>
        <button
          className="rounded border px-2 py-1 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
          onClick={clearItems}
        >
          Clear
        </button>
      </div>
      <ul className="list-disc pl-5 text-sm">
        {items.map((it, idx) => (
          <li key={idx}>{it}</li>
        ))}
      </ul>
    </div>
  );
}

function Panel() {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-black/10 dark:border-white/20 p-3">
      <h3 className="text-sm font-semibold">App Context Demo</h3>
      <CounterControls />
      <TextInput />
      <ItemsList />
    </div>
  );
}

export default function Demo() {
  return (
    <AppProvider>
      <Panel />
    </AppProvider>
  );
}
