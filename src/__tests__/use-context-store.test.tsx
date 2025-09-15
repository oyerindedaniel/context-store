import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect, vi } from "vitest";
import { StoreApi } from "../context-store";
import { createTestContext } from "./helpers/context-helpers";

interface TestState {
  count: number;
  nested?: { value: number };
}

const { makeProvider } = createTestContext<TestState>();

const CounterProvider = makeProvider({
  inc: (set) => set((prev) => ({ ...prev, count: prev.count + 1 })),
  setSame: (set) => set((prev) => ({ count: prev.count })),
  incNested: (set) =>
    set((prev) => ({
      ...prev,
      nested: { value: (prev.nested?.value ?? 0) + 1 },
    })),
});

describe("useContextStore (integration)", () => {
  test("returns the initial snapshot", async () => {
    let capturedStore: StoreApi<TestState> | null = null;

    render(
      <CounterProvider
        initial={{ count: 1 }}
        onStore={(s) => (capturedStore = s)}
      >
        <div data-testid="child" />
      </CounterProvider>
    );

    await waitFor(() => expect(capturedStore).not.toBeNull());
    expect(capturedStore!.getSnapshot()).toEqual({ count: 1 });
  });

  test("notifies subscribers on state change", async () => {
    let store: StoreApi<TestState> | null = null;

    render(
      <CounterProvider initial={{ count: 0 }} onStore={(s) => (store = s)} />
    );
    await waitFor(() => expect(store).not.toBeNull());

    const listener = vi.fn();
    const unsubscribe = store!.subscribe(listener, (s) => s.count);

    const user = userEvent.setup();
    await user.click(screen.getByTestId("inc"));

    await waitFor(() => expect(listener).toHaveBeenCalledTimes(1));
    unsubscribe();
  });

  test("does not notify when selected slice is shallow-equal", async () => {
    let store: StoreApi<TestState> | null = null;

    render(
      <CounterProvider initial={{ count: 0 }} onStore={(s) => (store = s)} />
    );
    await waitFor(() => expect(store).not.toBeNull());

    const listener = vi.fn();
    const unsubscribe = store!.subscribe(listener, (s) => s.count);

    const user = userEvent.setup();
    await user.click(screen.getByTestId("inc"));
    await waitFor(() => expect(listener).toHaveBeenCalledTimes(1));

    listener.mockClear();

    await user.click(screen.getByTestId("setSame"));
    await waitFor(() => expect(listener).toHaveBeenCalledTimes(0));

    unsubscribe();
  });

  test("unsubscribes listeners correctly", async () => {
    let store: StoreApi<TestState> | null = null;

    render(
      <CounterProvider initial={{ count: 0 }} onStore={(s) => (store = s)} />
    );
    await waitFor(() => expect(store).not.toBeNull());

    const listener = vi.fn();
    const unsubscribe = store!.subscribe(listener, (s) => s.count);

    const user = userEvent.setup();
    await user.click(screen.getByTestId("inc"));
    await waitFor(() => expect(listener).toHaveBeenCalledTimes(1));

    unsubscribe();
    listener.mockClear();

    await user.click(screen.getByTestId("inc"));
    await waitFor(() => expect(listener).toHaveBeenCalledTimes(0));
  });

  test("only notifies subscribers whose selected slice changed", async () => {
    let store: StoreApi<TestState> | null = null;

    render(
      <CounterProvider
        initial={{ count: 0, nested: { value: 0 } }}
        onStore={(s) => (store = s)}
      />
    );

    await waitFor(() => expect(store).not.toBeNull());

    const countListener = vi.fn();
    const nestedListener = vi.fn();

    const unsubA = store!.subscribe(countListener, (s) => s.count);
    const unsubB = store!.subscribe(nestedListener, (s) => s.nested?.value);

    const user = userEvent.setup();
    await user.click(screen.getByTestId("incNested"));

    await waitFor(() => {
      expect(nestedListener).toHaveBeenCalledTimes(1);
      expect(countListener).toHaveBeenCalledTimes(0);
    });

    unsubA();
    unsubB();
  });

  test("continues notifying other listeners when one selector throws", async () => {
    let store: StoreApi<TestState> | null = null;

    render(
      <CounterProvider initial={{ count: 0 }} onStore={(s) => (store = s)} />
    );
    await waitFor(() => expect(store).not.toBeNull());

    const badListener = vi.fn();
    const goodListener = vi.fn();

    store!.subscribe(badListener, () => {
      throw new Error("selector failure");
    });

    store!.subscribe(goodListener, (s) => s.count);

    const user = userEvent.setup();
    await user.click(screen.getByTestId("inc"));

    await waitFor(() => expect(goodListener).toHaveBeenCalledTimes(1));
  });

  test("store reference is stable and getSnapshot returns latest value", async () => {
    let store: StoreApi<TestState> | null = null;

    render(
      <CounterProvider initial={{ count: 0 }} onStore={(s) => (store = s)} />
    );
    await waitFor(() => expect(store).not.toBeNull());

    const before = store!;
    const beforeCount = before.getSnapshot().count;

    const user = userEvent.setup();
    await user.click(screen.getByTestId("inc"));

    await waitFor(() => {
      expect(store).toBe(before);
      expect(store!.getSnapshot().count).toBe(beforeCount + 1);
    });
  });
});
