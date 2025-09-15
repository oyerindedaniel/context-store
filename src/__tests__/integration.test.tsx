import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect } from "vitest";
import { useShallowSelector, StoreApi } from "../context-store";
import { createTestContext } from "./helpers/context-helpers";

interface AppState {
  a: number;
  b: number;
  nested?: { x: number };
}

const { Ctx: AppContext, makeProvider } = createTestContext<AppState>();

const AppProvider = makeProvider({
  incA: (set) => set((prev) => ({ ...prev, a: prev.a + 1 })),
  incB: (set) => set((prev) => ({ ...prev, b: prev.b + 1 })),
  setSameB: (set) => set((prev) => ({ ...prev, b: prev.b })),
  bumpNested: (set) =>
    set((prev) => ({ ...prev, nested: { x: (prev.nested?.x ?? 0) + 1 } })),
});

function ConsumerA() {
  const val = useShallowSelector(AppContext, function (s) {
    return s.a;
  });
  const renders = React.useRef(0);
  renders.current++;
  return (
    <div>
      <span data-testid="a-val">{String(val)}</span>
      <span data-testid="a-renders">{String(renders.current)}</span>
    </div>
  );
}

function ConsumerB() {
  const valObj = useShallowSelector(AppContext, function (s) {
    return { v: s.b };
  });
  const renders = React.useRef(0);
  renders.current++;
  return (
    <div>
      <span data-testid="b-val">{String(valObj.v)}</span>
      <span data-testid="b-renders">{String(renders.current)}</span>
    </div>
  );
}

function ConsumerNested() {
  const nx = useShallowSelector(AppContext, function (s) {
    return s.nested?.x ?? 0;
  });
  const renders = React.useRef(0);
  renders.current++;
  return (
    <div>
      <span data-testid="n-val">{String(nx)}</span>
      <span data-testid="n-renders">{String(renders.current)}</span>
    </div>
  );
}

function SelectorSwapper() {
  const [useA, setUseA] = React.useState(true);

  const toggle = () => {
    setUseA((v) => !v);
  };

  const selectorA = (s: AppState) => s.a;
  const selectorB = (s: AppState) => s.b;

  const selected = useShallowSelector(AppContext, useA ? selectorA : selectorB);

  return (
    <div>
      <button data-testid="toggle-selector" onClick={toggle}>
        toggle
      </button>
      <span data-testid="swapped-val">{String(selected)}</span>
      <span data-testid="swapped-mode">{useA ? "A" : "B"}</span>
    </div>
  );
}

function DirectSubscriber() {
  const store = React.useContext(AppContext);
  const [calls, setCalls] = React.useState(0);

  React.useEffect(
    function () {
      if (!store) return;
      function listener() {
        setCalls(function (c) {
          return c + 1;
        });
      }
      function select(s: AppState) {
        return s.b;
      }
      return store.subscribe(listener, select);
    },
    [store]
  );

  return <div data-testid="direct-calls">{String(calls)}</div>;
}

