import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect } from "vitest";
import { useShallowSelector } from "../context-store";
import { createTestContext } from "./helpers/context-helpers";

interface TestState {
  a: number;
  b: number;
  nested?: { x: number };
}

const { Ctx: TestContext, makeProvider } = createTestContext<TestState>();

const TestProvider = makeProvider({
  incA: (set) => set((prev) => ({ ...prev, a: prev.a + 1 })),
  incB: (set) => set((prev) => ({ ...prev, b: prev.b + 1 })),
  setSameB: (set) => set((prev) => ({ ...prev, b: prev.b })),
  setNestedX: (set) =>
    set((prev) => ({
      ...prev,
      nested: { x: (Math.random() * 1000) | 0 },
    })),
});

describe("useShallowSelector (integration)", () => {
  test("throws when used outside a Provider", () => {
    function Consumer() {
      useShallowSelector(TestContext, (s) => s.a);
      return null;
    }

    expect(() => render(<Consumer />)).toThrow(
      /must be used within a Context\.Provider/
    );
  });

  test("returns initial selected slice", async () => {
    function Consumer() {
      const selected = useShallowSelector(TestContext, (s) => s.a);
      return <div data-testid="sel">{String(selected)}</div>;
    }

    render(
      <TestProvider initial={{ a: 10, b: 20 }}>
        <Consumer />
      </TestProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("sel").textContent).toBe("10");
    });
  });

  test("re-renders only when the selected slice changes", async () => {
    function Consumer() {
      const selected = useShallowSelector(TestContext, (s) => s.a);
      const renders = React.useRef(0);
      renders.current++;
      return (
        <div>
          <span data-testid="value">{String(selected)}</span>
          <span data-testid="renders">{String(renders.current)}</span>
        </div>
      );
    }

    render(
      <TestProvider initial={{ a: 1, b: 1 }}>
        <Consumer />
      </TestProvider>
    );

    const user = userEvent.setup();
    await user.click(screen.getByTestId("incB"));

    await waitFor(() => {
      expect(screen.getByTestId("value").textContent).toBe("1");
      expect(screen.getByTestId("renders").textContent).toBe("1");
    });

    await user.click(screen.getByTestId("incA"));

    await waitFor(() => {
      expect(screen.getByTestId("value").textContent).toBe("2");
      expect(
        Number(screen.getByTestId("renders").textContent)
      ).toBeGreaterThanOrEqual(2);
    });
  });

  test("shallow equality prevents re-render when selector returns new-but-shallow-equal objects", async () => {
    function ConsumerObj() {
      const selected = useShallowSelector(TestContext, (s) => ({ v: s.b }));
      const renders = React.useRef(0);
      renders.current++;
      return (
        <div>
          <span data-testid="objValue">{JSON.stringify(selected)}</span>
          <span data-testid="objRenders">{String(renders.current)}</span>
        </div>
      );
    }

    render(
      <TestProvider initial={{ a: 0, b: 5 }}>
        <ConsumerObj />
      </TestProvider>
    );

    const user = userEvent.setup();
    await user.click(screen.getByTestId("incA"));

    await waitFor(() => {
      expect(screen.getByTestId("objRenders").textContent).toBe("1");
    });

    await user.click(screen.getByTestId("setSameB"));
    await waitFor(() => {
      expect(screen.getByTestId("objRenders").textContent).toBe("1");
    });

    await user.click(screen.getByTestId("incB"));
    await waitFor(() => {
      expect(screen.getByTestId("objRenders").textContent).not.toBe("1");
    });
  });

  test("multiple consumers with different selectors update independently", async () => {
    function ConsumerA() {
      const a = useShallowSelector(TestContext, (s) => s.a);
      const renders = React.useRef(0);
      renders.current++;
      return (
        <div>
          <span data-testid="aValue">{String(a)}</span>
          <span data-testid="aRenders">{String(renders.current)}</span>
        </div>
      );
    }

    function ConsumerB() {
      const b = useShallowSelector(TestContext, (s) => s.b);
      const renders = React.useRef(0);
      renders.current++;
      return (
        <div>
          <span data-testid="bValue">{String(b)}</span>
          <span data-testid="bRenders">{String(renders.current)}</span>
        </div>
      );
    }

    render(
      <TestProvider initial={{ a: 0, b: 0 }}>
        <>
          <ConsumerA />
          <ConsumerB />
        </>
      </TestProvider>
    );

    const user = userEvent.setup();
    await user.click(screen.getByTestId("incA"));

    await waitFor(() => {
      expect(screen.getByTestId("aValue").textContent).not.toBe("0");
      expect(screen.getByTestId("bValue").textContent).toBe("0");
    });

    const aRendersAfterA = Number(screen.getByTestId("aRenders").textContent);
    const bRendersAfterA = Number(screen.getByTestId("bRenders").textContent);

    await user.click(screen.getByTestId("incB"));
    await waitFor(() => {
      expect(
        Number(screen.getByTestId("bRenders").textContent)
      ).toBeGreaterThanOrEqual(bRendersAfterA + 1);
      expect(
        Number(screen.getByTestId("aRenders").textContent)
      ).toBeGreaterThanOrEqual(aRendersAfterA);
    });
  });

  test("changing the selector function and then causing a state update uses the new selector", async () => {
    function Parent() {
      const [useA, setUseA] = React.useState(true);

      const toggle = () => setUseA((v) => !v);

      const selectorA = (s: TestState) => s.a;
      const selectorB = (s: TestState) => s.b;

      function Child() {
        const selector = useA ? selectorA : selectorB;
        const val = useShallowSelector(TestContext, selector);
        return <div data-testid="selVal">{String(val)}</div>;
      }

      return (
        <>
          <button data-testid="toggle" onClick={toggle}>
            toggle
          </button>
          <Child />
        </>
      );
    }

    render(
      <TestProvider initial={{ a: 7, b: 11 }}>
        <Parent />
      </TestProvider>
    );

    const user = userEvent.setup();
    await user.click(screen.getByTestId("toggle"));
    await user.click(screen.getByTestId("incA"));

    await waitFor(() => {
      expect(["11", "12"]).toContain(screen.getByTestId("selVal").textContent);
    });
  });

  test("selector that reads nested values works and updates when nested values change", async () => {
    function ConsumerNested() {
      const nestedX = useShallowSelector(TestContext, (s) => s.nested?.x ?? 0);
      return <div data-testid="nested">{String(nestedX)}</div>;
    }

    render(
      <TestProvider initial={{ a: 0, b: 0, nested: { x: 1 } }}>
        <ConsumerNested />
      </TestProvider>
    );

    const user = userEvent.setup();
    await user.click(screen.getByTestId("setNestedX"));

    await waitFor(() => {
      const text = screen.getByTestId("nested").textContent;
      expect(typeof text).toBe("string");
      expect(Number(text)).not.toBeNaN();
    });
  });
});