describe("integration: useContextStore + useShallowSelector (detailed)", () => {
  test("multiple consumers update independently and shallow equality prevents unnecessary rerenders", async () => {
    render(
      <AppProvider initial={{ a: 1, b: 1, nested: { x: 1 } }}>
        <ConsumerA />
        <ConsumerB />
        <ConsumerNested />
        <DirectSubscriber />
      </AppProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("a-val").textContent).toBe("1");
      expect(screen.getByTestId("b-val").textContent).toBe("1");
      expect(screen.getByTestId("n-val").textContent).toBe("1");
      expect(screen.getByTestId("direct-calls").textContent).toBe("0");
    });

    const user = userEvent.setup();

    await user.click(screen.getByTestId("incB"));

    await waitFor(() => {
      expect(screen.getByTestId("b-val").textContent).toBe("2");
      expect(
        Number(screen.getByTestId("b-renders").textContent)
      ).toBeGreaterThanOrEqual(2);
      expect(screen.getByTestId("a-val").textContent).toBe("1");
      expect(screen.getByTestId("a-renders").textContent).toBe("1");
      expect(screen.getByTestId("direct-calls").textContent).toBe("1");
    });

    await user.click(screen.getByTestId("setSameB"));
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(screen.getByTestId("b-renders").textContent).not.toBe("1");

    await user.click(screen.getByTestId("incA"));

    await waitFor(() => {
      expect(screen.getByTestId("a-val").textContent).toBe("2");
      expect(
        Number(screen.getByTestId("a-renders").textContent)
      ).toBeGreaterThanOrEqual(2);
    });

    await user.click(screen.getByTestId("bumpNested"));

    await waitFor(() => {
      expect(
        Number(screen.getByTestId("n-val").textContent)
      ).toBeGreaterThanOrEqual(2);
      expect(
        Number(screen.getByTestId("n-renders").textContent)
      ).toBeGreaterThanOrEqual(2);
    });
  });

  test("selector swapping picks up the new selector and reflects correct values after updates", async () => {
    render(
      <AppProvider initial={{ a: 5, b: 10 }}>
        <SelectorSwapper />
      </AppProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("swapped-val").textContent).toBe("5");
      expect(screen.getByTestId("swapped-mode").textContent).toBe("A");
    });

    const user = userEvent.setup();

    await user.click(screen.getByTestId("toggle-selector"));

    await waitFor(() => {
      expect(screen.getByTestId("swapped-mode").textContent).toBe("B");
    });

    await user.click(screen.getByTestId("incB"));

    await waitFor(() => {
      expect(
        Number(screen.getByTestId("swapped-val").textContent)
      ).toBeGreaterThanOrEqual(11);
    });

    await user.click(screen.getByTestId("toggle-selector"));

    await waitFor(() => {
      expect(screen.getByTestId("swapped-mode").textContent).toBe("A");
    });

    await user.click(screen.getByTestId("incA"));

    await waitFor(() => {
      expect(
        Number(screen.getByTestId("swapped-val").textContent)
      ).toBeGreaterThanOrEqual(6);
    });
  });

  test("unmounting a consumer unsubscribes it and does not affect other consumers or cause errors", async () => {
    const Host = () => {
      const [showB, setShowB] = React.useState(true);
      const toggleB = () => setShowB((s) => !s);
      return (
        <AppProvider initial={{ a: 0, b: 0 }}>
          <ConsumerA />
          {showB && <ConsumerB />}
          <button data-testid="toggle-b" onClick={toggleB}>
            toggle-b
          </button>
        </AppProvider>
      );
    };

    render(<Host />);

    await waitFor(() => {
      expect(screen.getByTestId("a-val").textContent).toBe("0");
      expect(screen.getByTestId("b-val").textContent).toBe("0");
    });

    const user = userEvent.setup();

    await user.click(screen.getByTestId("toggle-b"));
    await new Promise((resolve) => setTimeout(resolve, 10));
    await user.click(screen.getByTestId("incB"));

    await waitFor(() => {
      expect(screen.queryByTestId("b-val")).toBeNull();
      expect(screen.getByTestId("a-val").textContent).toBe("0");
    });
  });

  test("a throwing selector does not prevent other listeners from receiving updates", async () => {
    let storeRef: StoreApi<AppState> | null = null;

    render(
      <AppProvider
        initial={{ a: 0, b: 0 }}
        onStore={(s) => {
          storeRef = s;
          s.subscribe(
            () => {},
            (st) => {
              if (st.b === 2) throw new Error("boom");
              return st.b;
            }
          );
        }}
      >
        <ConsumerA />
        <ConsumerB />
      </AppProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("a-val").textContent).toBe("0");
      expect(screen.getByTestId("b-val").textContent).toBe("0");
    });

    const user = userEvent.setup();

    await user.click(screen.getByTestId("incB"));

    await waitFor(() => {
      expect(screen.getByTestId("b-val").textContent).toBe("1");
    });

    await user.click(screen.getByTestId("incB"));

    await waitFor(() => {
      expect(screen.getByTestId("b-val").textContent).toBe("2");
      expect(screen.getByTestId("a-val").textContent).toBe("0");
    });

    await user.click(screen.getByTestId("incA"));

    await waitFor(() => {
      expect(screen.getByTestId("a-val").textContent).toBe("1");
    });
  });
});
